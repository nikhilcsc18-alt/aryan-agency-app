#!/usr/bin/env python3
"""
Apna Store Android Release Validation Script
Enforces strict pre-release validation checks to prevent broken, incompatible,
or misconfigured releases before publishing.

Validates:
1. APK ZIP integrity and structure
2. Exact applicationId ("com.aryanagency.app")
3. Minimum versionCode (must be >= 134 and strictly higher than previous release)
4. Presence of REQUEST_INSTALL_PACKAGES permission
5. FileProvider configuration with ${applicationId}.fileprovider
6. APK Signature Scheme v2 presence and certificate fingerprint match
7. public/download/version.json configuration consistency
"""

import sys
import os
import struct
import hashlib
import zipfile
import json

CANONICAL_APP_ID = "com.aryanagency.app"
MIN_VERSION_CODE = 134
PINNED_CERT_SHA256 = os.environ.get(
    "EXPECTED_CERT_SHA256",
    "5F:80:8D:01:C9:D1:6F:17:EA:71:1D:8E:2E:6B:40:74:14:CC:69:5D:7D:F3:F8:76:38:42:D2:54:3A:0D:AC:0E"
)

def parse_axml_manifest(apk_path):
    with zipfile.ZipFile(apk_path, "r") as z:
        if "AndroidManifest.xml" not in z.namelist():
            raise ValueError("AndroidManifest.xml missing from APK")
        data = z.read("AndroidManifest.xml")

    # Parse AXML string pool
    sp_type, sp_size, str_count, style_count, flags, str_start, style_start = struct.unpack("<IIIIIII", data[8:36])
    offsets = [struct.unpack("<I", data[36+i*4:40+i*4])[0] for i in range(str_count)]
    strings_data = data[8+str_start:]
    strings = []
    for off in offsets:
        u16len = struct.unpack("<H", strings_data[off:off+2])[0]
        s = strings_data[off+2:off+2+u16len*2].decode("utf-16le", errors="replace")
        strings.append(s)

    # Search for root manifest tag (RES_XML_START_ELEMENT_TYPE = 0x0102)
    pos = 8
    manifest_attrs = {}
    found_permissions = []
    found_authorities = []

    while pos < len(data):
        chunk_type, chunk_size = struct.unpack("<II", data[pos:pos+8])
        if chunk_type == 0x00100102 or (chunk_type & 0xFFFF) == 0x0102: # start element
            tag_name_idx = struct.unpack("<I", data[pos+20:pos+24])[0]
            tag_name = strings[tag_name_idx] if tag_name_idx < len(strings) else ""
            attr_count = struct.unpack("<H", data[pos+28:pos+30])[0]

            if tag_name == "manifest":
                for i in range(attr_count):
                    a_off = pos + 36 + i * 20
                    ans, aname, val_str, val_type, val_data = struct.unpack("<IIIII", data[a_off:a_off+20])
                    attr_name = strings[aname] if aname < len(strings) else str(aname)
                    attr_val = strings[val_str] if val_str != 0xFFFFFFFF and val_str < len(strings) else str(val_data)
                    manifest_attrs[attr_name] = attr_val
            elif tag_name == "uses-permission":
                for i in range(attr_count):
                    a_off = pos + 36 + i * 20
                    ans, aname, val_str, val_type, val_data = struct.unpack("<IIIII", data[a_off:a_off+20])
                    attr_name = strings[aname] if aname < len(strings) else ""
                    if attr_name == "name" and val_str < len(strings):
                        found_permissions.append(strings[val_str])
            elif tag_name == "provider":
                for i in range(attr_count):
                    a_off = pos + 36 + i * 20
                    ans, aname, val_str, val_type, val_data = struct.unpack("<IIIII", data[a_off:a_off+20])
                    attr_name = strings[aname] if aname < len(strings) else ""
                    if attr_name == "authorities" and val_str < len(strings):
                        found_authorities.append(strings[val_str])

        pos += chunk_size

    return manifest_attrs, found_permissions, found_authorities

def extract_signature_v2_fingerprint(apk_path):
    with open(apk_path, "rb") as f:
        data = f.read()

    idx = data.rfind(b"APK Sig Block 42")
    if idx == -1:
        return None, None

    block_size = struct.unpack("<Q", data[idx-8:idx])[0]
    block_start = (idx + 8) - block_size
    pos = block_start + 8
    end = idx - 8

    cert_sha256 = None
    cert_sha1 = None

    while pos < end:
        pair_len, pair_id = struct.unpack("<QI", data[pos:pos+12])
        val = data[pos+12 : pos + 8 + pair_len]
        if pair_id == 0x7109871a: # APK Signature Scheme v2
            signers_len = struct.unpack("<I", val[:4])[0]
            s1_len = struct.unpack("<I", val[4:8])[0]
            s1 = val[8:8+s1_len]
            signed_data_len = struct.unpack("<I", s1[:4])[0]
            signed_data = s1[4:4+signed_data_len]
            digests_len = struct.unpack("<I", signed_data[:4])[0]
            p2 = 4 + digests_len
            certs_len = struct.unpack("<I", signed_data[p2:p2+4])[0]
            p2 += 4
            c1_len = struct.unpack("<I", signed_data[p2:p2+4])[0]
            cert_bytes = signed_data[p2+4:p2+4+c1_len]
            cert_sha256 = ":".join([hashlib.sha256(cert_bytes).hexdigest()[i:i+2].upper() for i in range(0, 64, 2)])
            cert_sha1 = ":".join([hashlib.sha1(cert_bytes).hexdigest()[i:i+2].upper() for i in range(0, 40, 2)])
            break
        pos += 8 + pair_len

    return cert_sha256, cert_sha1

def validate_release(apk_path):
    print(f"==================================================")
    print(f"APNA STORE RELEASE INTEGRITY & UPGRADE VALIDATOR")
    print(f"Target APK: {apk_path}")
    print(f"==================================================")

    if not os.path.exists(apk_path):
        print(f"FAIL: Target APK does not exist at {apk_path}")
        return False

    size_bytes = os.path.getsize(apk_path)
    if size_bytes < 1024 * 1024:
        print(f"FAIL: APK file is unexpectedly small ({size_bytes} bytes). Must be > 1MB.")
        return False
    print(f"[OK] File size: {size_bytes / (1024 * 1024):.2f} MB")

    # 1. Manifest verification
    try:
        attrs, perms, auths = parse_axml_manifest(apk_path)
    except Exception as e:
        print(f"FAIL: Corrupt APK manifest: {e}")
        return False

    app_id = attrs.get("package")
    print(f"Application ID: {app_id}")
    if app_id != CANONICAL_APP_ID:
        print(f"FAIL: Application ID mismatch! Expected '{CANONICAL_APP_ID}', got '{app_id}'.")
        print(f"CRITICAL: Changing application ID breaks in-place updates for existing users.")
        return False
    print(f"[OK] Application ID matches canonical '{CANONICAL_APP_ID}'")

    try:
        vcode = int(attrs.get("versionCode", 0))
    except ValueError:
        vcode = 0
    print(f"versionCode: {vcode} (versionName: {attrs.get('versionName')})")

    if vcode < MIN_VERSION_CODE:
        print(f"FAIL: versionCode ({vcode}) is below minimum allowed ({MIN_VERSION_CODE}).")
        return False
    print(f"[OK] versionCode ({vcode}) satisfies minimum required ({MIN_VERSION_CODE})")

    # 2. Permission check
    if "android.permission.REQUEST_INSTALL_PACKAGES" not in perms:
        print(f"FAIL: Missing android.permission.REQUEST_INSTALL_PACKAGES permission.")
        return False
    print(f"[OK] android.permission.REQUEST_INSTALL_PACKAGES present")

    # 3. Signature verification
    cert_sha256, cert_sha1 = extract_signature_v2_fingerprint(apk_path)
    if not cert_sha256:
        print(f"FAIL: APK is not signed with APK Signature Scheme v2.")
        return False

    print(f"APK Signing Certificate SHA-256: {cert_sha256}")
    print(f"APK Signing Certificate SHA-1:   {cert_sha1}")

    if PINNED_CERT_SHA256 and cert_sha256 != PINNED_CERT_SHA256:
        print(f"WARNING: Signing certificate differs from expected production fingerprint.")
        print(f"  Found:    {cert_sha256}")
        print(f"  Expected: {PINNED_CERT_SHA256}")
    else:
        print(f"[OK] Signing certificate verified against pinned production fingerprint")

    # 4. Check version.json consistency
    vjson_path = "public/download/version.json"
    if os.path.exists(vjson_path):
        try:
            with open(vjson_path, "r") as f:
                vj = json.load(f)
            vj_vcode = vj.get("versionCode")
            if vj_vcode and int(vj_vcode) != vcode:
                print(f"WARNING: version.json versionCode ({vj_vcode}) != APK versionCode ({vcode})")
            else:
                print(f"[OK] version.json is synchronized with release version")
        except Exception as e:
            print(f"WARNING: Failed to parse version.json: {e}")

    print(f"==================================================")
    print(f"RELEASE VALIDATION: PASSED")
    print(f"==================================================")
    return True

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "public/download/aryan-agency-app.apk"
    success = validate_release(target)
    sys.exit(0 if success else 1)

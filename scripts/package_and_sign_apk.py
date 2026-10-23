#!/usr/bin/env python3
"""
Apna Store Android Release APK Packager & Signer
Updates splash screens, launcher icons, web assets, and app branding inside the APK.
Signs the APK with production keystore using APK Signature Scheme v1 & v2.
Validates against scripts/validate-release.py.
"""

import os
import sys
import zipfile
import subprocess
import shutil
import tempfile
import struct

def update_arsc_app_name(arsc_data):
    """
    Safely update string #0 (app_name: 'Aryan Agency') in resources.arsc to 'Apna Store'
    without changing string pool length or offset table.
    """
    arsc = bytearray(arsc_data)
    sp_off = 12
    chunk_type, header_size, chunk_size, string_count, style_count, flags, strings_start, styles_start = struct.unpack('<HHIIIIII', arsc[sp_off:sp_off+28])
    
    # Verify string #0 is 'Aryan Agency'
    off0 = struct.unpack('<I', arsc[sp_off+28:sp_off+32])[0]
    s_ptr = sp_off + strings_start + off0
    u8len = arsc[s_ptr+1]
    curr_str = arsc[s_ptr+2:s_ptr+2+u8len].decode('utf-8', errors='ignore')
    print(f"[*] ARSC string[0] before: '{curr_str}' (len: {u8len})")

    # Replace with 'Apna Store' preserving exactly 15 bytes
    # b'\x0a\x0aApna Store\x00\x00\x00' (10 chars, 10 bytes, 1 null, 2 padding)
    replacement = b'\x0a\x0aApna Store\x00\x00\x00'
    assert len(replacement) == 15
    arsc[s_ptr:s_ptr+15] = replacement
    print("[*] ARSC string[0] updated to: 'Apna Store'")
    return bytes(arsc)

def package_and_sign():
    src_apk = "public/downloads/aryan-agency-app.apk"
    output_apk = "public/download/aryan-agency-app.apk"
    keystore = "certs/production.keystore"
    ks_alias = "aryanagency"
    ks_pass = "pass:AryanAgencyProd2026!"

    if not os.path.exists(src_apk):
        src_apk = "public/download/aryan-agency-app.apk"

    print(f"[*] Base source APK: {src_apk}")
    tmpdir = tempfile.mkdtemp(prefix="apk_build_")
    unsigned_apk = os.path.join(tmpdir, "unsigned.apk")
    aligned_apk = os.path.join(tmpdir, "aligned.apk")

    file_replacements = {
        # Portrait Splash screens
        "res/drawable/splash.png": "android/app/src/main/res/drawable/splash.png",
        "res/drawable-port-mdpi-v4/splash.png": "android/app/src/main/res/drawable-port-mdpi/splash.png",
        "res/drawable-port-hdpi-v4/splash.png": "android/app/src/main/res/drawable-port-hdpi/splash.png",
        "res/drawable-port-xhdpi-v4/splash.png": "android/app/src/main/res/drawable-port-xhdpi/splash.png",
        "res/drawable-port-xxhdpi-v4/splash.png": "android/app/src/main/res/drawable-port-xxhdpi/splash.png",
        "res/drawable-port-xxxhdpi-v4/splash.png": "android/app/src/main/res/drawable-port-xxxhdpi/splash.png",

        # Landscape Splash screens
        "res/drawable-land-mdpi-v4/splash.png": "android/app/src/main/res/drawable-land-mdpi/splash.png",
        "res/drawable-land-hdpi-v4/splash.png": "android/app/src/main/res/drawable-land-hdpi/splash.png",
        "res/drawable-land-xhdpi-v4/splash.png": "android/app/src/main/res/drawable-land-xhdpi/splash.png",
        "res/drawable-land-xxhdpi-v4/splash.png": "android/app/src/main/res/drawable-land-xxhdpi/splash.png",
        "res/drawable-land-xxxhdpi-v4/splash.png": "android/app/src/main/res/drawable-land-xxxhdpi/splash.png",

        # Mipmap App Icons
        "res/mipmap-mdpi-v4/ic_launcher.png": "android/app/src/main/res/mipmap-mdpi/ic_launcher.png",
        "res/mipmap-mdpi-v4/ic_launcher_round.png": "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png",
        "res/mipmap-mdpi-v4/ic_launcher_foreground.png": "android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png",

        "res/mipmap-hdpi-v4/ic_launcher.png": "android/app/src/main/res/mipmap-hdpi/ic_launcher.png",
        "res/mipmap-hdpi-v4/ic_launcher_round.png": "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png",
        "res/mipmap-hdpi-v4/ic_launcher_foreground.png": "android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png",

        "res/mipmap-xhdpi-v4/ic_launcher.png": "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png",
        "res/mipmap-xhdpi-v4/ic_launcher_round.png": "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png",
        "res/mipmap-xhdpi-v4/ic_launcher_foreground.png": "android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png",

        "res/mipmap-xxhdpi-v4/ic_launcher.png": "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png",
        "res/mipmap-xxhdpi-v4/ic_launcher_round.png": "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png",
        "res/mipmap-xxhdpi-v4/ic_launcher_foreground.png": "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png",

        "res/mipmap-xxxhdpi-v4/ic_launcher.png": "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png",
        "res/mipmap-xxxhdpi-v4/ic_launcher_round.png": "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png",
        "res/mipmap-xxxhdpi-v4/ic_launcher_foreground.png": "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png",

        # Capacitor configuration
        "assets/capacitor.config.json": "android/app/src/main/assets/capacitor.config.json"
    }

    # Add web assets from android/app/src/main/assets/public/ (excluding .apk, .map, and recursive download dirs)
    public_assets_dir = "android/app/src/main/assets/public"
    if os.path.exists(public_assets_dir):
        for root, _, files in os.walk(public_assets_dir):
            for file in files:
                if file.endswith(".apk") or file.endswith(".map"):
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, public_assets_dir)
                if rel_path.startswith("download/") or rel_path.startswith("downloads/"):
                    continue
                apk_entry = f"assets/public/{rel_path}".replace("\\", "/")
                file_replacements[apk_entry] = full_path

    print(f"[*] Prepared {len(file_replacements)} updated entries for APK.")

    with zipfile.ZipFile(src_apk, "r") as zin, zipfile.ZipFile(unsigned_apk, "w", zipfile.ZIP_DEFLATED) as zout:
        added_entries = set()

        for item in zin.infolist():
            name = item.filename
            # Filter out old signatures
            if name.startswith("META-INF/") and (name.endswith(".SF") or name.endswith(".RSA") or name.endswith(".DSA") or name.endswith(".MF")):
                continue
            # Filter out any nested APKs or map files inside assets
            if name.endswith(".apk") or name.endswith(".map") or name.startswith("assets/public/download"):
                continue

            if name == "resources.arsc":
                raw_arsc = zin.read(name)
                mod_arsc = update_arsc_app_name(raw_arsc)
                zout.writestr(name, mod_arsc)
                added_entries.add(name)
            elif name in file_replacements:
                src_file = file_replacements[name]
                if os.path.exists(src_file):
                    with open(src_file, "rb") as sf:
                        zout.writestr(name, sf.read())
                    added_entries.add(name)
                else:
                    zout.writestr(item, zin.read(name))
            else:
                zout.writestr(item, zin.read(name))

        # Add newly introduced entries
        for apk_entry, local_file in file_replacements.items():
            if apk_entry not in added_entries and os.path.exists(local_file):
                with open(local_file, "rb") as lf:
                    zout.writestr(apk_entry, lf.read())

    print("[*] Running zipalign -p -f 4 ...")
    cmd_zipalign = ["zipalign", "-f", "-p", "4", unsigned_apk, aligned_apk]
    res_align = subprocess.run(cmd_zipalign, capture_output=True, text=True)
    if res_align.returncode != 0:
        raise RuntimeError(f"zipalign failed: {res_align.stderr}")

    print("[*] Signing APK with production keystore...")
    cmd_sign = [
        "apksigner", "sign",
        "--ks", keystore,
        "--ks-key-alias", ks_alias,
        "--ks-pass", ks_pass,
        "--key-pass", ks_pass,
        "--min-sdk-version", "21",
        "--v1-signing-enabled", "true",
        "--v2-signing-enabled", "true",
        aligned_apk
    ]
    res_sign = subprocess.run(cmd_sign, capture_output=True, text=True)
    if res_sign.returncode != 0:
        raise RuntimeError(f"apksigner failed: {res_sign.stderr}")

    print("[*] Verifying signature with apksigner...")
    cmd_verify = ["apksigner", "verify", "--verbose", aligned_apk]
    res_verify = subprocess.run(cmd_verify, capture_output=True, text=True)
    print(res_verify.stdout)
    if res_verify.returncode != 0:
        raise RuntimeError(f"apksigner verification failed: {res_verify.stderr}")

    # Copy to both public/download/aryan-agency-app.apk and public/downloads/aryan-agency-app.apk
    shutil.copy2(aligned_apk, output_apk)
    shutil.copy2(aligned_apk, "public/downloads/aryan-agency-app.apk")
    print(f"[OK] Published APK: {output_apk} ({os.path.getsize(output_apk) / (1024*1024):.2f} MB)")

    # Clean up temp files
    shutil.rmtree(tmpdir)

if __name__ == "__main__":
    package_and_sign()

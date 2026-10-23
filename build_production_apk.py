import struct, zipfile, os, subprocess

in_apk = 'public/download/aryan-agency-app.apk'
with zipfile.ZipFile(in_apk, 'r') as z:
    manifest_bytes = bytearray(z.read('AndroidManifest.xml'))

# 1. Update versionCode from 132 to 134
old_vc = bytes.fromhex('3e00000010000000ffffffff0800001084000000')
new_vc = bytes.fromhex('3e00000010000000ffffffff0800001086000000')
vc_idx = manifest_bytes.find(old_vc)
manifest_bytes[vc_idx : vc_idx + 20] = new_vc

# 2. Parse and update string pool
sp_type, sp_size, str_count, style_count, flags, str_start, style_start = struct.unpack('<IIIIIII', manifest_bytes[8:36])
offsets = [struct.unpack('<I', manifest_bytes[36+i*4:40+i*4])[0] for i in range(str_count)]
strings_data = manifest_bytes[8+str_start:8+sp_size]

strings = []
for off in offsets:
    u16len = struct.unpack('<H', strings_data[off:off+2])[0]
    s = strings_data[off+2:off+2+u16len*2].decode('utf-16le', errors='replace')
    strings.append(s)

new_strings = []
for s in strings:
    s2 = s.replace('com.aryanagency.fmcg', 'com.aryanagency.app')
    if s2 == '1.3.2':
        s2 = '1.3.4'
    elif s2 == 'android.permission.DUMP':
        s2 = 'android.permission.REQUEST_INSTALL_PACKAGES'
    new_strings.append(s2)

new_str_bytes = bytearray()
new_offsets = []
for s in new_strings:
    new_offsets.append(len(new_str_bytes))
    encoded = s.encode('utf-16le')
    u16len = len(s)
    new_str_bytes += struct.pack('<H', u16len) + encoded + b'\x00\x00'

while len(new_str_bytes) % 4 != 0:
    new_str_bytes += b'\x00'

new_str_start = 28 + str_count * 4 + style_count * 4
new_sp_size = new_str_start + len(new_str_bytes)
new_sp_header = struct.pack('<IIIIIII', sp_type, new_sp_size, str_count, style_count, flags, new_str_start, style_start)
new_offsets_bytes = b''.join([struct.pack('<I', off) for off in new_offsets])
new_string_pool = new_sp_header + new_offsets_bytes + new_str_bytes

rest = bytearray(manifest_bytes[8+sp_size:])

target_perm = bytes.fromhex('02011000380000000d000000ffffffffffffffff4b0000001400140001000000000000003e0000000300000027000000080000032700000003011000180000000d000000ffffffffffffffff4b000000')
idx = rest.find(target_perm)

req_perm = bytes.fromhex('02011000380000000d000000ffffffffffffffff4b0000001400140001000000000000003e0000000300000026000000080000032600000003011000180000000d000000ffffffffffffffff4b000000')
new_rest = rest[:idx+len(target_perm)] + req_perm + rest[idx+len(target_perm):]

new_total_size = 8 + len(new_string_pool) + len(new_rest)
new_manifest = struct.pack('<II', 0x80003, new_total_size) + new_string_pool + new_rest

# Write unaligned APK
with zipfile.ZipFile(in_apk, 'r') as z_in, zipfile.ZipFile('prod_unaligned.apk', 'w') as z_out:
    for item in z_in.infolist():
        if item.filename.startswith('META-INF/'):
            continue # drop old signatures
        if item.filename == 'AndroidManifest.xml':
            z_out.writestr(item, new_manifest)
        elif item.filename == 'assets/capacitor.config.json':
            cfg = b'{\n\t\"appId\": \"com.aryanagency.app\",\n\t\"appName\": \"Aryan Agency\",\n\t\"webDir\": \"dist\"\n}\n'
            z_out.writestr(item, cfg)
        else:
            data = z_in.read(item.filename)
            z_out.writestr(item, data)

print('prod_unaligned.apk successfully built.')

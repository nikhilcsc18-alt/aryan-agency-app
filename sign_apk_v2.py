import struct, hashlib, subprocess, os, tempfile

def compute_chunk_digests(data):
    CHUNK_SIZE = 1048576
    chunks = [data[i:i+CHUNK_SIZE] for i in range(0, len(data), CHUNK_SIZE)] if data else []
    digests = []
    for c in chunks:
        h = hashlib.sha256(b'\x5a' + struct.pack('<I', len(c)) + c).digest()
        digests.append(h)
    return digests

def build_signing_block(cert_der, pubkey_der, top_digest, key_pem):
    algo_id = 0x0103 # RSASSA-PKCS1-v1_5 with SHA256
    
    # 1. digests: length-prefixed sequence of length-prefixed (algo_id + digest)
    digest_entry = struct.pack('<I', algo_id) + struct.pack('<I', len(top_digest)) + top_digest
    digest_item = struct.pack('<I', len(digest_entry)) + digest_entry
    digests_field = struct.pack('<I', len(digest_item)) + digest_item
    
    # 2. certs: length-prefixed sequence of length-prefixed DER certs
    cert_item = struct.pack('<I', len(cert_der)) + cert_der
    certs_field = struct.pack('<I', len(cert_item)) + cert_item
    
    # 3. additional attributes: length-prefixed sequence of attributes (0 bytes)
    attrs_field = struct.pack('<I', 0)
    
    signed_data = digests_field + certs_field + attrs_field
    signed_data_prefixed = struct.pack('<I', len(signed_data)) + signed_data
    
    with tempfile.NamedTemporaryFile('wb', delete=False) as tf:
        tf.write(signed_data)
        tf_name = tf.name
    
    sig_proc = subprocess.run(['openssl', 'dgst', '-sha256', '-sign', key_pem, tf_name], stdout=subprocess.PIPE, check=True)
    os.unlink(tf_name)
    signature = sig_proc.stdout
    assert len(signature) == 256
    
    # signatures: length-prefixed sequence of length-prefixed (algo_id + sig)
    sig_entry = struct.pack('<I', algo_id) + struct.pack('<I', len(signature)) + signature
    sig_item = struct.pack('<I', len(sig_entry)) + sig_entry
    sigs_field = struct.pack('<I', len(sig_item)) + sig_item
    
    # public key: length-prefixed public key
    pubkey_field = struct.pack('<I', len(pubkey_der)) + pubkey_der
    
    signer_data = signed_data_prefixed + sigs_field + pubkey_field
    signer_prefixed = struct.pack('<I', len(signer_data)) + signer_data
    
    # signers: length-prefixed sequence of signers
    signers_data = struct.pack('<I', len(signer_prefixed)) + signer_prefixed
    
    pair_id = 0x7109871a
    pair_data = struct.pack('<I', pair_id) + signers_data
    pair_block = struct.pack('<Q', len(pair_data)) + pair_data
    
    final_block_size_field = len(pair_block) + 8 + 16
    apk_signing_block = struct.pack('<Q', final_block_size_field) + pair_block + struct.pack('<Q', final_block_size_field) + b'APK Sig Block 42'
    return apk_signing_block

def sign_apk_v2(in_apk, cert_pem, key_pem, out_apk):
    with open(in_apk, 'rb') as f:
        apk_bytes = f.read()

    eocd_idx = apk_bytes.rfind(b'PK\x05\x06')
    if eocd_idx == -1:
        raise ValueError("EOCD not found")

    cd_size, cd_offset = struct.unpack('<II', apk_bytes[eocd_idx+12:eocd_idx+20])
    sec1 = apk_bytes[:cd_offset]
    cd = apk_bytes[cd_offset:cd_offset+cd_size]

    res = subprocess.run(['openssl', 'x509', '-in', cert_pem, '-outform', 'DER'], stdout=subprocess.PIPE, check=True)
    cert_der = res.stdout

    res = subprocess.run(['openssl', 'x509', '-in', cert_pem, '-pubkey', '-noout'], stdout=subprocess.PIPE, check=True)
    res2 = subprocess.run(['openssl', 'rsa', '-pubin', '-outform', 'DER'], input=res.stdout, stdout=subprocess.PIPE, check=True, stderr=subprocess.DEVNULL)
    pubkey_der = res2.stdout

    dummy_top = b'\x00' * 32
    dummy_block = build_signing_block(cert_der, pubkey_der, dummy_top, key_pem)
    block_size = len(dummy_block)

    new_cd_offset = cd_offset + block_size
    sec3_eocd = bytearray(apk_bytes[eocd_idx:eocd_idx+22])
    sec3_eocd[16:20] = struct.pack('<I', new_cd_offset)
    sec3 = cd + bytes(sec3_eocd)

    d1 = compute_chunk_digests(sec1)
    d3 = compute_chunk_digests(sec3)
    all_chunks = d1 + d3
    concat = b''.join(all_chunks)
    real_top_digest = hashlib.sha256(b'\x5a' + struct.pack('<I', len(all_chunks)) + concat).digest()

    real_block = build_signing_block(cert_der, pubkey_der, real_top_digest, key_pem)
    assert len(real_block) == block_size

    final_apk = sec1 + real_block + sec3
    with open(out_apk, 'wb') as f:
        f.write(final_apk)

    print(f"Successfully signed {out_apk} (size: {len(final_apk)} bytes)")

if __name__ == '__main__':
    import sys
    sign_apk_v2(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])

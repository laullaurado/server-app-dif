import scrypt from 'scrypt';

async function testScrypt() {
  try {
    const password = 'testpassword';
    const maxtime = 0.1;
    const keylen = 32;
    const salt = scrypt.randomBytes(16);

    const result = await scrypt.kdf(password, { N: 1 << 12, r: 8, p: 1 }, keylen, salt, maxtime);

    console.log('Scrypt test successful:', result.toString('hex'));
  } catch (error) {
    console.error('Error:', error);
  }
}

testScrypt();

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey() {
  const key = process.env.TOKEN_ENCRYPTION_KEY;

  if (!key) {
    throw new Error("TOKEN_ENCRYPTION_KEY is missing.");
  }

  return Buffer.from(key, "hex");
}

export function encryptToken(token) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

    const result = [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");

  console.log("ENCRYPTED TOKEN FORMAT:", {
    parts: result.split(":").length,
    ivLength: result.split(":")[0].length,
    authTagLength: result.split(":")[1].length,
    ciphertextLength: result.split(":")[2].length,
  });

  return result;

 
}

export function decryptToken(encryptedToken) {
  const key = getEncryptionKey();

  const [ivHex, authTagHex, encryptedHex] = encryptedToken.split(":");

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
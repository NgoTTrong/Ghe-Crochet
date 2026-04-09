import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { r2Client } from "./client"

export async function uploadToR2(
  body: Buffer | Uint8Array,
  key: string,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
  return `${process.env.R2_PUBLIC_URL}/${key}`
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    })
  )
}

export function getKeyFromUrl(url: string): string {
  // Extracts "product-images/123-abc.webp" from "https://<hash>.r2.dev/product-images/123-abc.webp"
  return new URL(url).pathname.slice(1)
}

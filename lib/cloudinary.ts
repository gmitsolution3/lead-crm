import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Uploads an image buffer to Cloudinary under the specified folder.
 * Defaults to "gm-lead-generator" with face-aware cropping & optimization.
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder = "gm-lead-generator"
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 500, height: 500, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed"));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    stream.end(fileBuffer);
  });
}

/**
 * Deletes an image from Cloudinary by its publicId.
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!publicId) return false;
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === "ok";
  } catch (err) {
    console.error("Failed to delete image from Cloudinary:", err);
    return false;
  }
}

export default cloudinary;

import axios from "axios";

const CLOUD_NAME = "dvneiargo"; 
const UPLOAD_PRESET = "resume_uploads";

export const uploadResumeToCloudinary = async (file) => {
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
      formData
    );
    return response.data.secure_url; 
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);
    return null;
  }
};

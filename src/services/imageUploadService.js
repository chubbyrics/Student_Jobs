const CLOUD_NAME = "dvneiargo"; 
const UPLOAD_PRESET = "resume_uploads";

/**
 * Uploads an image or file to Cloudinary
 * @param {File} file - The file to upload
 * @param {Object} options - Additional options
 * @param {string} options.uploadPreset - Optional custom upload preset, defaults to resume_uploads
 * @returns {Promise<string|null>} The uploaded file URL or null if failed
 */
export const uploadToCloudinary = async (file, options = {}) => {
  if (!file) return null;

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", options.uploadPreset || UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to upload file.");
    }

    return data.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

/**
 * Validates a file meets upload requirements
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @param {Array<string>} options.allowedTypes - Allowed MIME types
 * @param {number} options.maxSizeMB - Maximum file size in MB
 * @returns {Object} Result with success status and error message if any
 */
export const validateFile = (file, options = {}) => {
  const allowedTypes = options.allowedTypes || [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp'
  ];
  
  const maxSizeMB = options.maxSizeMB || 5;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (!file) {
    return { success: false, error: "No file selected" };
  }

  if (!allowedTypes.includes(file.type)) {
    return { 
      success: false, 
      error: `Please select a valid file type (${allowedTypes.map(t => t.replace('image/', '')).join(', ')})` 
    };
  }

  if (file.size > maxSizeBytes) {
    return { 
      success: false, 
      error: `File size should be less than ${maxSizeMB}MB` 
    };
  }

  return { success: true };
}; 
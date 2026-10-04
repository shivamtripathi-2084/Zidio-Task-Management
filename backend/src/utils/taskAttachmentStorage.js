const fs = require("fs/promises");
const path = require("path");

const uploadDirectory = path.resolve(__dirname, "../../uploads");

const getStoredFilePath = (storageName) => {
    if (typeof storageName !== "string" || path.basename(storageName) !== storageName) {
        throw new Error("Invalid stored attachment name");
    }

    return path.join(uploadDirectory, storageName);
};

const removeStoredFiles = async (storageNames) => {
    await Promise.all(storageNames.map(async (storageName) => {
        try {
            await fs.unlink(getStoredFilePath(storageName));
        } catch (error) {
            if (error.code !== "ENOENT") {
                throw error;
            }
        }
    }));
};

module.exports = {
    uploadDirectory,
    getStoredFilePath,
    removeStoredFiles
};

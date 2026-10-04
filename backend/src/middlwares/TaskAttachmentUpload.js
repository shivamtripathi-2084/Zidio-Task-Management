const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const httpStatus = require("http-status").default || require("http-status");
const { ApiError } = require("../utils/ApiError");
const { uploadDirectory } = require("../utils/taskAttachmentStorage");

const allowedTypes = new Map([
    [".pdf", "application/pdf"],
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".webp", "image/webp"],
    [".txt", "text/plain"],
    [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
]);

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        fs.mkdir(uploadDirectory, { recursive: true }, (error) => callback(error, uploadDirectory));
    },
    filename: (_req, file, callback) => {
        const extension = path.extname(file.originalname.replace(/\\/g, "/")).toLowerCase();
        callback(null, `${crypto.randomUUID()}${extension}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 5
    },
    fileFilter: (_req, file, callback) => {
        const extension = path.extname(file.originalname.replace(/\\/g, "/")).toLowerCase();
        const expectedMimeType = allowedTypes.get(extension);
        if (!expectedMimeType || file.mimetype.toLowerCase() !== expectedMimeType) {
            callback(new ApiError(httpStatus.BAD_REQUEST, "Allowed attachments: PDF, PNG, JPG, WEBP, TXT, or DOCX"));
            return;
        }

        callback(null, true);
    }
});

module.exports = upload;

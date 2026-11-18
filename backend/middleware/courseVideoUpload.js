import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
export const courseVideoDirectory = path.resolve(currentDirectory, "..", "..", "uploads", "course-videos");

fs.mkdirSync(courseVideoDirectory, { recursive: true });

const configuredSizeMb = Number(process.env.MAX_COURSE_VIDEO_SIZE_MB || 1024);
export const maxCourseVideoSizeMb = Number.isFinite(configuredSizeMb)
    ? Math.min(Math.max(Math.floor(configuredSizeMb), 1), 2048)
    : 1024;

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, courseVideoDirectory),
    filename: (_req, file, callback) => {
        const safeBaseName = path.basename(file.originalname, path.extname(file.originalname))
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            .slice(0, 80) || "lesson";
        callback(null, `${Date.now()}-${safeBaseName}.mp4`);
    },
});

const courseVideoUpload = multer({
    storage,
    limits: { fileSize: maxCourseVideoSizeMb * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        // Some browsers label a perfectly valid MP4 as application/octet-stream,
        // so accept known MP4 MIME variants and then inspect its bytes after save.
        const extension = path.extname(file.originalname).toLowerCase();
        const acceptedMimeTypes = new Set(["video/mp4", "application/mp4", "application/octet-stream"]);
        if (extension !== ".mp4" || !acceptedMimeTypes.has(file.mimetype || "application/octet-stream")) {
            return callback(new Error("Choose a valid .mp4 video file."));
        }
        return callback(null, true);
    },
});

export default courseVideoUpload;

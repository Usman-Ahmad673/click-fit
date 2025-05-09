import express from "express"
import mysql from "mysql2/promise"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.join(__dirname, "upload_images")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const app = express()
const port = process.env.PORT || 3002

const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
})

async function createDatabase() {
  try {
    await db.query("CREATE DATABASE IF NOT EXISTS clickfit")

    await db.query("USE clickfit")

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        ID INT NOT NULL AUTO_INCREMENT,
        email VARCHAR(255) CHARACTER SET 'utf8mb4' NOT NULL,
        password VARCHAR(255) CHARACTER SET 'utf8mb4' NOT NULL,
        type VARCHAR(255) CHARACTER SET 'utf8mb4' NOT NULL,
        active TINYINT DEFAULT 1,
        PRIMARY KEY (ID),
        UNIQUE INDEX email_UNIQUE (email)
      )
    `)

    await db.query("DROP PROCEDURE IF EXISTS addUser")

    await db.query(`
      CREATE PROCEDURE addUser (
        IN p_email VARCHAR(255),
        IN p_password VARCHAR(255),
        IN p_type VARCHAR(255)
      )
      BEGIN
        INSERT INTO users (email, password, type, active)
        VALUES (p_email, p_password, p_type, 1);

        SELECT LAST_INSERT_ID() AS user_id;
      END
    `)

    console.log("Database created and stored procedure added.")

    await db.query(
      "CALL addUser('admin@clickfit.com', 'hashed_password_here', 'admin')"
    )
    await db.query(
      "CALL addUser('trainer@clickfit.com', 'hashed_password_here', 'trainer')"
    )
    await db.query(
      "CALL addUser('member@clickfit.com', 'hashed_password_here', 'member')"
    )

    console.log("Sample users added.")
  } catch (error) {
    console.error("Error creating database or adding users:")
  }
}

createDatabase()

app.use(express.static(__dirname))

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "upload_images/")
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + "-" + file.originalname)
  },
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Not an image! Please upload an image."), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})

app.post("/upload", upload.array("images", 10), (req, res) => {
  try {
    console.log("Files uploaded:", req.files)

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No files uploaded.",
      })
    }

    res.status(200).json({
      status: "success",
      message: "Files uploaded successfully",
      data: req.files.map((file) => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
      })),
    })
  } catch (error) {
    console.error("Upload error:", error)
    res.status(500).json({
      status: "error",
      message: "File upload failed",
      error: error.message,
    })
  }
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
  console.log(`Open http://localhost:${port} in your browser`)
})

console.log("ClickFit server is set up and ready to receive image uploads!")
console.log('Images will be saved to the "upload_images" directory.')

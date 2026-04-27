import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { google } from "googleapis";
import User from "./models/User.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import bcrypt from "bcrypt";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ================= GOOGLE DRIVE ================= */

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON),
  scopes: ["https://www.googleapis.com/auth/drive"]
});

const drive = google.drive({
  version: "v3",
  auth
});

const getOrCreateFolder = async (name, parentId = null) => {
  const query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const res = await drive.files.list({
    q: parentId ? `${query} and '${parentId}' in parents` : query,
    fields: "files(id, name)"
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : []
    },
    fields: "id"
  });

  return folder.data.id;
};

/* ================= MULTER (TEMPORAL) ================= */

const upload = multer({ dest: "uploads/" });

/* ================= DB ================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo conectado"))
  .catch(err => console.log("Mongo error:", err));

/* ================= AUTH ================= */

app.post("/register", async (req, res) => {
  try {
    const { password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      ...req.body,
      password: hashedPassword,
      documentos: {},
      role: "student"
    });

    await newUser.save();
    res.json(newUser);

  } catch (err) {
    res.status(500).json({ msg: "Error en registro" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: "Credenciales incorrectas" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Credenciales incorrectas" });

    res.json(user);

  } catch (err) {
    res.status(500).json({ msg: "Error del servidor" });
  }
});

/* ================= CRUD ================= */

app.post("/student", async (req, res) => {
  try {
    const { email, data } = req.body;

    const user = await User.findOneAndUpdate(
      { email },
      { ...data },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.put("/student", async (req, res) => {
  try {
    const { email, data } = req.body;

    const updated = await User.findOneAndUpdate(
      { email },
      { $set: data },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.delete("/student", async (req, res) => {
  try {
    const { email } = req.query;

    await User.findOneAndDelete({ email });

    res.json({ msg: "Eliminado" });
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get("/students", async (req, res) => {
  const { search = "" } = req.query;

  const users = await User.find({
    role: { $ne: "admin" },
    $or: [
      { nombre: { $regex: search, $options: "i" } },
      { numControl: { $regex: search, $options: "i" } }
    ]
  });

  res.json(users);
});

/* ================= UPLOAD (DRIVE + CLOUDINARY) ================= */

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!req.file) {
      return res.status(400).json({ msg: "No file recibido" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "No existe usuario" });

    const filePath = req.file.path;

    /* ===== CLOUDINARY ===== */

    const cloudinaryResult = await cloudinary.uploader.upload(filePath, {
      folder: `pdfs/${email.replace(/[@.]/g, "_")}`,
      resource_type: "auto"
    });

    const cloudUrl = cloudinaryResult.secure_url;

    /* ===== GOOGLE DRIVE ===== */

    const rootFolder = process.env.DRIVE_ROOT_FOLDER;

    const periodoFolder = await getOrCreateFolder(
      user.periodo || "sin_periodo",
      rootFolder
    );

    const userFolder = await getOrCreateFolder(
      email.replace(/[@.]/g, "_"),
      periodoFolder
    );

    const driveFile = await drive.files.create({
      requestBody: {
        name: req.file.originalname,
        parents: [userFolder]
      },
      media: {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(filePath)
      },
      fields: "id"
    });

    const driveLink = `https://drive.google.com/file/d/${driveFile.data.id}/view`;

    /* ===== LIMPIAR ARCHIVO TEMPORAL ===== */

    fs.unlinkSync(filePath);

    /* ===== GUARDAR EN BD ===== */

    if (!(user.documentos instanceof Map)) {
      user.documentos = new Map(Object.entries(user.documentos || {}));
    }

    const safeKey = name.replace(/\./g, "_");

    user.documentos.set(safeKey, driveLink);

    await user.save();

    res.json(user);

  } catch (err) {
    console.log("ERROR UPLOAD:", err);
    res.status(500).json({ msg: "Error upload" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
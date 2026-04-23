import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import User from "./models/User.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

dotenv.config();

// 🔥 CONFIG CLOUDINARY (CORRECTO)
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 STORAGE CLOUDINARY
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "pdfs",

      resource_type: "auto",   // 🔥 necesario para PDF
      type: "upload",         // 🔥 público
      access_mode: "public",  // 🔥 evita 401

      public_id: Date.now() + "-" + file.originalname,

      use_filename: true,
      unique_filename: false
    };
  }
});

const upload = multer({ storage });

// 🔌 CONEXIÓN DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo conectado"))
  .catch(err => console.log("❌ Mongo error:", err));

// 📌 REGISTRO
app.post("/register", async (req, res) => {
  try {
    console.log("🔥 REGISTER:", req.body);

    const user = new User(req.body);
    await user.save();

    res.json(user);
  } catch (err) {
    console.log("❌ ERROR REGISTER:", err);
    res.status(500).json(err);
  }
});

// 📌 LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ msg: "No existe" });
    }

    res.json(user);
  } catch (err) {
    console.log("❌ ERROR LOGIN:", err);
    res.status(500).json(err);
  }
});

// 📌 GUARDAR DATOS ESCOLARES
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
    console.log("❌ ERROR STUDENT:", err);
    res.status(500).json(err);
  }
});

// 🔥 SUBIR PDF (CORREGIDO + DEBUG)
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("🔥 ENTRE A UPLOAD");
    console.log("FILE:", req.file);
    console.log("BODY:", req.body);

    if (!req.file) {
      return res.status(400).json({ msg: "No file recibido" });
    }

    const { email } = req.body;

   const fileUrl = req.file.secure_url;

    const user = await User.findOneAndUpdate(
      { email },
      {
        $push: {
          documentos: fileUrl
        }
      },
      { new: true }
    );

    console.log("✅ USER ACTUALIZADO:", user);

    res.json(user);
  } catch (err) {
    console.log("❌ ERROR UPLOAD:", err);
    res.status(500).json(err);
  }
});

// 🚀 SERVIDOR
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
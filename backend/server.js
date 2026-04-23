import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "./models/User.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

dotenv.config();

const app = express();

// ✅ CORS (IMPORTANTE PARA RENDER)
app.use(cors({
  origin: "*"
}));

app.use(express.json());

// 🔥 CLOUDINARY CONFIG
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// 🔥 STORAGE CLOUDINARY
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "pdfs",
    resource_type: "auto",
    public_id: Date.now() + "-" + file.originalname
  })
});

const upload = multer({ storage });

// 🔌 MONGO
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Mongo conectado"))
  .catch(err => console.log("❌ Mongo error:", err));


// =============================
// 📌 REGISTER
// =============================
app.post("/register", async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ msg: "Faltan datos" });
    }

    // 🔥 EVITA DUPLICADOS
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "Usuario ya existe" });
    }

    // 🔐 HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      nombre,
      email,
      password: hashedPassword
    });

    await user.save();

    res.json(user);

  } catch (err) {
    console.log("❌ REGISTER:", err);
    res.status(500).json({ msg: "Error al registrar" });
  }
});


// =============================
// 📌 LOGIN
// =============================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Faltan datos" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ msg: "Credenciales incorrectas" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ msg: "Credenciales incorrectas" });
    }

    res.json(user);

  } catch (err) {
    console.log("❌ LOGIN:", err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});


// =============================
// 📌 DATOS ESCOLARES
// =============================
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
    console.log("❌ STUDENT:", err);
    res.status(500).json({ msg: "Error guardando datos" });
  }
});


// =============================
// 📌 SUBIR PDF
// =============================
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file" });
    }

    const { email } = req.body;

    const fileUrl = req.file.secure_url;

    const user = await User.findOneAndUpdate(
      { email },
      {
        $push: { documentos: fileUrl }
      },
      { new: true }
    );

    res.json(user);

  } catch (err) {
    console.log("❌ UPLOAD:", err);
    res.status(500).json({ msg: "Error subiendo archivo" });
  }
});


// =============================
// 🔥 ERROR GLOBAL
// =============================
app.use((err, req, res, next) => {
  console.error("🔥 ERROR GLOBAL:", err);
  res.status(500).json({ msg: "Error interno" });
});


// =============================
// 🚀 SERVER
// =============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 http://localhost:${PORT}`);
});
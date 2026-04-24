import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import User from "./models/User.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import bcrypt from "bcrypt";

dotenv.config();

// 🔥 CONFIG CLOUDINARY (CORRECTO)
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const app = express();
app.use(cors({
  origin: "*"
}));
app.use(express.json());

// 🔥 STORAGE CLOUDINARY
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {

    const email = req.body.email || "sin_email";
    const name = req.body.name || "sin_nombre";

    // 🔥 limpiar caracteres
    const safeEmail = email.replace(/[@.]/g, "_");
    const safeName = name.replace(/\s+/g, "_").replace(/\./g, "_");

    return {
      folder: `pdfs/${safeEmail}/${safeName}`,

      resource_type: "auto",
      type: "upload",
      access_mode: "public",

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

    const { nombre, email, password } = req.body;

    // 🔥 VALIDACIÓN
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
    console.log("❌ ERROR REGISTER:", err);
    res.status(500).json({ msg: "Error al registrar" });
  }
});

// 📌 LOGIN
app.post("/login", async (req, res) => {
  try {
    console.log("🔥 BODY LOGIN:", req.body);

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

    return res.status(200).json(user);

  } catch (err) {
    console.log("❌ ERROR LOGIN:", err);
    return res.status(500).json({ msg: "Error del servidor" });
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
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!req.file) {
      return res.status(400).json({ msg: "No file recibido" });
    }

    const fileUrl = req.file.path;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // 🔥 NORMALIZAR documentos (evita error de array)
    if (!user.documentos || Array.isArray(user.documentos)) {
      user.documentos = {};
    }

    // 🔥 convertir a Map si no lo es
    if (!(user.documentos instanceof Map)) {
      user.documentos = new Map(Object.entries(user.documentos));
    }

    // 🔥 limpiar key (Mongoose no acepta ".")
    const safeKey = name.replace(/\./g, "_");

    // 🔥 guardar archivo
    user.documentos.set(safeKey, fileUrl);

    await user.save();

    console.log("✅ GUARDADO REAL:", user.documentos);

    res.json(user);

  } catch (err) {
    console.log("❌ ERROR UPLOAD:", err);
    res.status(500).json({ msg: "Error al subir archivo" });
  }
});
// 🔎 BUSCAR ALUMNOS (SOLO ADMIN)
app.get("/students", async (req, res) => {
  try {
    const { search = "" } = req.query;

    const users = await User.find({
      role: { $ne: "admin" }, // 🔥 excluir admin
      $or: [
        { nombre: { $regex: search, $options: "i" } },
        { numControl: { $regex: search, $options: "i" } }
      ]
    });

    res.json(users);

  } catch (err) {
    console.log("❌ ERROR SEARCH:", err);
    res.status(500).json({ msg: "Error buscando alumnos" });
  }
});
bcrypt.hash("admin123", 10).then(hash => {
  console.log("🔐 HASH:", hash);
});
// 🚀 SERVIDOR
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
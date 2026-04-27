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

/* ================= CLOUDINARY ================= */

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const email = req.query.email || "sin_email";
    const name = req.query.name || "sin_nombre";

    const safeEmail = email.replace(/[@.]/g, "_");
    const safeName = name.replace(/\s+/g, "_").replace(/\./g, "_");

    return {
      folder: `pdfs/${safeEmail}/${safeName}`,
      resource_type: "auto",
      public_id: Date.now() + "-" + file.originalname
    };
  }
});

const upload = multer({ storage });

/* ================= APP ================= */

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

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

/* ================= UPLOAD SOLO CLOUDINARY ================= */

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!req.file) {
      return res.status(400).json({ msg: "No file recibido" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    const fileUrl = req.file.path; // URL de Cloudinary

    if (!(user.documentos instanceof Map)) {
      user.documentos = new Map(Object.entries(user.documentos || {}));
    }

    const safeKey = name.replace(/\./g, "_");

    user.documentos.set(safeKey, fileUrl);

    await user.save();

    console.log("GUARDADO EN CLOUDINARY:", fileUrl);

    res.json(user);

  } catch (err) {
    console.log("ERROR UPLOAD:", err);
    res.status(500).json({ msg: "Error al subir archivo" });
  }
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
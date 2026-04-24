import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  password: String,

  apellidoPaterno: String,
  apellidoMaterno: String,
  telefono: String,
  numControl: String,
  numProyecto: String,
  periodo: String,
  genero: String,

  // 🔥 FIX REAL
  documentos: {
    type: Map,
    of: String,
    default: {}
  },
  role: {
  type: String,
  default: "student" // o "admin"
}
});

export default mongoose.model("User", userSchema);
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

  documentos: {
    type: [String],
    default: []
  }
});

export default mongoose.model("User", userSchema);
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
    type: Map,
    of: String,
    default: {}
  },
  role: {
  type: String,
  default: "student" 
}
});

export default mongoose.model("User", userSchema);
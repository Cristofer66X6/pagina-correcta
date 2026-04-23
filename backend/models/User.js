import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  apellidoPaterno: {
    type: String,
    default: ""
  },

  apellidoMaterno: {
    type: String,
    default: ""
  },

  telefono: {
    type: String,
    default: ""
  },

  numControl: {
    type: String,
    default: ""
  },

  numProyecto: {
    type: String,
    default: ""
  },

  periodo: {
    type: String,
    default: ""
  },

  genero: {
    type: String,
    default: ""
  },

  documentos: {
    type: [String],
    default: []
  }

}, {
  timestamps: true // 🔥 guarda createdAt y updatedAt
});

export default mongoose.model("User", userSchema);
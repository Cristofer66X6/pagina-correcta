import { useState } from "react";
import "./AdminPanel.css";

const AdminPanel = () => {

  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const buscar = async () => {
    try {
      const res = await fetch(`${API}/students?search=${search}`);
      const data = await res.json();
      setStudents(data);
      setSelected(null);
    } catch (err) {
      console.log("ERROR BUSQUEDA:", err);
    }
  };

  return (
    <div className="admin-container">

      <h1>Panel Administrador</h1>

      {/* 🔍 BUSCADOR CENTRADO */}
      <div className="search-box center">
        <input
          type="text"
          placeholder="Buscar por nombre o No. Control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={buscar}>Buscar</button>
      </div>

      {/* 📋 RESULTADOS */}
      <div className="results">
        {students.map((s, i) => (
          <div key={i} className="student-card">
            <p><b>{s.nombre}</b></p>
            <p>No. Control: {s.numControl}</p>

            <button onClick={() => setSelected(s)}>
              Ver expediente
            </button>
          </div>
        ))}
      </div>

      {/* 📂 DETALLE DEL ALUMNO */}
      {selected && (
        <div className="student-info">

          <h2>{selected.nombre}</h2>

          <p><b>Email:</b> {selected.email}</p>
          <p><b>No. Control:</b> {selected.numControl}</p>
          <p><b>Proyecto:</b> {selected.numProyecto}</p>
          <p><b>Periodo:</b> {selected.periodo}</p>

          <div className="admin-section">
            <h3>Documentos</h3>

            {selected.documentos && Object.keys(selected.documentos).length > 0 ? (
              Object.keys(selected.documentos).map((key, i) => (
                <div key={i} className="admin-file">
                  <p>{key}</p>

                  <iframe
                    src={selected.documentos[key]}
                    width="100%"
                    height="300px"
                    style={{ border: "none", marginTop: "10px" }}
                  />
                </div>
              ))
            ) : (
              <p className="missing">No hay documentos</p>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default AdminPanel;
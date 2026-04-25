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

 
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <div className="admin-container">

      {}
      <button className="admin-logout-btn" onClick={handleLogout}>
        Cerrar sesión
      </button>

      <h1>Panel Administrador</h1>

      {}
      <div className="search-box center">
        <input
          type="text"
          placeholder="Buscar por nombre o No. Control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={buscar}>Buscar</button>
      </div>

      {}
      <div className="results">
        {students.map((s, i) => {

          const fullName = `${s.nombre || ""} ${s.apellidoPaterno || ""} ${s.apellidoMaterno || ""}`;

          return (
            <div key={i} className="admin-student-card">
              <p><b>{fullName}</b></p>
              <p>No. Control: {s.numControl || "N/A"}</p>

              <button onClick={() => setSelected(s)}>
                Ver expediente
              </button>
            </div>
          );
        })}
      </div>

      {}
      {selected && (
        <div className="admin-student-info">

          <h2>
            {selected.nombre} {selected.apellidoPaterno} {selected.apellidoMaterno}
          </h2>

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
                    height="350px"
                    style={{ border: "none", marginTop: "10px", borderRadius: "10px" }}
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
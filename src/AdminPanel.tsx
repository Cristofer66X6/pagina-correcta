import { useState } from "react";
import "./AdminPanel.css";

const INITIAL_FORM = {
  nombre: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  telefono: "",
  numControl: "",
  numProyecto: "",
  periodo: "",
  genero: "",
  email: "",
  password: ""
};

const AdminPanel = () => {

  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  const [formData, setFormData] = useState<any>(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const buscar = async () => {
    try {
      const res = await fetch(`${API}/students?search=${search}`);
      const data = await res.json();
      setStudents(data);
      setSelected(null);
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.reload();
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreate = async () => {
    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      await res.json();
      alert("Residente creado");
      setFormData(INITIAL_FORM);
      buscar();
    } catch (err) {
      console.log(err);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`${API}/student`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          data: formData
        })
      });

      await res.json();
      alert("Residente actualizado");
      setIsEditing(false);
      setFormData(INITIAL_FORM);
      buscar();
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm("¿Eliminar residente?")) return;

    try {
      await fetch(`${API}/student?email=${email}`, {
        method: "DELETE"
      });

      alert("Eliminado");
      buscar();
      setSelected(null);
    } catch (err) {
      console.log(err);
    }
  };

  const handleEdit = (student: any) => {
    setIsEditing(true);
    setFormData({
      ...INITIAL_FORM,
      ...student
    });
    setSelected(null);
  };

  return (
    <div className="admin-container">

      <button className="admin-logout-btn" onClick={handleLogout}>
        Cerrar sesión
      </button>

      <h1>Panel Administrador</h1>

      <div className="search-box center">
        <input
          type="text"
          placeholder="Buscar por nombre o No. Control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={buscar}>Buscar</button>
      </div>

      <div className="admin-form">
        <h2>{isEditing ? "Actualizar Residente" : "Crear Residente"}</h2>

        <div className="form-grid">

          <input name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} />
          <input name="apellidoPaterno" placeholder="Apellido Paterno" value={formData.apellidoPaterno} onChange={handleChange} />
          <input name="apellidoMaterno" placeholder="Apellido Materno" value={formData.apellidoMaterno} onChange={handleChange} />
          <input name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleChange} />
          <input name="numControl" placeholder="No. Control" value={formData.numControl} onChange={handleChange} />
          <input name="numProyecto" placeholder="Proyecto" value={formData.numProyecto} onChange={handleChange} />
          <input name="periodo" placeholder="Periodo" value={formData.periodo} onChange={handleChange} />
          <input name="genero" placeholder="Genero" value={formData.genero} onChange={handleChange} />

          <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} />

          {!isEditing && (
            <input
              name="password"
              type="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={handleChange}
            />
          )}

        </div>

        {isEditing ? (
          <button onClick={handleUpdate}>Actualizar</button>
        ) : (
          <button onClick={handleCreate}>Crear</button>
        )}
      </div>

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

              <button onClick={() => handleEdit(s)}>
                Editar
              </button>

              <button onClick={() => handleDelete(s.email)}>
                Eliminar
              </button>
            </div>
          );
        })}
      </div>

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
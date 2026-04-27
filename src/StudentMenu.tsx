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

  const [pdfs, setPdfs] = useState<any>({});
  const [docs, setDocs] = useState<any>({});

  const [openSection, setOpenSection] = useState<number | null>(null);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const normalizeKey = (text: string) =>
    text.replace(/\./g, "_");

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index);
  };

  const sections = [
    {
      title: "1. Carpeta de Apertura",
      items: [
        "Autorización de RP",
        "Carta Presentación",
        "Carta aceptación",
        "Asignación de asesor interno",
        "Solicitud de RP",
        "Carnet IMSS",
        "Anteproyecto"
      ]
    },
    {
      title: "2. Carpeta de Asesorías Semanales",
      items: [
        "Asesorías semanales",
        "Bitácora de sellos",
        "Informe semestral de asesorías"
      ]
    },
    {
      title: "3. Cierre",
      items: [
        "Informe técnico",
        "Carta término",
        "Formato de liberación"
      ]
    },
    {
      title: "4. Carpeta de Evaluaciones",
      items: [
        "1era evaluación de RP",
        "2da evaluación de RP",
        "3era evaluación de RP"
      ]
    }
  ];

  const buscar = async () => {
    const res = await fetch(`${API}/students?search=${search}`);
    const data = await res.json();
    setStudents(data);
    setSelected(null);
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
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    await res.json();
    setFormData(INITIAL_FORM);
    buscar();
  };

  const handleUpdate = async () => {
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

    setStudents(prev =>
      prev.map(s =>
        s.email === formData.email ? { ...s, ...formData } : s
      )
    );

    setIsEditing(false);
    setFormData(INITIAL_FORM);
  };

  const handleDelete = async (email: string) => {
    await fetch(`${API}/student?email=${email}`, {
      method: "DELETE"
    });

    setStudents(prev => prev.filter(s => s.email !== email));
    setSelected(null);
  };

  const handleEdit = (student: any) => {
    setIsEditing(true);
    setFormData({
      ...INITIAL_FORM,
      ...student
    });
    setSelected(null);
  };

  const handleSelect = (student: any) => {
    setSelected(student);
    setDocs(student.documentos || {});
    setPdfs({});
  };

  const handleFileChange = (name: string, file: File | null) => {
    if (!file) return;

    setPdfs((prev: any) => ({
      ...prev,
      [name]: file
    }));
  };

  const handleUpload = async () => {
    let updatedDocs = { ...docs };

    for (const key of Object.keys(pdfs)) {
      const file = pdfs[key];

      const formData = new FormData();
      formData.append("file", file);
      formData.append("email", selected.email);
      formData.append("name", key);

      const res = await fetch(
        `${API}/upload?email=${selected.email}&name=${key}`,
        {
          method: "POST",
          body: formData
        }
      );

      const updatedUser = await res.json();
      updatedDocs = updatedUser.documentos;
    }

    setDocs(updatedDocs);

    setStudents(prev =>
      prev.map(s =>
        s.email === selected.email
          ? { ...s, documentos: updatedDocs }
          : s
      )
    );

    setSelected((prev: any) => ({
      ...prev,
      documentos: updatedDocs
    }));

    setPdfs({});
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
          placeholder="Buscar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={buscar}>Buscar</button>
      </div>

      <div className="admin-form">
        <h2>{isEditing ? "Actualizar" : "Crear"}</h2>

        <div className="form-grid">
          <input name="nombre" value={formData.nombre} onChange={handleChange} />
          <input name="apellidoPaterno" value={formData.apellidoPaterno} onChange={handleChange} />
          <input name="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange} />
          <input name="telefono" value={formData.telefono} onChange={handleChange} />
          <input name="numControl" value={formData.numControl} onChange={handleChange} />
          <input name="numProyecto" value={formData.numProyecto} onChange={handleChange} />
          <input name="periodo" value={formData.periodo} onChange={handleChange} />
          <input name="genero" value={formData.genero} onChange={handleChange} />
          <input name="email" value={formData.email} onChange={handleChange} />

          {!isEditing && (
            <input
              name="password"
              type="password"
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
        {students.map((s, i) => (
          <div key={i} className="admin-student-card">
            <p><b>{s.nombre}</b></p>

            <button onClick={() => handleSelect(s)}>
              Ver expediente
            </button>

            <button onClick={() => handleEdit(s)}>
              Editar
            </button>

            <button onClick={() => handleDelete(s.email)}>
              Eliminar
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <div className="admin-student-info">

          <h2>{selected.nombre}</h2>

          {sections.map((section, i) => (
            <div key={i} className="accordion">

              <div
                className="accordion-header"
                onClick={() => toggleSection(i)}
              >
                <span>{section.title}</span>
              </div>

              {openSection === i && (
                <div className="accordion-content">

                  {section.items.map((item, j) => {

                    const key = normalizeKey(`${section.title}-${item}`);
                    const uploaded = docs?.[key];

                    return (
                      <div key={j} className="file-item">

                        <label>{item}</label>

                        <input
                          type="file"
                          onChange={(e) =>
                            handleFileChange(
                              key,
                              e.target.files?.[0] || null
                            )
                          }
                        />

                        {uploaded && (
                          <iframe
                            src={uploaded}
                            width="100%"
                            height="300px"
                          />
                        )}

                      </div>
                    );
                  })}

                </div>
              )}

            </div>
          ))}

          <button onClick={handleUpload}>
            Subir documentos
          </button>

        </div>
      )}

    </div>
  );
};

export default AdminPanel;
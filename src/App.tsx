import { useState } from "react";
import "./StudentMenu.css";

const StudentMenu = ({ studentData }: any) => {

  const [pdfs, setPdfs] = useState<any>({});
  const [docs, setDocs] = useState<any>(
    typeof studentData.documentos === "object" && !Array.isArray(studentData.documentos)
      ? studentData.documentos
      : {}
  );
  const [openSection, setOpenSection] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index);
  };

  const normalizeKey = (text: string) =>
    text.replace(/\./g, "_");

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.reload();
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

  const handleFileChange = (name: string, file: File | null) => {
    if (!file) return;

    setPdfs((prev: any) => ({
      ...prev,
      [name]: file
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const results = await Promise.all(
        Object.keys(pdfs).map(async (key) => {
          const file = pdfs[key];
          if (!(file instanceof File)) return null;

          const formData = new FormData();
          formData.append("file", file);
          formData.append("email", studentData.email);
          formData.append("name", key);

          const res = await fetch(
            `${API}/upload?email=${studentData.email}&name=${key}`,
            {
              method: "POST",
              body: formData
            }
          );

          return res.json();
        })
      );

      const lastValid = results.reverse().find(r => r && r.documentos);

      if (lastValid) {
        setDocs({ ...lastValid.documentos });
        localStorage.setItem("user", JSON.stringify(lastValid));
      }

      setPdfs({});
      alert("Documentos guardados correctamente");

    } catch (err) {
      console.log("ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-menu">

      <button className="logout-btn" onClick={handleLogout}>
        Cerrar sesión
      </button>

      <div className="student-card">

        <h1 className="student-name">
          {studentData.nombre} {studentData.apellidoPaterno} {studentData.apellidoMaterno}
        </h1>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <p>{studentData.email}</p>
          <p>No. Control: {studentData.numControl}</p>
        </div>

        <h2 className="section-title">Subir Documentos</h2>

        {sections.map((section, i) => (
          <div key={i} className={`accordion ${openSection === i ? "active" : ""}`}>

            <div className="accordion-header" onClick={() => toggleSection(i)}>
              <span>{section.title}</span>
              <span className={`arrow ${openSection === i ? "open" : ""}`}>
                ▼
              </span>
            </div>

            {openSection === i && (
              <div className="accordion-content">

                {section.items.map((item, j) => {

                  const rawKey = `${section.title}-${item}`;
                  const key = normalizeKey(rawKey);
                  const uploaded = docs?.[key];

                  return (
                    <div key={j} className="file-item">

                      <label>
                        {item}
                        {uploaded && (
                          <span className="uploaded"> ✔ Subido</span>
                        )}
                      </label>

                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          handleFileChange(
                            key,
                            e.target.files?.[0] || null
                          )
                        }
                      />

                      {uploaded && typeof uploaded === "string" && (
                        <iframe
                          src={uploaded}
                          title={key}
                          width="100%"
                          height="350px"
                        />
                      )}

                    </div>
                  );
                })}

              </div>
            )}

          </div>
        ))}

        <button className="upload-btn" onClick={handleSave} disabled={loading}>
          {loading ? "Subiendo..." : "Subir PDFs"}
        </button>

      </div>

    </div>
  );
};

export default StudentMenu;
import { useState } from 'react';
import './StudentMenu.css';

const StudentMenu = ({ studentData }: any) => {

  const [pdfs, setPdfs] = useState<any>({});

  const [docs, setDocs] = useState<any>(
    typeof studentData.documentos === "object" && !Array.isArray(studentData.documentos)
      ? studentData.documentos
      : {}
  );

  const [openSection, setOpenSection] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index);
  };

  const normalizeKey = (text: string) =>
    text.replace(/\./g, "_");

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

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleSave = async () => {
    try {
      let updatedDocs: any = { ...docs };

      for (const key of Object.keys(pdfs)) {
        const file = pdfs[key];
        if (!(file instanceof File)) continue;

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

        const updatedUser = await res.json();
        updatedDocs = updatedUser.documentos;
      }

      setDocs({ ...updatedDocs });
      setPdfs({});
      alert("Documentos guardados correctamente");

    } catch (err) {
      console.log("❌ ERROR FRONT:", err);
    }
  };

  return (
    <div className="student-menu">
      <div className="student-card">

        <h1 className="student-name">{studentData.nombre}</h1>
        <h2 className="section-title">Subir Documentos</h2>

        <div className="accordion-wrapper">

          {sections.map((section, i) => (
            <div 
              key={i} 
              className={`accordion ${openSection === i ? "active" : ""}`}
            >

              {/* HEADER */}
              <div 
                className="accordion-header"
                onClick={() => toggleSection(i)}
              >
                <span>{section.title}</span>
                <span className={`arrow ${openSection === i ? "open" : ""}`}>
                  ▼
                </span>
              </div>

              {/* 🔥 CONTENIDO SIEMPRE EXISTE */}
              <div className={`accordion-content ${openSection === i ? "open" : ""}`}>

                <div className="accordion-body">

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
                          />
                        )}

                      </div>
                    );
                  })}

                </div>

              </div>

            </div>
          ))}

        </div>

        <button className="upload-btn" onClick={handleSave}>
          Subir PDFs
        </button>

      </div>
    </div>
  );
};

export default StudentMenu;
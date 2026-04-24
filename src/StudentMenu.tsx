import { useState } from 'react';
import './StudentMenu.css';

const StudentMenu = ({ studentData }: any) => {

  const [pdfs, setPdfs] = useState<any>({});
  const [docs, setDocs] = useState<string[]>(studentData.documentos || []);

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
      let newDocs: string[] = [];

      for (const key of Object.keys(pdfs)) {
        const file = pdfs[key];
        if (!(file instanceof File)) continue;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("email", studentData.email);
        formData.append("name", key);

        const res = await fetch(`${API}/upload`, {
          method: "POST",
          body: formData
        });

        const updatedUser = await res.json();
        newDocs = updatedUser.documentos;
      }

      setDocs(newDocs);
      alert("Documentos guardados correctamente");

    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="student-menu">
      <div className="student-card">

        <h1 className="student-name">{studentData.nombre}</h1>
        <h2 className="section-title">Subir Documentos</h2>

        {sections.map((section, i) => (
          <div key={i} className="section-block">
            <h3>{section.title}</h3>

            {section.items.map((item, j) => {
              const key = `${section.title}-${item}`;

              return (
                <div key={j} className="file-item">
                  <label>{item}</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                      handleFileChange(key, e.target.files?.[0] || null)
                    }
                  />
                </div>
              );
            })}
          </div>
        ))}

        <button className="upload-btn" onClick={handleSave}>
          Subir PDFs
        </button>

        <div className="pdf-viewer">
          {docs.map((url, index) => (
            <iframe
              key={index}
              src={url}
              title={`pdf-${index}`}
              width="100%"
              height="500px"
              style={{ border: "none", marginBottom: "15px" }}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default StudentMenu;
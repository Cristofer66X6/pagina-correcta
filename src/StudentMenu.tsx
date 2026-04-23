import { useState } from 'react';
import './StudentMenu.css';

const StudentMenu = ({ studentData }: any) => {

  const [pdfs, setPdfs] = useState<any>({});
  const [docs, setDocs] = useState<string[]>(studentData.documentos || []);

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

        {/* 🔥 AGRUPAR INPUTS */}
        <div className="file-upload">
          <input 
            type="file" 
            accept="application/pdf"
            onChange={(e) => handleFileChange("doc1", e.target.files?.[0] || null)} 
          />

          <input 
            type="file" 
            accept="application/pdf"
            onChange={(e) => handleFileChange("doc2", e.target.files?.[0] || null)} 
          />

          <button className="upload-btn" onClick={handleSave}>
            Subir PDFs
          </button>
        </div>

        {/* 🔥 MEJOR VISOR */}
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
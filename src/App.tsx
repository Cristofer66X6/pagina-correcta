import { useState, useEffect } from 'react';
import './App.css';
import SchoolForm from './SchoolForm';
import StudentMenu from './StudentMenu';
import AdminPanel from './AdminPanel';

// 🔥 API dinámica
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleToggle = () => setIsLogin(!isLogin);

  // 🔥 RECUPERAR SESIÓN
  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      const user = JSON.parse(savedUser);

      setStudentData(user);
      setIsAuthenticated(true);

      if (user.email === "admin@escuela.com") {
        setIsAdmin(true);
      }
    }

    setLoading(false);
  }, []);

  // =====================
  // 🔐 LOGIN
  // =====================
  const handleLoginSubmit = async (e: any) => {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Error en login");
        return;
      }

      // 🔥 GUARDAR SESIÓN
      localStorage.setItem("user", JSON.stringify(data));

      setStudentData(data);
      setIsAuthenticated(true);

      if (data.email === "admin@escuela.com") {
        setIsAdmin(true);
      }

    } catch (err) {
      console.log(err);
      alert("Error conectando con el servidor");
    }
  };

  // =====================
  // 📝 REGISTER
  // =====================
  const handleRegisterSubmit = async (e: any) => {
    e.preventDefault();

    const data = {
      nombre: e.target[0].value,
      email: e.target[1].value,
      password: e.target[2].value
    };

    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.msg);
        return;
      }

      alert("Registrado correctamente");
      setIsLogin(true);

    } catch (err) {
      console.log(err);
      alert("Error en registro");
    }
  };

  // =====================
  // 🎓 GUARDAR DATOS
  // =====================
  const handleSchoolSave = async (data: any) => {
    try {
      const res = await fetch(`${API}/student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: studentData.email,
          data
        })
      });

      const updatedUser = await res.json();

      setStudentData(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

    } catch (err) {
      console.log(err);
    }
  };

  if (loading) return <h2>Cargando...</h2>;

  if (!isAuthenticated) {
    return (
      <div>
        {isLogin ? (
          <form onSubmit={handleLoginSubmit}>
            <input name="email" placeholder="Correo" />
            <input name="password" type="password" placeholder="Contraseña" />
            <button>Login</button>
            <button type="button" onClick={handleToggle}>Ir a registro</button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit}>
            <input placeholder="Nombre" />
            <input placeholder="Correo" />
            <input placeholder="Password" />
            <button>Registrar</button>
            <button type="button" onClick={handleToggle}>Ir a login</button>
          </form>
        )}
      </div>
    );
  }

  if (isAdmin) return <AdminPanel />;

  if (!studentData?.numControl) {
    return <SchoolForm onSave={handleSchoolSave} />;
  }

  return <StudentMenu studentData={studentData} />;
}

export default App;
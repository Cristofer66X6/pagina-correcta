import { useState, useEffect } from 'react';
import './App.css';
import SchoolForm from './SchoolForm';
import StudentMenu from './StudentMenu';
import AdminPanel from './AdminPanel';


const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);

 
  const [loading, setLoading] = useState(true);

  const handleToggle = () => setIsLogin(!isLogin);

 
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

    // 🔥 DETECTAR ADMIN CORRECTAMENTE
    if (data.role === "admin") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }

  } catch (err) {
    console.log("ERROR LOGIN:", err);
    alert("Error conectando con el servidor");
  }
};

  
  const handleRegisterSubmit = async (e: any) => {
    e.preventDefault();

    const data = {
      nombre: e.target[0].value,
      email: e.target[1].value,
      password: e.target[2].value
    };

    try {
      await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      alert("Registrado correctamente");
      setIsLogin(true);
    } catch (err) {
      console.log("ERROR REGISTER:", err);
    }
  };

  
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
      console.log("ERROR SCHOOL:", err);
    }
  };

  
  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <h2>Cargando...</h2>
      </div>
    );
  }


  if (!isAuthenticated) {
    return (
      <div className="auth-background">
        <div className="container-form">

          <div className="information">
            <div className="info-childs">
              {isLogin ? (
                <>
                  <h2>¡Bienvenido nuevamente!</h2>
                  <p>Inicia sesión</p>
                  <button onClick={handleToggle}>Registrarse</button>
                </>
              ) : (
                <>
                  <h2>Crear cuenta</h2>
                  <button onClick={handleToggle}>Iniciar sesión</button>
                </>
              )}
            </div>
          </div>

          <div className="form-information">
            <div className="form-information-childs">

              {isLogin ? (
                <>
                  <h2>Login</h2>
                  <form onSubmit={handleLoginSubmit}>
                    <input name="email" type="email" placeholder="Correo" required />
                    <input name="password" type="password" placeholder="Contraseña" required />
                    <button type="submit">Entrar</button>
                  </form>
                </>
              ) : (
                <>
                  <h2>Registro</h2>
                  <form onSubmit={handleRegisterSubmit}>
                    <input placeholder="Nombre" required />
                    <input type="email" placeholder="Correo" required />
                    <input type="password" placeholder="Contraseña" required />
                    <button type="submit">Registrar</button>
                  </form>
                </>
              )}

            </div>
          </div>
        </div>
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
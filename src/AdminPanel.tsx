import React, { useState } from 'react';

const AdminPanel = () => {

  const [email, setEmail] = useState('');
  const [user, setUser] = useState<any>(null);

  const buscar = async () => {
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email })
    });

    if(res.ok){
      const data = await res.json();
      setUser(data);
    }
  };

  return (
    <div>
      <h1>Admin</h1>

      <input onChange={(e)=>setEmail(e.target.value)} placeholder="email" />
      <button onClick={buscar}>Buscar</button>

      {user && <pre>{JSON.stringify(user,null,2)}</pre>}
    </div>
  );
};

export default AdminPanel;
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Error al iniciar sesión');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface via-surface-container-low to-surface">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-container rounded-2xl shadow-elevated mb-4">
            <span className="text-white text-2xl font-extrabold font-headline">F</span>
          </div>
          <h1 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">Frisol</h1>
          <p className="mt-2 text-sm font-body text-on-surface-variant">Framework 4D — Traspaso Comercial → Desarrollo</p>
        </div>

        <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-2xl shadow-elevated p-8 border border-outline-variant/15">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="csm@frisol.com" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center items-center gap-2 mt-6">
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 text-xs text-on-surface-variant/60">
          <p>Usuarios: csm / po / dev / admin @frisol.com</p>
          <p>Contraseña: password123</p>
        </div>
      </div>
    </div>
  );
}

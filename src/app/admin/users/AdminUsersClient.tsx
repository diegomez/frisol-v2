'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string; email: string; name: string; role: string; active: boolean;
  tribeId: string | null; tribeName: string | null; createdAt: string;
}

interface Tribe { id: string; name: string; }

interface Props { user: { id: string; name: string; role: string }; }

export default function AdminUsersClient({ user }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'csm', active: true, tribeId: '' });
  const [error, setError] = useState('');

  const load = async () => {
    const [u, t] = await Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/tribes').then(r => r.json()),
    ]);
    setUsers(u); setTribes(t);
  };
  useEffect(() => { load(); }, []);

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); };

  const resetForm = () => { setShowForm(false); setEditing(null); setForm({ email: '', password: '', name: '', role: 'csm', active: true, tribeId: '' }); setError(''); };

  const handleEdit = (u: User) => {
    setEditing(u);
    setForm({ email: u.email, password: '', name: u.name, role: u.role, active: u.active, tribeId: u.tribeId || '' });
    setShowForm(true); setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      if (editing) {
        const dto: any = {};
        if (form.email !== editing.email) dto.email = form.email;
        if (form.name !== editing.name) dto.name = form.name;
        if (form.role !== editing.role) dto.role = form.role;
        if (form.active !== editing.active) dto.active = form.active;
        if ((form.tribeId || '') !== (editing.tribeId || '')) dto.tribeId = form.tribeId || null;
        if (form.password) dto.password = form.password;
        const res = await fetch(`/api/users/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) });
        if (!res.ok) { const d = await res.json(); setError(d.message); return; }
      } else {
        const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        if (!res.ok) { const d = await res.json(); setError(d.message); return; }
      }
      resetForm(); load();
    } catch { setError('Error al guardar'); }
  };

  const handleToggleActive = async (u: User) => {
    await fetch(`/api/users/${u.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !u.active }) });
    load();
  };

  const roleLabels: Record<string, string> = { admin: 'Admin', csm: 'CSM', po: 'PO', dev: 'Dev' };
  const roleColors: Record<string, string> = { admin: 'bg-purple-100 text-purple-800', csm: 'bg-teal-100 text-teal-800', po: 'bg-emerald-100 text-emerald-800', dev: 'bg-amber-100 text-amber-800' };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/15 shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-extrabold font-headline">F</span>
              </div>
              <span className="text-lg font-extrabold font-headline text-on-surface tracking-tight hidden sm:block">Frisol v2</span>
            </Link>
            <Link href="/dashboard" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">← Dashboard</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-purple-100 text-purple-800">Admin</span>
            <button onClick={handleLogout} className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all" title="Cerrar sesión">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-extrabold font-headline text-on-surface tracking-tight">Gestión de Usuarios</h2>
            <p className="text-sm text-on-surface-variant mt-1">{users.length} usuarios registrados</p>
          </div>
          {!showForm && <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">+ Nuevo usuario</button>}
        </div>

        {showForm && (
          <div className="card mb-6">
            <h3 className="text-lg font-bold text-on-surface mb-4">{editing ? 'Editar usuario' : 'Crear nuevo usuario'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Nombre</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-field" /></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="input-field" /></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Contraseña {editing && '(vacío = no cambia)'}</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} minLength={6} className="input-field" placeholder={editing ? '••••••••' : ''} /></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Rol</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
                    <option value="admin">Admin</option><option value="csm">CSM</option><option value="po">PO</option><option value="dev">Dev</option>
                  </select>
                </div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Tribu</label>
                  <select value={form.tribeId} onChange={(e) => setForm({ ...form, tribeId: e.target.value })} className="input-field">
                    <option value="">Sin tribu</option>{tribes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 text-primary rounded" /><span className="text-sm text-on-surface">Usuario activo</span></label>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">{editing ? 'Actualizar' : 'Crear usuario'}</button>
                <button type="button" onClick={resetForm} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-primary uppercase tracking-widest">Usuario</th>
                <th className="px-6 py-4 text-[10px] font-bold text-primary uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-[10px] font-bold text-primary uppercase tracking-widest">Rol</th>
                <th className="px-6 py-4 text-[10px] font-bold text-primary uppercase tracking-widest">Tribu</th>
                <th className="px-6 py-4 text-[10px] font-bold text-primary uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[10px] font-bold text-primary uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-container-low/40 transition-colors border-t border-outline-variant/5">
                  <td className="px-6 py-4 text-sm font-semibold text-on-surface">{u.name}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{u.email}</td>
                  <td className="px-6 py-4"><span className={`badge ${roleColors[u.role]}`}>{roleLabels[u.role]}</span></td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{u.tribeName || '—'}</td>
                  <td className="px-6 py-4"><span className={`badge ${u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{u.active ? 'Activo' : 'Inactivo'}</span></td>
                  <td className="px-6 py-4 space-x-3">
                    <button onClick={() => handleEdit(u)} className="text-primary text-sm font-bold hover:text-primary-container">Editar</button>
                    <button onClick={() => handleToggleActive(u)} className={`text-sm font-bold ${u.active ? 'text-red-500 hover:text-red-600' : 'text-emerald-500 hover:text-emerald-600'}`}>{u.active ? 'Desactivar' : 'Activar'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

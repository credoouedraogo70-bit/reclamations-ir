import { useState } from 'react';
import api from '../lib/axios';
import { ACCENT, SURFACE, BORDER, TEXT_SECONDARY, inter } from '../lib/theme';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  AGENT: 'Agent Service Client',
};

export default function Profile() {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [user, setUser] = useState(storedUser);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(storedUser.nom || '');
  const [email, setEmail] = useState(storedUser.email || '');
  const [success, setSuccess] = useState(false);

  const handleOpen = () => {
    setName(user.nom || '');
    setEmail(user.email || '');
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    try {
      const res = await api.patch(`/users/${storedUser.id}`, { nom: name, email });
      const updatedUser = { ...storedUser, nom: res.data.nom, email: res.data.email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setOpen(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour du profil');
    }
  };

  return (
    <div className="-m-6 min-h-[calc(100vh-4rem)] bg-theme-bg flex flex-col items-center justify-center gap-6 px-4" style={inter}>
      <div className="text-center">
        <h1 className="text-2xl font-medium text-theme-text">{user.nom}</h1>
        <p className="mt-1 text-sm" style={{ color: TEXT_SECONDARY }}>
          {ROLE_LABELS[user.role] ?? user.role} · {user.email}
        </p>
      </div>

      {success ? (
        <div className="px-4 py-2 rounded-xl text-sm" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: ACCENT }}>
          Profil mis à jour avec succès !
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleOpen}
        className="px-6 py-2.5 rounded-[8px] font-semibold shadow transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
        style={{ backgroundColor: ACCENT, color: '#031a12' }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Modifier le profil
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-theme-overlay backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="rounded-[15px] shadow-2xl p-8 w-full max-w-md relative border" style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 text-2xl leading-none transition-colors hover:text-theme-text focus:outline-none"
              style={{ color: TEXT_SECONDARY }}
              aria-label="Fermer"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-1 tracking-tight text-theme-text">Modifier le profil</h2>
            <p className="mb-7 text-sm" style={{ color: TEXT_SECONDARY }}>
              Modifiez vos informations ici. Cliquez sur enregistrer une fois terminé.
            </p>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }} autoComplete="off">
              <div className="mb-5">
                <label htmlFor="name" className="block text-sm font-semibold mb-2 text-theme-text">Nom complet</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text focus:outline-none focus:ring-2 focus:ring-emerald-600/50 transition"
                  style={{ borderColor: BORDER }}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="mb-8">
                <label htmlFor="email" className="block text-sm font-semibold mb-2 text-theme-text">Adresse email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] border bg-theme-input text-theme-text focus:outline-none focus:ring-2 focus:ring-emerald-600/50 transition"
                  style={{ borderColor: BORDER }}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-[8px] border font-medium transition-colors"
                  style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[8px] font-semibold shadow transition-colors"
                  style={{ backgroundColor: ACCENT, color: '#031a12' }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

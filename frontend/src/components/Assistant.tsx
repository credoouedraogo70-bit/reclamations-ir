import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, ArrowLeft } from 'lucide-react';
import { ACCENT, SURFACE, SURFACE_2, BORDER, TEXT_SECONDARY, inter } from '../lib/theme';

type Stage = 'root' | 'submit' | 'track' | 'delay' | 'contact';

const BOT_MESSAGES: Record<Exclude<Stage, 'root'>, string> = {
  submit: "Vous pouvez déposer une réclamation directement en ligne, sans passer par un agent. Munissez-vous de votre nom, téléphone, et d'une description du problème.",
  track: "Pour suivre votre réclamation, munissez-vous de votre numéro de ticket (reçu au dépôt) et de votre numéro de téléphone.",
  delay: "Le délai de traitement dépend de la catégorie de votre réclamation (généralement entre 24h et 72h). Vous pouvez vérifier l'échéance exacte à tout moment avec votre numéro de ticket.",
  contact: "Nos agents traitent les réclamations dans l'ordre de dépôt. Pour un suivi personnalisé, déposez une réclamation ou consultez l'état de votre dossier en ligne.",
};

const ROOT_OPTIONS: { label: string; stage: Stage }[] = [
  { label: 'Déposer une réclamation', stage: 'submit' },
  { label: 'Suivre ma réclamation', stage: 'track' },
  { label: 'Quel est le délai de traitement ?', stage: 'delay' },
  { label: 'Parler à un agent', stage: 'contact' },
];

export function Assistant() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>('root');

  const handleClose = () => {
    setOpen(false);
    setStage('root');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" style={inter}>
      {open && (
        <div
          className="mb-3 w-80 rounded-[15px] border shadow-2xl overflow-hidden flex flex-col"
          style={{ backgroundColor: SURFACE, borderColor: BORDER }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: BORDER }}>
            <span className="text-sm font-semibold text-theme-text">Assistant Moov Africa</span>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded transition-colors hover:text-theme-text"
              style={{ color: TEXT_SECONDARY }}
              aria-label="Fermer l'assistant"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {stage !== 'root' && (
              <button
                type="button"
                onClick={() => setStage('root')}
                className="flex items-center gap-1.5 text-xs font-medium hover:underline"
                style={{ color: TEXT_SECONDARY }}
              >
                <ArrowLeft size={12} /> Retour
              </button>
            )}

            {stage === 'root' ? (
              <>
                <p className="text-sm text-theme-text">Bonjour ! Comment puis-je vous aider ?</p>
                <div className="flex flex-col gap-2">
                  {ROOT_OPTIONS.map((opt) => (
                    <button
                      key={opt.stage}
                      type="button"
                      onClick={() => setStage(opt.stage)}
                      className="text-left px-3 py-2 rounded-[8px] border text-sm transition-colors hover:border-emerald-800"
                      style={{ backgroundColor: SURFACE_2, borderColor: BORDER, color: TEXT_SECONDARY }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm" style={{ color: TEXT_SECONDARY }}>{BOT_MESSAGES[stage]}</p>
                {stage === 'submit' && (
                  <button
                    type="button"
                    onClick={() => { handleClose(); navigate('/submit'); }}
                    className="w-full px-3 py-2 rounded-[8px] text-sm font-semibold transition-colors"
                    style={{ backgroundColor: ACCENT, color: '#031a12' }}
                  >
                    Aller au formulaire
                  </button>
                )}
                {stage === 'track' && (
                  <button
                    type="button"
                    onClick={() => { handleClose(); navigate('/track'); }}
                    className="w-full px-3 py-2 rounded-[8px] text-sm font-semibold transition-colors"
                    style={{ backgroundColor: ACCENT, color: '#031a12' }}
                  >
                    Suivre mon dossier
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
        style={{ backgroundColor: ACCENT, color: '#031a12' }}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant"}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}

import { Check, X } from 'lucide-react';
import { C, radius } from '../../theme';

const TOOL_LABELS = {
  create_appointment:     'Schedule appointment',
  update_appointment:     'Update appointment',
  create_logistic_item:   'Add to-do item',
  complete_logistic_item: 'Mark task complete',
  create_care_change:     'Log care change',
  add_doctor:             'Add to care team',
};

export default function ConfirmActionCard({ action, onConfirm, onCancel, confirming }) {
  const label = TOOL_LABELS[action.tool] || 'Take action';
  return (
    <div style={{
      background: '#fff', border: `1.5px solid ${C.rose}`, borderRadius: radius.md,
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
      maxWidth: 420, alignSelf: 'flex-start',
    }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.rose, textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 4px' }}>
          {label}
        </p>
        <p style={{ fontSize: 14, color: C.text, margin: 0, lineHeight: 1.55 }}>
          {action.summary}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onConfirm}
          disabled={confirming}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: C.roseDark, color: '#fff',
            border: 'none', borderRadius: radius.pill, padding: '7px 16px',
            fontSize: 13, fontWeight: 600, cursor: confirming ? 'default' : 'pointer',
            opacity: confirming ? 0.7 : 1, transition: 'opacity 0.15s',
          }}>
          <Check size={13} />
          {confirming ? 'Saving…' : 'Confirm'}
        </button>
        <button
          onClick={onCancel}
          disabled={confirming}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'transparent', color: C.muted,
            border: `1px solid ${C.border}`, borderRadius: radius.pill, padding: '7px 16px',
            fontSize: 13, cursor: confirming ? 'default' : 'pointer',
          }}>
          <X size={13} />
          Cancel
        </button>
      </div>
    </div>
  );
}

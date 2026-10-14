// Analytics metadata about care recipients. Only coarse, non-identifying attributes are sent:
// never names, contact details, conditions, allergies, medications or notes (PHI).

// Must equal the `recipient_id` property that recipient events carry.
const RECIPIENT_OBJECT_PROPERTY = 'recipient_id';

function ageBand(age) {
  const n = Number(age);
  if (!n || n < 0) return 'unknown';
  if (n < 65) return 'under_65';
  if (n < 75) return '65_74';
  if (n < 85) return '75_84';
  return '85_plus';
}

function relationshipOf(r) {
  return String(r.relationship || 'family').trim().toLowerCase() || 'family';
}

// Visitor-level metadata describing the caregiver's recipients.
export function sendRecipientVisitorMetadata(recipients) {
  if (typeof window.pendo?.updateOptions !== 'function') return;
  window.pendo.updateOptions({
    visitor: {
      recipient_count: recipients.length,
      has_recipients: recipients.length > 0,
      primary_recipient_relationship: recipients.length ? relationshipOf(recipients[0]) : '',
    },
  });
}

// Per-recipient (business object) metadata, so each recipient shows by nickname.
export function sendRecipientObjectMetadata(recipients) {
  if (typeof window.pendo?.objectMetadata !== 'function') return;
  recipients.forEach(r => {
    // Skip optimistic rows until Firestore assigns the real id.
    if (!r.id || String(r.id).startsWith('temp_')) return;
    window.pendo.objectMetadata(String(r.id), RECIPIENT_OBJECT_PROPERTY, {
      display_name: String(r.nickname || '').trim() || 'Care recipient',
      relationship: relationshipOf(r),
      age_band: ageBand(r.age),
      condition_count: (r.conditions || []).length,
      medication_count: (r.medications || []).length,
      insurance_plan_count: (r.insurancePlans || []).length,
    });
  });
}

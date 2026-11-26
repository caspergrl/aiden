const EMERGENCY_PATTERNS = [
  /chest\s*pain/i,
  /can'?t\s+breath/i,
  /not\s+breath/i,
  /trouble\s+breath/i,
  /difficulty\s+breath/i,
  /stroke/i,
  /facial\s+droop/i,
  /arm\s+weakness/i,
  /slurred\s+speech/i,
  /collapsed/i,
  /unconscious/i,
  /unresponsive/i,
  /severe\s+bleed/i,
  /won'?t\s+wake/i,
  /not\s+waking/i,
  /can'?t\s+wake/i,
  /seizure/i,
  /overdos/i,
  /poisoning/i,
  /suicid/i,
  /kill\s+(my|him|her)self/i,
  /want\s+to\s+die/i,
  /end\s+(my|his|her)\s+life/i,
  /not\s+worth\s+living/i,
  /head\s+injury/i,
];

const CRISIS_PATTERNS = [
  /suicid/i,
  /kill\s+(my|him|her)self/i,
  /want\s+to\s+die/i,
  /end\s+(my|his|her)\s+life/i,
  /not\s+worth\s+living/i,
];

const POISON_PATTERNS = [
  /overdos/i,
  /poisoning/i,
  /swallowed/i,
  /ingested/i,
];

export function checkEmergency(text) {
  const isEmergency = EMERGENCY_PATTERNS.some(p => p.test(text));
  const isCrisis = CRISIS_PATTERNS.some(p => p.test(text));
  const isPoisoning = POISON_PATTERNS.some(p => p.test(text));
  return { isEmergency, isCrisis, isPoisoning };
}

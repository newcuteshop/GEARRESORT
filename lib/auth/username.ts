// Convert plain username (no @) to internal email — pure helper, no server side.
export function toLoginEmail(input: string) {
  const v = input.trim();
  if (!v) return v;
  return v.includes("@") ? v : `${v}@gear.local`;
}

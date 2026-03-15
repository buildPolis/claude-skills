export function isEmpty(val: unknown): boolean {
  if (val == null) return true;
  if (typeof val === "string") return val.length === 0;
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === "object") return Object.keys(val).length === 0;
  return false;
}

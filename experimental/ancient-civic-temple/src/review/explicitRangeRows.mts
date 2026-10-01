/** Recover directed X/Y/Z metre intervals from immutable authored prose. A
 * reversed interval is valid and a zero interval is not an extent. The prose
 * census and declaredBoundRows consume the same rows; no origin or world-frame
 * transform is inferred from an interval alone. */
export const explicitRangeRows = (id: string, body: string) => {
  const rows = [];
  for (const match of body.matchAll(/([XYZ])=([+−-]?\d+(?:\.\d+)?)~([+−-]?\d+(?:\.\d+)?)m/g)) {
    const [, axis, fromText, toText] = match;
    const from = Number(fromText.replace("−", "-")), to = Number(toText.replace("−", "-"));
    // A segment can be authored from its support towards its tip, so either
    // sign of the directed interval is valid. A zero span is not an extent.
    rows.push({ id, axis, from, to, pass: Number.isFinite(from) && Number.isFinite(to) && from !== to });
  }
  return rows;
};

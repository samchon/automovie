/** Split a wall host against a roof line y = slope × local x + constant. */

export const clipOutlineAtLine = (
  outline: ReadonlyArray<{ x: number; y: number; }>, slope: number, constant: number,
  keep: "below" | "above"
): Array<{ x: number; y: number; }> => {
  if (outline.length < 3 || !Number.isFinite(slope) || !Number.isFinite(constant) ||
    outline.some((q) => !Number.isFinite(q.x) || !Number.isFinite(q.y))) {
    throw new Error("clipOutlineAtLine: a closed finite single outline and a finite cut line are required.");
  }
  const signed = (q: { x: number; y: number; }): number => q.y - slope * q.x - constant;
  const inside = (q: { x: number; y: number; }): boolean => keep === "below" ? signed(q) <= 1e-9 : signed(q) >= -1e-9;
  const out: Array<{ x: number; y: number; }> = [];
  outline.forEach((a, i) => {
    const b = outline[(i + 1) % outline.length]!;
    if (inside(a)) out.push({ ...a });
    if (inside(a) === inside(b)) return;
    const da = signed(a);
    const db = signed(b);
    if (Math.abs(db - da) <= 1e-12) return;
    const t = -da / (db - da);
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  });
  const kept = out.filter((q, i) => {
    const next = out[(i + 1) % out.length]!;
    return Math.hypot(q.x - next.x, q.y - next.y) > 1e-9;
  });
  if (kept.length < 3) throw new Error(`clipOutlineAtLine: no outline remains on the ${keep} side.`);
  return kept;
};

/**
 * Cuts a host outline (an x-monotone polygon: horizontal bottom, upper polyline) with a horizontal line and
 * keeps only the part below or above it. Used to split one host into two boundaries by height.
 */

export const clipOutlineAtHeight = (
  outline: ReadonlyArray<{ x: number; y: number; }>, height: number, keep: "below" | "above"
): Array<{ x: number; y: number; }> => {
  const inside = (q: { y: number; }) => keep === "below" ? q.y <= height + 1e-9 : q.y >= height - 1e-9;
  const out: Array<{ x: number; y: number; }> = [];
  outline.forEach((a, i) => {
    const b = outline[(i + 1) % outline.length]!;
    if (inside(a)) out.push(a);
    if (inside(a) !== inside(b) && Math.abs(b.y - a.y) > 1e-12) {
      out.push({ x: a.x + (b.x - a.x) * (height - a.y) / (b.y - a.y), y: height });
    }
  });
  const kept = out.filter((q, i) => {
    const n = out[(i + 1) % out.length]!;
    return Math.hypot(q.x - n.x, q.y - n.y) > 1e-9;
  });
  if (kept.length < 3) throw new Error(`clipOutlineAtHeight: no outline remains on the ${keep} side at height ${height}.`);
  return kept;
};

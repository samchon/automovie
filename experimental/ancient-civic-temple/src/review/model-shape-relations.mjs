import { modelParts, partBounds } from "./model-occupancy-union.mjs";

/** @param {string} term @param {number} size */
const symbolic = (term, size) => {
  const source = term.replaceAll(" ", "");
  if (/^[\d.]+$/.test(source)) return Number(source);
  const match = source.match(/^([\d.]+)?T(?:\/([\d.]+))?$/);
  return match ? Number(match[1] ?? 1) * size / Number(match[2] ?? 1) : NaN;
};

/** Check separations and contained solids from their construction clauses. */
/** @param {string} id @param {string} body */
export const shapeRelationRows = (id, body) => {
  const source = body.split(/^부재 대응:/m)[0].replace(/\[[^\]]+\]\([^)]*\)/g, "");
  const parts = modelParts(body), bounds = partBounds(body);
  const rows = [];
  const ring = source.match(/중심선 반지름은(?: 안쪽부터)? ((?:[\d.]+m·)+[\d.]+m), 관 반지름은 ([\d.]+)m/);
  const gapClaim = source.match(/([\d.]+)m 빈 간극/);
  if (ring) {
    const radii = [...ring[1].matchAll(/([\d.]+)m/g)].map((match) => Number(match[1]));
    const tube = Number(ring[2]);
    for (let i = 1; i < radii.length; i++) {
      const gap = radii[i] - radii[i - 1] - 2 * tube;
      rows.push({ id, kind: "annular gap", measured: gap,
        pass: gap >= -1e-6 && (!gapClaim || Math.abs(gap - Number(gapClaim[1])) < 1e-6) });
    }
  }
  const thickness = Number(source.match(/\bT=([\d.]+)m/)?.[1]);
  const layers = [...source.matchAll(/(?:아래 겹|위 겹|접힘 띠)[^\n]*?Y=([\d.T/]+)~([\d.T/]+)/g)];
  if (Number.isFinite(thickness) && layers.length >= 3) {
    const intervals = layers.slice(0, 3).map((match) =>
      [symbolic(match[1], thickness), symbolic(match[2], thickness)]);
    const [lower, upper, fold] = intervals;
    rows.push({ id, kind: "fold/lower-layer contact", measured: fold[0] - lower[1],
      pass: Number.isFinite(fold[0]) && Math.abs(fold[0] - lower[1]) < 1e-6 });
    rows.push({ id, kind: "fold/upper-layer contact", measured: upper[0] - fold[1],
      pass: Number.isFinite(fold[1]) && Math.abs(upper[0] - fold[1]) < 1e-6 });
  }
  for (const shell of parts) {
    const noun = shell.noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const clause = source.match(new RegExp(`${noun}[^\\n]*?(?:안쪽은|안쪽 바닥)[^\\n]*`))?.[0];
    if (!clause) continue;
    const insideStart = [clause.indexOf("안쪽은"), clause.indexOf("안쪽 바닥")]
      .filter((position) => position >= 0).sort((a, b) => a - b)[0];
    const inside = clause.slice(insideStart);
    const explicitFloor = inside.match(/바닥 Y=([\d.]+)m/);
    const profile = [...inside.matchAll(/\(([\d.]+),([\d.]+)\)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    const floor = explicitFloor ? Number(explicitFloor[1]) : profile.length ? Math.min(...profile.map((p) => p[0])) : NaN;
    if (!Number.isFinite(floor)) continue;
    const shellY = bounds[shell.key].Y;
    if (shellY.length < 2) continue;
    const shellTop = Math.max(...shellY);
    const frustum = inside.match(/반지름 ([\d.]+)m에서 ([\d.]+)m까지 바닥 Y=([\d.]+)m/);
    const wall = frustum
      ? [[Number(frustum[3]), Number(frustum[1])], [shellTop, Number(frustum[2])]]
      : profile.slice(0, 2).sort((a, b) => a[0] - b[0]);
    /** @param {number} y */
    const wallRadius = (y) => wall.length === 2
      ? wall[0][1] + (wall[1][1] - wall[0][1]) *
        (Math.max(wall[0][0], Math.min(wall[1][0], y)) - wall[0][0]) /
        (wall[1][0] - wall[0][0])
      : NaN;
    for (const object of parts) {
      if (object.key === shell.key) continue;
      const inner = bounds[object.key];
      if (inner.Y.length < 2 || inner.X.length < 2 || inner.Z.length < 2) continue;
      const lo = Math.min(...inner.Y), hi = Math.max(...inner.Y);
      if (hi <= floor + 1e-6 || lo >= shellTop - 1e-6) continue;
      const radial = Math.max(...inner.X.map(Math.abs), ...inner.Z.map(Math.abs));
      const cavityRadius = wall.length === 2 ? Math.max(wall[0][1], wall[1][1]) : NaN;
      if (!Number.isFinite(cavityRadius) || radial > cavityRadius + 1e-6) continue;
      rows.push({ id, kind: "inner floor clearance", parts: `${shell.key}/${object.key}`,
        measured: lo - floor, pass: lo >= floor - 1e-6 });
      if (wall.length === 2) {
        const objectNoun = object.noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const objectClause = source.match(new RegExp(`${objectNoun}(?:은|는)[^\\n]*`))?.[0] ?? "";
        const faces = [...objectClause.matchAll(/(?:아랫면|윗면) Y=([\d.]+)m에서 반지름 ([\d.]+)m/g)]
          .map((m) => [Number(m[1]), Number(m[2])]);
        const samples = faces.length >= 2 ? faces.slice(0, 2) :
          [[lo, radial], [Math.min(hi, shellTop), radial]];
        for (const [y, radius] of samples) if (y >= floor - 1e-6 && y <= shellTop + 1e-6)
          rows.push({ id, kind: "inner wall clearance", parts: `${shell.key}/${object.key}`,
            measured: wallRadius(y) - radius, pass: radius <= wallRadius(y) + 1e-6 });
      }
    }
  }
  return rows;
};

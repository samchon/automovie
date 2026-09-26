/** Sweep an authored polygonal tube along its straight-segment centreline. */
const radial = (low, high, yLow, yHigh, y) => low + (high - low) * (y - yLow) / (yHigh - yLow);

/** @param {string} id @param {string} body */
export const tubeWallClearanceRows = (id, body) => {
  const outside = body.match(/바깥은 Y=([\d.]+)에서 반지름 ([\d.]+)m, Y=([\d.]+)m에서 반지름 ([\d.]+)m/);
  const inside = body.match(/안쪽은 Y=([\d.]+)m에서 반지름 ([\d.]+)m부터 입 아래 반지름 ([\d.]+)m까지/);
  const path = body.match(/t=0\.\.π를 (\d+)등분하고 각 점을 \(X,Y,Z\)=\(([\d.]+) cos t,([\d.]+)\+([\d.]+) sin t,0\)m/);
  const tube = body.match(/관 반지름 ([\d.]+)m·둘레 (\d+)분할/);
  if (!outside || !inside || !path || !tube) return [];
  const [outerY0, outerR0, outerY1, outerR1] = outside.slice(1).map(Number);
  const [innerY0, innerR0, innerR1] = inside.slice(1).map(Number);
  const [segments, horizontal, baseY, rise] = path.slice(1).map(Number);
  const [tubeRadius, sides] = tube.slice(1).map(Number);
  const points = Array.from({ length: segments + 1 }, (_, k) => {
    const t = k * Math.PI / segments;
    return [horizontal * Math.cos(t), baseY + rise * Math.sin(t)];
  });
  let clearance = Infinity;
  // Both vertex and face-aligned polygon phases are checked. The unspecific
  // phase of a future renderer cannot conceal penetration in either case.
  for (const phase of [0, Math.PI / sides])
    for (let k = 0; k < segments; k++) {
      const [a, b] = [points[k], points[k + 1]];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const length = Math.hypot(dx, dy);
      const inward = a[0] >= 0 ? [-dy / length, dx / length] : [dy / length, -dx / length];
      for (let j = 0; j < sides; j++) {
        const angle = phase + 2 * Math.PI * j / sides;
        const offset = tubeRadius * Math.cos(angle), z = tubeRadius * Math.sin(angle);
        for (let sample = 0; sample <= 1000; sample++) {
          const f = sample / 1000;
          const x = a[0] + dx * f + inward[0] * offset;
          const y = a[1] + dy * f + inward[1] * offset;
          if (y < innerY0 || y > outerY1) continue;
          clearance = Math.min(clearance, Math.hypot(x, z) -
            radial(innerR0, innerR1, innerY0, outerY1, y));
        }
      }
    }
  const immersion = radial(outerR0, outerR1, outerY0, outerY1, baseY) - horizontal;
  const claim = body.match(/접점 중심은 몸체 바깥면에 약 ([\d.]+)m 들어가되/);
  const noInsideContact = /안쪽 벽에(?:는)? 닿지 않는다/.test(body);
  const rows = [];
  if (claim) rows.push({ id, kind: "outer-wall contact depth", measured: immersion,
    pass: Math.abs(immersion - Number(claim[1])) <= 0.00005 });
  if (noInsideContact) rows.push({ id, kind: "inner-wall clearance", measured: clearance,
    pass: clearance >= -1e-7 });
  return rows;
};

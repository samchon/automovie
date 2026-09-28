/** Sweep an authored polygonal tube along its straight-segment centreline. */
/** @param {number} low @param {number} high @param {number} yLow @param {number} yHigh @param {number} y */
const radial = (low, high, yLow, yHigh, y) => low + (high - low) * (y - yLow) / (yHigh - yLow);

/** @param {string} id @param {string} body */
export const tubeWallClearanceRows = (id, body) => {
  const outsideText = body.match(/바깥은 ([^\n]*?)안쪽(?: 벽)?은/)?.[1] ?? "";
  const outer = [...outsideText.matchAll(/Y=([\d.]+)(?:m)?에서 반지름 ([\d.]+)m/g)];
  const insideText = body.match(/안쪽(?: 벽)?은 ([^\n]*?)손잡이는/)?.[1] ?? "";
  const innerStart = insideText.match(/Y=([\d.]+)m(?:에서|의) 반지름 ([\d.]+)m/);
  const innerTop = insideText.match(/입 아래 반지름 ([\d.]+)m/);
  const divisions = body.match(/t=0\.\.π를 (\d+)등분/);
  const curve = body.match(/\(X,Y,Z\)=\(([\d.]+) cos t,([\d.]+)\+([\d.]+) sin t,0\)m/);
  const radius = body.match(/관 반지름(?:은)? ([\d.]+)m/);
  const sidesText = body.match(/둘레(?:를)? (\d+)분할/);
  if (outer.length < 2 || !innerStart || !innerTop || !divisions || !curve || !radius || !sidesText) return [];
  const [outerY0, outerR0, outerY1, outerR1] = [...outer[0].slice(1), ...outer[1].slice(1)].map(Number);
  const [innerY0, innerR0, innerR1] = [innerStart[1], innerStart[2], innerTop[1]].map(Number);
  const [segments, horizontal, baseY, rise] = [divisions[1], ...curve.slice(1)].map(Number);
  const [tubeRadius, sides] = [radius[1], sidesText[1]].map(Number);
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
        const x0 = a[0] + inward[0] * offset, y0 = a[1] + inward[1] * offset;
        const slope = (innerR1 - innerR0) / (outerY1 - innerY0);
        const critical = [0, 1, (innerY0 - y0) / dy, (outerY1 - y0) / dy];
        if (dx !== 0) {
          critical.push(-x0 / dx);
          const ratio = slope * dy / dx;
          if (Math.abs(ratio) < 1 && Math.abs(z) > 0)
            critical.push((ratio * Math.abs(z) / Math.sqrt(1 - ratio * ratio) - x0) / dx);
        }
        for (const f of critical) {
          if (f < 0 || f > 1) continue;
          const x = x0 + dx * f, y = y0 + dy * f;
          if (y < innerY0 - 1e-12 || y > outerY1 + 1e-12) continue;
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

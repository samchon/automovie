// Derive occupied extrema from the authored dimension formulas, then compare
// both the prose operands and the declared part box with that derivation.
const epsilon = 0.000001;

/** @param {string} value */
function ratio(value) {
  const match = /^(\d+)\/(\d+)$/.exec(value);
  if (!match || !Number(match[2])) throw Error(`invalid formula ratio ${value}`);
  return Number(match[1]) / Number(match[2]);
}

/** @param {number} a @param {number} b */
function equal(a, b) { return Math.abs(a - b) <= epsilon; }

/** @param {string[]} lines
 * @param {{parts:Map<string,{x:[number,number],y:[number,number],z:[number,number]}>,envelopes:Map<string,{x:[number,number],y:[number,number],z:[number,number]}>}} parsed
 * @param {string} anchor */
function check(lines, parsed, anchor) {
  const errors = [];
  const prose = lines.filter((line) => line && !/^\||^@|^<!--/.test(line)).join(" ");
  let checked = 0;
  for (const line of lines.filter((entry) => entry.startsWith("@formula-"))) {
    const declaration = /^@formula-(cylinder-grid|disc-pair|seat-slab|wheel-pair)\s+([^:]+):\s*([a-z][a-z0-9-]*)(?:,\s*(.*))?$/.exec(line);
    if (!declaration) { errors.push(`${anchor}: malformed formula ${line}`); continue; }
    const [, kind, names, id, operands] = declaration;
    for (const state of names.split(",")) {
      const part = parsed.parts.get(`${state}/${id}`);
      const envelope = parsed.envelopes.get(state);
      if (!part || !envelope) { errors.push(`${anchor}/${state}/${id}: formula target absent`); continue; }
      const W = envelope.x[1] - envelope.x[0];
      const H = envelope.y[1] - envelope.y[0];
      const D = envelope.z[1] - envelope.z[0];
      /** @param {string} claim */
      const fail = (claim) => errors.push(`${anchor}/${state}/${id}: formula ${claim}`);
      if (kind === "cylinder-grid") {
        const fields = operands?.split(/,\s*/);
        if (fields?.length !== 3) { fail("needs radius and two row heights"); continue; }
        const [r, lower, upper] = [ratio(fields[0]) * Math.min(W, H), ratio(fields[1]) * H, ratio(fields[2]) * H];
        const claim = /반지름 r=(\d+)min\(W,H\)\/(\d+)[^.]*?중심은[^.]*?y=(\d+)H\/(\d+),(\d+)H\/(\d+)/.exec(prose);
        if (!claim || !equal(r, Number(claim[1]) / Number(claim[2]) * Math.min(W, H)) ||
          !equal(lower, Number(claim[3]) / Number(claim[4]) * H) ||
          !equal(upper, Number(claim[5]) / Number(claim[6]) * H)) fail("prose cylinder grid differs");
        const xMax = W / 2, yMin = Math.min(lower, upper) - r, yMax = Math.max(lower, upper) + r;
        if (2 * r <= W - 2 * r || upper - lower >= 2 * r ||
          !equal(part.x[0], -xMax) || !equal(part.x[1], xMax) ||
          !equal(part.y[0], Math.min(0, yMin)) || !equal(part.y[1], yMax) ||
          !equal(part.z[0], -D / 2) || !equal(part.z[1], D / 2)) fail("cylinder union or part bounds differs");
        if (Math.hypot(W / 2 - r, (upper - lower) / 2) >= r - epsilon)
          fail("cylinder union leaves central axis unfilled");
      } else if (kind === "disc-pair") {
        const center = ratio(operands || "") * H;
        const claim = /중심 y=(\d+)H\/(\d+)인 반지름 W\/2의 원형 측판/.exec(prose);
        if (!claim || !equal(center, Number(claim[1]) / Number(claim[2]) * H)) fail("prose disc center differs");
        if (!equal(part.y[1], center + W / 2) || part.y[0] > center - W / 2 + epsilon) fail("disc extent differs");
      } else if (kind === "seat-slab") {
        const divisor = Number(operands);
        const scalar = /^@scalar-control outdoor-seat-height-ratio:\s*([\d.]+)$/m.exec(lines.join("\n"));
        const claim = /y=sH\.\.sH\+H\/(\d+)인 X\/Z 전폭 좌판/.exec(prose);
        const s = Number(scalar?.[1]);
        if (!Number.isInteger(divisor) || divisor <= 0 || !scalar || !claim || Number(claim[1]) !== divisor ||
          !(s > 0 && s < 1) || s * H + H / divisor > H + epsilon) fail("prose or slab height differs");
        if (!equal(part.x[0], -W / 2) || !equal(part.x[1], W / 2) ||
          !equal(part.z[0], -D / 2) || !equal(part.z[1], D / 2) ||
          part.y[0] > s * H + epsilon || part.y[1] < s * H + H / divisor - epsilon) fail("seat slab exits part bounds");
      } else {
        if (operands) { fail("wheel pair takes no operand"); continue; }
        const axis = [...lines.join("\n").matchAll(/^@axis-control\s+([^:]+):\s*([^,]+),\s*([XY]),\s*([\d.]+),\s*(.*)$/gm)]
          .filter((row) => row[1] === state && row[2] === id);
        const axleX = Number(axis.find((row) => row[3] === "X" && /wheel centers/.test(row[5]))?.[4]);
        const radius = Number(axis.find((row) => row[3] === "Y" && /wheel axle/.test(row[5]))?.[4]);
        if (!Number.isFinite(axleX) || !Number.isFinite(radius) || radius <= 0 ||
          !equal(part.x[0], -axleX - radius) || !equal(part.x[1], axleX + radius) ||
          part.y[0] > 0 + epsilon || part.y[1] < 2 * radius - epsilon) fail("wheel pair axle or bounds differs");
      }
      checked++;
    }
  }
  return { checked, errors };
}

module.exports = { check };

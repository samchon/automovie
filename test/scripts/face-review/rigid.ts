/** Rigid motion, and the screw it decomposes into, for three dimensions.
 *
 * Shared because two scripts need the same arithmetic and a second copy is a
 * second thing to be wrong: `measure-jaw-hinge.ts` reads the mandible's motion
 * out of the asset, and `rigidify-jaw-open.ts` writes it back.
 *
 * Both are written out rather than pulled in, because three by three is three
 * by three, and both are checked against known answers by their callers before
 * anything is believed -- a pure translation exercises none of the rotation
 * arithmetic, so a translation passing says nothing about a hinge.
 */
/** Centroid of the rows this selection names. */
export const centre = (points: number[], rows: number[]): number[] => {
  const out = [0, 0, 0];
  for (const row of rows)
    for (let k = 0; k < 3; k++) out[k] += points[row * 3 + k];
  return out.map((one) => one / rows.length);
};

/**
 * The rigid transform carrying `from` onto `to` over the given rows.
 *
 * Kabsch, with the rotation taken by polar decomposition rather than by SVD:
 * `R = H (H^T H)^(-1/2)`, and the inverse square root from a Jacobi sweep on a
 * symmetric three by three. Written out rather than pulled in, because three by
 * three is three by three.
 */
export const rigid = (from: number[], to: number[], rows: number[]) => {
  const a = centre(from, rows);
  const b = centre(to, rows);
  const h = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (const row of rows)
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        h[i * 3 + j] += (from[row * 3 + i] - a[i]) * (to[row * 3 + j] - b[j]);

  const m = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++) m[i * 3 + j] += h[k * 3 + i] * h[k * 3 + j];
  const v = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  for (let sweep = 0; sweep < 64; sweep++) {
    let off = 0;
    for (let p = 0; p < 3; p++)
      for (let q = p + 1; q < 3; q++) off += m[p * 3 + q] * m[p * 3 + q];
    if (off < 1e-30) break;
    for (let p = 0; p < 3; p++)
      for (let q = p + 1; q < 3; q++) {
        if (Math.abs(m[p * 3 + q]) < 1e-32) continue;
        const theta = (m[q * 3 + q] - m[p * 3 + p]) / (2 * m[p * 3 + q]);
        const t =
          (theta >= 0 ? 1 : -1) /
          (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < 3; k++) {
          const mp = m[k * 3 + p];
          const mq = m[k * 3 + q];
          m[k * 3 + p] = c * mp - s * mq;
          m[k * 3 + q] = s * mp + c * mq;
        }
        for (let k = 0; k < 3; k++) {
          const mp = m[p * 3 + k];
          const mq = m[q * 3 + k];
          m[p * 3 + k] = c * mp - s * mq;
          m[q * 3 + k] = s * mp + c * mq;
          const vp = v[k * 3 + p];
          const vq = v[k * 3 + q];
          v[k * 3 + p] = c * vp - s * vq;
          v[k * 3 + q] = s * vp + c * vq;
        }
      }
  }
  const inverse = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++)
        inverse[i * 3 + j] +=
          (v[i * 3 + k] * v[j * 3 + k]) /
          Math.sqrt(Math.max(m[k * 3 + k], 1e-32));
  // `H (H^T H)^(-1/2)` and not the other order: with `H = U S V^T` the first is
  // `U V^T` and the second is nothing in particular. The two agree on the angle
  // they report, because a rotation and its transpose turn through the same
  // amount, which is why a check that reads only the angle passes either way.
  const r = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++)
        r[i * 3 + j] += h[i * 3 + k] * inverse[k * 3 + j];

  // `h` was accumulated as sum of (from - a)(to - b)^T, so `U V^T` carries a
  // centred `to` back onto a centred `from`. Transposed once here, it carries
  // `from` onto `to` as an ordinary rotation acting on a column.
  const rotation = [r[0], r[3], r[6], r[1], r[4], r[7], r[2], r[5], r[8]];
  const turn = (x: number[]): number[] => [
    rotation[0] * x[0] + rotation[1] * x[1] + rotation[2] * x[2],
    rotation[3] * x[0] + rotation[4] * x[1] + rotation[5] * x[2],
    rotation[6] * x[0] + rotation[7] * x[1] + rotation[8] * x[2],
  ];
  const apply = (x: number[]): number[] => {
    const spun = turn([x[0] - a[0], x[1] - a[1], x[2] - a[2]]);
    return [spun[0] + b[0], spun[1] + b[1], spun[2] + b[2]];
  };

  let sum = 0;
  for (const row of rows) {
    const got = apply([from[row * 3], from[row * 3 + 1], from[row * 3 + 2]]);
    for (let k = 0; k < 3; k++) sum += (got[k] - to[row * 3 + k]) ** 2;
  }
  const trace = rotation[0] + rotation[4] + rotation[8];
  return {
    apply,
    turn,
    degrees:
      (Math.acos(Math.min(1, Math.max(-1, (trace - 1) / 2))) * 180) / Math.PI,
    rms: Math.sqrt(sum / rows.length),
  };
};

/**
 * An axis, a point on it, and the slide along it, from a rigid transform.
 *
 * Every rigid motion is a screw: a rotation about some axis and a translation
 * along that same axis. Having it in that form is what lets the motion be
 * written at any fraction of itself, which a matrix and an offset cannot do --
 * interpolating those linearly is exactly the chord that is in question here.
 *
 * The pivot is found in the plane across the axis, where the motion is a plain
 * two dimensional rotation with an offset and the fixed point is one inverse of
 * a two by two. Along the axis there is no fixed point, only the slide.
 */
export const screwOf = (turn: (x: number[]) => number[], move: number[]) => {
  const column = (k: number) =>
    turn([k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0]);
  const r = [column(0), column(1), column(2)];
  const trace = r[0][0] + r[1][1] + r[2][2];
  const angle = Math.acos(Math.min(1, Math.max(-1, (trace - 1) / 2)));
  const sin = Math.sin(angle);
  if (sin < 1e-12) throw new Error("the jaw does not turn; there is no screw");
  // The skew part of a rotation is its axis times the sine of its angle.
  const axis = [
    (r[1][2] - r[2][1]) / (2 * sin),
    (r[2][0] - r[0][2]) / (2 * sin),
    (r[0][1] - r[1][0]) / (2 * sin),
  ];
  const slide = axis[0] * move[0] + axis[1] * move[1] + axis[2] * move[2];
  // Any unit vector across the axis, and its partner, to work in that plane.
  const seed = Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const dot = seed[0] * axis[0] + seed[1] * axis[1] + seed[2] * axis[2];
  const raw = seed.map((one, k) => one - dot * axis[k]);
  const size = Math.hypot(raw[0], raw[1], raw[2]);
  const u = raw.map((one) => one / size);
  const w = [
    axis[1] * u[2] - axis[2] * u[1],
    axis[2] * u[0] - axis[0] * u[2],
    axis[0] * u[1] - axis[1] * u[0],
  ];
  const flat = [
    move[0] * u[0] + move[1] * u[1] + move[2] * u[2],
    move[0] * w[0] + move[1] * w[1] + move[2] * w[2],
  ];
  const cos = Math.cos(angle);
  // `(I - R2) p = t2`, whose determinant is `2 (1 - cos)` and never zero here.
  const scale = 1 / (2 * (1 - cos));
  const local = [
    scale * ((1 - cos) * flat[0] - sin * flat[1]),
    scale * (sin * flat[0] + (1 - cos) * flat[1]),
  ];
  const pivot = [0, 1, 2].map((k) => local[0] * u[k] + local[1] * w[k]);

  /** The same motion at any fraction of itself, Rodrigues about the axis. */
  const at = (fraction: number) => {
    const a = angle * fraction;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return (x: number[]) => {
      const d = [x[0] - pivot[0], x[1] - pivot[1], x[2] - pivot[2]];
      const along = axis[0] * d[0] + axis[1] * d[1] + axis[2] * d[2];
      const cross = [
        axis[1] * d[2] - axis[2] * d[1],
        axis[2] * d[0] - axis[0] * d[2],
        axis[0] * d[1] - axis[1] * d[0],
      ];
      return [0, 1, 2].map(
        (k) =>
          pivot[k] +
          d[k] * c +
          cross[k] * s +
          axis[k] * along * (1 - c) +
          axis[k] * slide * fraction,
      );
    };
  };
  return { axis, pivot, slide, degrees: (angle * 180) / Math.PI, at };
};

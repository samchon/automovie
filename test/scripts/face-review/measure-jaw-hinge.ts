/** Is the jaw a hinge, and does the tongue ride it?
 *
 * The lower dental arch is a rigid body -- `jawLeft` moves it 7.92 mm with a
 * residual of 0.000 mm -- so whatever `jawOpen` does to it can be read as one
 * rotation and one translation rather than as a field of displacements. That
 * rigid transform is the mandible's own motion, measured from the asset rather
 * than assumed about it.
 *
 * Two things follow from having it. The residual of predicting the arch with it
 * says how far `jawOpen` departs from a hinge at all, which is the case for
 * driving the jaw as a joint. And applying it to the tongue says whether the
 * tongue rides the mandible, which is the premise a `tongueOut x jawOpen`
 * corrective rests on: if the tongue is carried by the jaw, then protruding it
 * from an open mouth is protruding it in the jaw's rotated frame, and what the
 * linear sum is missing is exactly `(R - I) * T`.
 *
 * The arch is found rather than named: it is the set of teeth vertices that
 * `jawOpen` actually moves, which after the arch split is a separate piece.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/measure-jaw-hinge.ts
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

const published = "studies/human-face/connected-basis/global-face";
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/basis.json.gz`)).toString("utf8"),
);
const documents: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(`${published}/subjects.json`, "utf8"),
);
const build = createHumanFaceBasisBuilder(basis);

/** A part's flat positions, in metres, as the builder emits them. */
const placed = (
  document: IAutoMovieHumanFaceBasisDocument,
  part: string,
): number[] => {
  const one = build(document).parts.find((each) => each.id === part);
  if (one === undefined) throw new Error(`no part ${part}`);
  if (one.geometry.type !== "mesh") throw new Error(`${part} is not a mesh`);
  return one.geometry.mesh.positions;
};

/** Centroid of the rows this selection names. */
const centre = (points: number[], rows: number[]): number[] => {
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
const rigid = (from: number[], to: number[], rows: number[]) => {
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

// The instrument is checked before it is believed, on both of its paths. A
// pure translation exercises none of the rotation arithmetic -- it comes back
// as the identity -- so a translation passing says nothing about a hinge. The
// arch is therefore also turned through a known angle about a known pivot and
// the fit asked to give that angle back with nothing left over.
{
  const one = documents[0];
  const part = "Human.teeth_base/Human.teeth_base";
  const still = placed({ ...one, expression: {} }, part);
  const side = placed({ ...one, expression: { jawLeft: 1 } }, part);
  const moved: number[] = [];
  for (let row = 0; row < still.length / 3; row++) {
    let travel = 0;
    for (let k = 0; k < 3; k++)
      travel += (side[row * 3 + k] - still[row * 3 + k]) ** 2;
    if (travel > 1e-10) moved.push(row);
  }
  const slid = rigid(still, side, moved);
  console.log(
    `self-check, translation: ${slid.degrees.toFixed(3)} deg,` +
      ` residual ${(slid.rms * 1000).toFixed(4)} mm`,
  );
  if (slid.rms * 1000 > 0.01)
    throw new Error("the fit cannot reproduce a pure translation");

  const DEGREES = 20;
  const radians = (DEGREES * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const pivot = [0, 0, 0.06];
  const turned = [...still];
  for (const row of moved) {
    const y = still[row * 3 + 1] - pivot[1];
    const z = still[row * 3 + 2] - pivot[2];
    turned[row * 3 + 1] = pivot[1] + cos * y - sin * z;
    turned[row * 3 + 2] = pivot[2] + sin * y + cos * z;
  }
  const spun = rigid(still, turned, moved);
  console.log(
    `self-check, ${DEGREES} degree rotation: ${spun.degrees.toFixed(3)} deg,` +
      ` residual ${(spun.rms * 1000).toFixed(4)} mm`,
  );
  if (Math.abs(spun.degrees - DEGREES) > 0.01 || spun.rms * 1000 > 0.001)
    throw new Error("the fit cannot reproduce a known rotation");
}

const rows: Record<string, unknown> = {};
for (const document of documents) {
  const name = document.id.replace("-connected", "");
  const rest = { ...document, expression: {} };
  const open = { ...document, expression: { jawOpen: 1 } };

  const teethRest = placed(rest, "Human.teeth_base/Human.teeth_base");
  const teethOpen = placed(open, "Human.teeth_base/Human.teeth_base");
  const arch: number[] = [];
  for (let row = 0; row < teethRest.length / 3; row++) {
    let moved = 0;
    for (let k = 0; k < 3; k++)
      moved += (teethOpen[row * 3 + k] - teethRest[row * 3 + k]) ** 2;
    if (moved > 1e-10) arch.push(row);
  }
  const hinge = rigid(teethRest, teethOpen, arch);

  // Does the tongue ride it? Predict the tongue's open pose with the jaw's own
  // transform and read what is left over against how far it travelled.
  const tongueRest = placed(rest, "Human.tongue01/Human.tongue01");
  const tongueOpen = placed(open, "Human.tongue01/Human.tongue01");
  let carried = 0;
  let travelled = 0;
  const count = tongueRest.length / 3;
  for (let row = 0; row < count; row++) {
    const point = [
      tongueRest[row * 3],
      tongueRest[row * 3 + 1],
      tongueRest[row * 3 + 2],
    ];
    const got = hinge.apply(point);
    for (let k = 0; k < 3; k++) {
      carried += (got[k] - tongueOpen[row * 3 + k]) ** 2;
      travelled += (tongueOpen[row * 3 + k] - point[k]) ** 2;
    }
  }
  const residual = Math.sqrt(carried / count) * 1000;
  const motion = Math.sqrt(travelled / count) * 1000;

  rows[name] = {
    archVertices: arch.length,
    hingeDegrees: Number(hinge.degrees.toFixed(3)),
    hingeResidualMm: Number((hinge.rms * 1000).toFixed(4)),
    tongueMotionMm: Number(motion.toFixed(3)),
    tongueResidualMm: Number(residual.toFixed(3)),
    tongueExplained: Number((1 - residual / motion).toFixed(4)),
  };
  console.log(
    `${name.padEnd(26)} arch ${String(arch.length).padStart(4)}` +
      `   hinge ${hinge.degrees.toFixed(2)} deg, residual ${(hinge.rms * 1000).toFixed(3)} mm` +
      `   tongue travels ${motion.toFixed(2)} mm, hinge leaves ${residual.toFixed(2)} mm`,
  );
}
fs.writeFileSync(
  "../.shots/human-2469/investigation-2498/jaw-hinge.json",
  `${JSON.stringify(rows, null, 2)}\n`,
);

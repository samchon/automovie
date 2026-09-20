/** Is the jaw a hinge, and does the tongue ride it?
 *
 * The lower dental arch is a rigid body -- `jawLeft` moves it 7.92 mm with a
 * residual of 0.000 mm -- so whatever `jawOpen` does to it can be read as one
 * rotation and one translation rather than as a field of displacements. That
 * rigid transform is the mandible's own motion, measured from the asset rather
 * than assumed about it.
 *
 * Three things follow from having it. The residual of predicting the arch with
 * it says how far `jawOpen` departs from a hinge at all, which is the case for
 * driving the jaw as a joint. Applying it to the tongue says whether the tongue
 * rides the mandible, which is the premise a `tongueOut x jawOpen` corrective
 * rests on: if the tongue is carried by the jaw, then protruding it from an
 * open mouth is protruding it in the jaw's rotated frame, and what the linear
 * sum is missing is exactly `(R - I) * T`.
 *
 * And the third is what a joint would fix that the endpoint cannot. An endpoint
 * is interpolated linearly, so a jaw half open travels along the chord of the
 * arc it should be turning through, and the chord is shorter than the arc. The
 * transform is therefore split into its screw -- an axis, a point on it, and
 * whatever slides along it -- so the pose at any fraction can be written down
 * exactly and compared with the one the basis actually builds. That difference
 * is the defect, in millimetres, and it is measured rather than argued.
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
const screwOf = (turn: (x: number[]) => number[], move: number[]) => {
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

  // The same bone, moved by a different channel. `jawLeft` slides the mandible
  // and leaves nothing over, so the set of vertices is a rigid body and the fit
  // can see that it is. Whatever `jawOpen` leaves over is therefore the
  // endpoint deforming a bone, not the instrument failing to fit one.
  const teethSide = placed(
    { ...document, expression: { jawLeft: 1 } },
    "Human.teeth_base/Human.teeth_base",
  );
  const sliding: number[] = [];
  for (let row = 0; row < teethRest.length / 3; row++) {
    let moved = 0;
    for (let k = 0; k < 3; k++)
      moved += (teethSide[row * 3 + k] - teethRest[row * 3 + k]) ** 2;
    if (moved > 1e-10) sliding.push(row);
  }
  const slide = rigid(teethRest, teethSide, sliding);
  const screw = screwOf(hinge.turn, hinge.apply([0, 0, 0]));
  // The screw is checked against the transform it came from before it is used
  // to say anything about fractions of it: at one it has to be that transform.
  for (const row of arch) {
    const point = [
      teethRest[row * 3],
      teethRest[row * 3 + 1],
      teethRest[row * 3 + 2],
    ];
    const whole = hinge.apply(point);
    const spun = screw.at(1)(point);
    for (let k = 0; k < 3; k++)
      if (Math.abs(whole[k] - spun[k]) > 1e-9)
        throw new Error(
          `the screw does not reproduce the transform it came from,` +
            ` by ${Math.abs(whole[k] - spun[k]).toExponential(2)} m`,
        );
  }

  // What the endpoint costs, as pure geometry. Two questions, kept apart,
  // because a first attempt ran them together and reported the rigid fit's own
  // worst residual as if it were the cost of interpolating: at full open the
  // chord and the arc are the same pose, so anything left there is the arch
  // not being perfectly rigid, not the interpolation.
  //
  // First, is the basis really walking the chord? The displacement is linear in
  // the weight, so it must be, and that is checked rather than assumed.
  // Second, how far is that chord from the arc the measured screw turns
  // through? Both are taken from the same rigid motion, so the answer is zero
  // at either end and is the interpolation and nothing else.
  const FRACTIONS = [0.25, 0.5, 0.75, 1.0];
  const straying: number[] = [];
  const arcing: number[] = [];
  for (const fraction of FRACTIONS) {
    const part = placed(
      { ...document, expression: { jawOpen: fraction } },
      "Human.teeth_base/Human.teeth_base",
    );
    let straight = 0;
    let bowed = 0;
    for (const row of arch) {
      const rest = [
        teethRest[row * 3],
        teethRest[row * 3 + 1],
        teethRest[row * 3 + 2],
      ];
      const whole = screw.at(1)(rest);
      const arc = screw.at(fraction)(rest);
      for (let k = 0; k < 3; k++) {
        const chord = rest[k] + fraction * (teethOpen[row * 3 + k] - rest[k]);
        straight = Math.max(straight, Math.abs(part[row * 3 + k] - chord));
        bowed = Math.max(
          bowed,
          Math.abs(arc[k] - (rest[k] + fraction * (whole[k] - rest[k]))),
        );
      }
    }
    straying.push(Number((straight * 1000).toFixed(4)));
    arcing.push(Number((bowed * 1000).toFixed(3)));
  }
  if (Math.max(...straying) > 0.001)
    throw new Error(
      `the basis is not interpolating the endpoint linearly` +
        ` (up to ${Math.max(...straying)} mm off the chord)`,
    );

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
    slideVertices: sliding.length,
    slideResidualMm: Number((slide.rms * 1000).toFixed(4)),
    axis: screw.axis.map((one) => Number(one.toFixed(6))),
    pivotMetres: screw.pivot.map((one) => Number(one.toFixed(6))),
    slideMillimetres: Number((screw.slide * 1000).toFixed(4)),
    chordVersusArcMm: Object.fromEntries(
      FRACTIONS.map((fraction, index) => [fraction, arcing[index]]),
    ),
    tongueMotionMm: Number(motion.toFixed(3)),
    tongueResidualMm: Number(residual.toFixed(3)),
    tongueExplained: Number((1 - residual / motion).toFixed(4)),
  };
  console.log(
    `${name.padEnd(26)} arch ${String(arch.length).padStart(4)}` +
      `   jawLeft leaves ${(slide.rms * 1000).toFixed(3)} mm on ${sliding.length}` +
      `   hinge ${hinge.degrees.toFixed(2)} deg, residual ${(hinge.rms * 1000).toFixed(3)} mm` +
      `   tongue travels ${motion.toFixed(2)} mm, hinge leaves ${residual.toFixed(2)} mm` +
      `   chord falls inside the arc by ${arcing.map((one) => one.toFixed(2)).join("/")} mm`,
  );
}
fs.writeFileSync(
  "../.shots/human-2469/investigation-2498/jaw-hinge.json",
  `${JSON.stringify(rows, null, 2)}\n`,
);

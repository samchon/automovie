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

import { rigid, screwOf } from "./rigid";

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

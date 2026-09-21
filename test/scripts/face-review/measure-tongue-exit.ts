/** Where does the tongue come through the lips, once the mouth is already open?
 *
 * Opening the jaw clears the `tongueOut` crossing on twelve of the eighteen.
 * Six still carry four to forty-nine triangles with the mouth as wide as it
 * goes, and the obvious reading -- that the tongue is authored too long for
 * those faces -- is wrong: how far the tongue protrudes past the lips runs from
 * 2.70 mm to 7.25 mm across the population and correlates with the leftover at
 * +0.026, with the largest and the smallest protrusion both leaving nothing.
 *
 * So the question is not how far the tongue goes but where it leaves. This
 * reads the lips as the front surface and the tongue as the back one along the
 * forward axis, which makes a negative gap exactly a lip the tongue is standing
 * in front of, and reports those lips by where they sit: above or below the
 * mouth's own centre, and how far out towards a corner.
 *
 * The measurement is directional surface ordering rather than a closed-volume
 * test, which is what is wanted here -- a tongue emerging through the opening
 * is not a fault, a tongue emerging through lip flesh is, and the two differ by
 * which lip is in front.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/measure-tongue-exit.ts
 */
import { measureAutoMovieMeshClearance } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import type { IAutoMovieMesh } from "@automovie/interface";
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

/** The pose in question: tongue right out of a mouth already wide open. */
const POSE = { tongueOut: 1, jawOpen: 1 };

/** A part's mesh, by the id the built model gives it. */
const meshOf = (
  document: IAutoMovieHumanFaceBasisDocument,
  part: string,
): IAutoMovieMesh => {
  const one = build(document).parts.find((each) => each.id === part);
  if (one === undefined) throw new Error(`no part ${part}`);
  if (one.geometry.type !== "mesh") throw new Error(`${part} is not a mesh`);
  return one.geometry.mesh;
};

const rows: Record<string, unknown> = {};
for (const document of documents) {
  const name = document.id.replace("-connected", "");
  const posed = { ...document, expression: POSE };
  const lips = meshOf(posed, "Human/lips");
  const tongue = meshOf(posed, "Human.tongue01/Human.tongue01");

  // Forward is +Z, so a lip standing behind the tongue has a negative gap.
  const clearance = measureAutoMovieMeshClearance(lips, tongue, "z");
  const breached = clearance.filter((one) => one.minimum < 0);

  // Where each breached lip sits, in the mouth's own frame: the mouth's centre
  // of height, and how far out towards a corner as a share of the half width.
  const indices = lips.indices ?? [
    ...new Array(lips.positions.length / 3).keys(),
  ];
  const heights: number[] = [];
  let widest = 0;
  for (let row = 0; row < lips.positions.length / 3; row++) {
    heights.push(lips.positions[row * 3 + 1]);
    widest = Math.max(widest, Math.abs(lips.positions[row * 3]));
  }
  const middle = [...heights].sort((a, b) => a - b)[
    Math.floor(heights.length / 2)
  ];

  let upper = 0;
  let lower = 0;
  let corner = 0;
  let deepest = 0;
  let sideways = 0;
  for (const one of breached) {
    const corners = [0, 1, 2].map((k) => indices[one.triangle * 3 + k]);
    const height =
      corners.reduce((sum, row) => sum + lips.positions[row * 3 + 1], 0) / 3;
    const across =
      corners.reduce((sum, row) => sum + Math.abs(lips.positions[row * 3]), 0) /
      3;
    if (height >= middle) upper++;
    else lower++;
    const out = widest === 0 ? 0 : across / widest;
    sideways += out;
    if (out > 0.5) corner++;
    deepest = Math.min(deepest, one.minimum);
  }

  rows[name] = {
    lipsBehindTongue: breached.length,
    upper,
    lower,
    towardsCorner: corner,
    meanAcross:
      breached.length === 0
        ? null
        : Number((sideways / breached.length).toFixed(3)),
    deepestMm: Number((deepest * 1000).toFixed(2)),
  };
  console.log(
    `${name.padEnd(26)} ${String(breached.length).padStart(4)} lips behind the tongue` +
      `   upper ${String(upper).padStart(4)} lower ${String(lower).padStart(4)}` +
      `   towards a corner ${String(corner).padStart(4)}` +
      `   deepest ${(deepest * 1000).toFixed(2)} mm`,
  );
}
fs.writeFileSync(
  "../.shots/human-2469/investigation-2498/tongue-exit.json",
  `${JSON.stringify(rows, null, 2)}\n`,
);

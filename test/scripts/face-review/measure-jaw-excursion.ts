/** How far this jaw actually goes, against how far a jaw goes.
 *
 * Twenty-one of the thirty-eight expression pairs that put a surface through a
 * surface neither side crosses are teeth through lips, and every one involves a
 * jaw channel. The arch stays rigid under all of them, so the bone is not being
 * put somewhere a bone cannot be shaped. That leaves two explanations and they
 * ask for opposite fixes: either the lips fail to follow a jaw that is where it
 * says it is, or the pose was never a pose.
 *
 * The second can be settled against something outside this repository. A
 * mandible's range has been measured clinically for a century, and the numbers
 * are not in dispute:
 *
 *   maximum interincisal opening   40 to 60 mm in adults
 *   maximum protrusion              6 to 10 mm
 *   maximum lateral excursion       8 to 12 mm to either side
 *
 * So this reads the same three quantities off the asset at full drive. A
 * channel that overshoots is asking for a jaw nobody has, and the crossing it
 * causes is the rig's fault before it is the lips'. A channel that lands inside
 * the range is a channel doing its job, and then the lips are the ones at
 * fault.
 *
 * The landmarks are found rather than named. The lower arch is the set of
 * vertices `jawOpen` moves; the upper arch is the rest of the same surface. An
 * incisal edge is the biting corner of the front teeth: the frontmost two
 * percent of an arch, and within that the highest vertex for the lower arch and
 * the lowest for the upper. The order matters -- taking the height band first
 * and the frontmost of that lands on gum, and reported the two arches 27 mm
 * apart at rest in a mouth whose teeth are touching.
 *
 * What it measures. Protrusion is 8.4 mm and lateral excursion 7.9 mm to either
 * side, which is a jaw; opening is 34.3 mm, a little short of the forty a
 * clinician calls the bottom of normal. So the channels are not over-driven and
 * the poses they reach on their own are poses. The teeth going through the lips
 * is the lips failing to follow a jaw that is where it says it is.
 *
 * One thing this does not clear. Each channel being within range says nothing
 * about two at once: maximum lateral excursion does not happen at maximum
 * protrusion, so `jawForward` and `jawLeft` both at full is still a corner of a
 * box that the envelope does not contain. Four independent channels cannot
 * express that and a joint can.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/measure-jaw-excursion.ts
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

/** What a mandible does, from the clinical literature, in millimetres. */
const HUMAN = {
  interincisalOpening: [40, 60],
  protrusion: [6, 10],
  lateralExcursion: [8, 12],
} as const;

const BONE = "Human.teeth_base/Human.teeth_base";
const published = "studies/human-face/connected-basis/global-face";
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/basis.json.gz`)).toString("utf8"),
);
const documents: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(`${published}/subjects.json`, "utf8"),
);
const build = createHumanFaceBasisBuilder(basis);

const placed = (
  document: IAutoMovieHumanFaceBasisDocument,
  expression: Record<string, number>,
): number[] => {
  const one = build({ ...document, expression, hair: undefined }).parts.find(
    (each) => each.id === BONE,
  );
  if (one === undefined || one.geometry.type !== "mesh")
    throw new Error(`no mesh part ${BONE}`);
  return one.geometry.mesh.positions;
};

const point = (flat: number[], row: number) => [
  flat[row * 3],
  flat[row * 3 + 1],
  flat[row * 3 + 2],
];
const apart = (a: number[], b: number[]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 1000;

const report: Record<string, unknown> = {};
for (const document of documents) {
  const name = document.id.replace("-connected", "");
  const rest = placed(document, {});
  const open = placed(document, { jawOpen: 1 });

  const lower: number[] = [];
  const upper: number[] = [];
  for (let row = 0; row < rest.length / 3; row++) {
    let travel = 0;
    for (let k = 0; k < 3; k++)
      travel += (open[row * 3 + k] - rest[row * 3 + k]) ** 2;
    (travel > 1e-10 ? lower : upper).push(row);
  }

  /** The incisal edge of an arch: the biting corner of its front teeth.
   *
   * Found rather than named, and in that order -- forward first, then height.
   * Taking the height band first and the frontmost of it picks a vertex on the
   * gum, which is how a first attempt reported the arches 27 mm apart at rest
   * when the geometry has them touching.
   */
  const incisal = (rows: number[], lowerArch: boolean): number => {
    const depths = [...rows]
      .map((row) => rest[row * 3 + 2])
      .sort((a, b) => a - b);
    const front = depths[Math.floor(depths.length * 0.98)];
    let best = rows[0];
    let edge = lowerArch ? -Infinity : Infinity;
    for (const row of rows) {
      if (rest[row * 3 + 2] < front) continue;
      const height = rest[row * 3 + 1];
      if (lowerArch ? height > edge : height < edge) {
        edge = height;
        best = row;
      }
    }
    return best;
  };

  const lowerEdge = incisal(lower, true);
  const upperEdge = incisal(upper, false);
  // Opening is what a clinician measures: how far apart the two biting edges
  // stand. At rest they touch, so the resting figure is reported beside it as
  // the check that the edges were found at all.
  const measured = {
    interincisalOpening: apart(point(open, lowerEdge), point(rest, upperEdge)),
    restingInterincisal: apart(point(rest, lowerEdge), point(rest, upperEdge)),
    protrusion: apart(
      point(placed(document, { jawForward: 1 }), lowerEdge),
      point(rest, lowerEdge),
    ),
    lateralLeft: apart(
      point(placed(document, { jawLeft: 1 }), lowerEdge),
      point(rest, lowerEdge),
    ),
    lateralRight: apart(
      point(placed(document, { jawRight: 1 }), lowerEdge),
      point(rest, lowerEdge),
    ),
  };
  report[name] = measured;
  console.log(
    `${name.padEnd(26)} open ${measured.interincisalOpening.toFixed(1).padStart(5)}` +
      `  rest ${measured.restingInterincisal.toFixed(1).padStart(4)}` +
      `  forward ${measured.protrusion.toFixed(1).padStart(5)}` +
      `  left ${measured.lateralLeft.toFixed(1).padStart(5)}` +
      `  right ${measured.lateralRight.toFixed(1).padStart(5)}`,
  );
}

const middle = (pick: (row: Record<string, number>) => number) => {
  const rows = Object.values(report).map((one) =>
    pick(one as Record<string, number>),
  );
  return [...rows].sort((a, b) => a - b)[Math.floor(rows.length / 2)];
};
const verdict = (value: number, range: readonly [number, number]) =>
  value < range[0]
    ? `short of ${range[0]}`
    : value > range[1]
      ? `past ${range[1]}`
      : "within";

console.log();
console.log(`${"quantity".padEnd(24)} ${"asset".padStart(7)}  human      verdict`);
for (const [key, range, pick] of [
  [
    "interincisal opening",
    HUMAN.interincisalOpening,
    (row: Record<string, number>) => row.interincisalOpening,
  ],
  ["protrusion", HUMAN.protrusion, (row: Record<string, number>) => row.protrusion],
  [
    "lateral, left",
    HUMAN.lateralExcursion,
    (row: Record<string, number>) => row.lateralLeft,
  ],
  [
    "lateral, right",
    HUMAN.lateralExcursion,
    (row: Record<string, number>) => row.lateralRight,
  ],
] as const) {
  const value = middle(pick);
  console.log(
    `${key.padEnd(24)} ${value.toFixed(1).padStart(7)}  ` +
      `${`${range[0]}-${range[1]}`.padEnd(9)}  ${verdict(value, range)}`,
  );
}

fs.writeFileSync(
  "../.shots/human-2469/investigation-2498/jaw-excursion.json",
  `${JSON.stringify({ human: HUMAN, subjects: report }, null, 2)}\n`,
);

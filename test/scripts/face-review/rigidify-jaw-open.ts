/** Stop `jawOpen` from kneading a mandible.
 *
 * Bone does not bend, and this asset's lower dental arch knows it: `jawLeft`
 * slides the same 2180 vertices and a rigid fit leaves 0.000 mm over. `jawOpen`
 * leaves 2.29 to 2.70 mm on them, on every subject. That is not the instrument
 * failing to fit a rigid body -- the control proves it can -- it is the
 * authored endpoint deforming one.
 *
 * So the endpoint is replaced by the motion it is already almost exactly. The
 * rigid transform is fitted on the neutral arch, decomposed into its screw, and
 * written back as the displacement that screw produces. Nothing else in the
 * basis is touched: the skin, the tongue and the lips are soft tissue and their
 * share of `jawOpen` is theirs.
 *
 * What this does not fix, and what would. A displacement field is a field, so
 * once identity has moved the arch the same field is no longer that arch's own
 * rotation: the error left is `(I - R) S`, about a third of however far the
 * shape channels carried the teeth. Only a joint -- rotating the posed arch
 * about a posed pivot -- is exactly right at every identity, and that is a
 * change to what a basis is, not to what one endpoint says. This is measured
 * here per subject so the remainder is known rather than assumed, and the
 * chord an endpoint walks instead of an arc, 1.16 mm at half open, is likewise
 * the joint's to fix and not this step's.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/rigidify-jaw-open.ts [--write]
 */
import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import fs from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";

import { rigid, screwOf } from "./rigid";

/** The identity this revision publishes under, and the one it succeeds. */
const REVISION = "mpfb-connected-head-2026-09-20-rigid-mandible";
const SUCCEEDS = "mpfb-connected-head-2026-09-20-strand-alpha";

/** The one surface that is bone. */
const BONE = "Human.teeth_base";

const published = "studies/human-face/connected-basis/global-face";
const file = `${published}/basis.json.gz`;
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(file)).toString("utf8"),
);
const documents: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(`${published}/subjects.json`, "utf8"),
);

const jaw = basis.channels.find((one) => one.id === "jawOpen");
if (jaw === undefined || jaw.positive === null)
  throw new Error("this basis has no jawOpen with a positive endpoint");
const OPEN = jaw.positive;
const surface = basis.surfaces.find((one) => one.id === BONE);
if (surface === undefined) throw new Error(`this basis has no ${BONE}`);
const rows = surface.targets[OPEN];
if (rows === undefined || rows.length === 0)
  throw new Error(`${OPEN} does not move ${BONE}`);

const neutral = surface.positions;
const arch: number[] = [];
const opened = [...neutral];
for (let i = 0; i < rows.length; i += 4) {
  const vertex = rows[i];
  arch.push(vertex);
  for (let k = 0; k < 3; k++) opened[vertex * 3 + k] += rows[i + 1 + k];
}

const hinge = rigid(neutral, opened, arch);
const screw = screwOf(hinge.turn, hinge.apply([0, 0, 0]));
console.log(
  `${BONE}: ${OPEN} moves ${arch.length} vertices, ` +
    `${hinge.degrees.toFixed(3)} degrees, residual ` +
    `${(hinge.rms * 1000).toFixed(4)} mm on the neutral arch`,
);
console.log(
  `  axis [${screw.axis.map((one) => one.toFixed(6)).join(", ")}], ` +
    `pivot [${screw.pivot.map((one) => one.toFixed(6)).join(", ")}] m, ` +
    `slide ${(screw.slide * 1000).toFixed(4)} mm`,
);

// The screw is checked against the transform it came from before it writes
// anything: at one it has to be that transform, to the last place.
for (const vertex of arch) {
  const point = [
    neutral[vertex * 3],
    neutral[vertex * 3 + 1],
    neutral[vertex * 3 + 2],
  ];
  const whole = hinge.apply(point);
  const spun = screw.at(1)(point);
  for (let k = 0; k < 3; k++)
    if (Math.abs(whole[k] - spun[k]) > 1e-9)
      throw new Error("the screw does not reproduce the transform it came from");
}

const replaced: number[] = [];
let worst = 0;
let sum = 0;
for (const vertex of arch) {
  const point = [
    neutral[vertex * 3],
    neutral[vertex * 3 + 1],
    neutral[vertex * 3 + 2],
  ];
  const spun = screw.at(1)(point);
  const move = [0, 1, 2].map((k) => spun[k] - point[k]);
  replaced.push(vertex, move[0], move[1], move[2]);
  let apart = 0;
  for (let k = 0; k < 3; k++) {
    const was = opened[vertex * 3 + k] - point[k];
    apart += (move[k] - was) ** 2;
  }
  worst = Math.max(worst, Math.sqrt(apart));
  sum += apart;
}
console.log(
  `  the endpoint moves by ${(Math.sqrt(sum / arch.length) * 1000).toFixed(3)} mm ` +
    `at the root mean square and ${(worst * 1000).toFixed(3)} mm at the worst`,
);

// What is left per subject once identity has moved the arch: the field is a
// field, so `(I - R) S` survives. Measured, not assumed.
const build = createHumanFaceBasisBuilder(basis);
const placed = (
  document: IAutoMovieHumanFaceBasisDocument,
  part: string,
): number[] => {
  const one = build(document).parts.find((each) => each.id === part);
  if (one === undefined || one.geometry.type !== "mesh")
    throw new Error(`no mesh part ${part}`);
  return one.geometry.mesh.positions;
};

/** Surfaces that pass through each other in this pose, as pair to triangles. */
const crossingsOf = (model: ReturnType<typeof build>): Map<string, number> => {
  const found = new Map<string, number>();
  for (const crossing of measureAutoMovieModelCrossings(model)) {
    const pair = [crossing.part, crossing.other]
      .sort((a, b) => a.localeCompare(b))
      .join(" x ");
    found.set(
      pair,
      (found.get(pair) ?? 0) + crossing.triangles + crossing.otherTriangles,
    );
  }
  return found;
};

const before: number[] = [];
const crossedBefore: Map<string, number>[] = [];
const part = `${BONE}/${BONE}`;
for (const document of documents) {
  const rest = placed({ ...document, expression: {} }, part);
  const open = placed({ ...document, expression: { jawOpen: 1 } }, part);
  const moved: number[] = [];
  for (let row = 0; row < rest.length / 3; row++) {
    let travel = 0;
    for (let k = 0; k < 3; k++)
      travel += (open[row * 3 + k] - rest[row * 3 + k]) ** 2;
    if (travel > 1e-10) moved.push(row);
  }
  before.push(rigid(rest, open, moved).rms * 1000);
  crossedBefore.push(crossingsOf(build({ ...document, expression: { jawOpen: 1 } })));
}

surface.targets[OPEN] = replaced;
const after: number[] = [];
const crossedAfter: Map<string, number>[] = [];
const rebuilt = createHumanFaceBasisBuilder(basis);
for (const document of documents) {
  const at = (expression: Record<string, number>): number[] => {
    const one = rebuilt({ ...document, expression }).parts.find(
      (each) => each.id === part,
    );
    if (one === undefined || one.geometry.type !== "mesh")
      throw new Error(`no mesh part ${part}`);
    return one.geometry.mesh.positions;
  };
  const rest = at({});
  const open = at({ jawOpen: 1 });
  const moved: number[] = [];
  for (let row = 0; row < rest.length / 3; row++) {
    let travel = 0;
    for (let k = 0; k < 3; k++)
      travel += (open[row * 3 + k] - rest[row * 3 + k]) ** 2;
    if (travel > 1e-10) moved.push(row);
  }
  after.push(rigid(rest, open, moved).rms * 1000);
  crossedAfter.push(
    crossingsOf(rebuilt({ ...document, expression: { jawOpen: 1 } })),
  );
}

console.log();
console.log(
  `${"subject".padEnd(26)} ${"was".padStart(8)} ${"now".padStart(8)}  left`,
);
for (const [index, document] of documents.entries())
  console.log(
    `${document.id.replace("-connected", "").padEnd(26)}` +
      ` ${before[index].toFixed(4).padStart(8)}` +
      ` ${after[index].toFixed(4).padStart(8)}` +
      `  ${((after[index] / before[index]) * 100).toFixed(1)}%`,
  );
const middle = (values: number[]) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
console.log(
  `\nmedian residual ${middle(before).toFixed(4)} -> ${middle(after).toFixed(4)} mm`,
);

// The receipt records that `jawOpen` alone already puts teeth through skin and
// leaves it as a separate corrective's problem. Whether a mandible that stops
// bending makes that better or worse is not something to find out afterwards.
console.log();
const pairs = [
  ...new Set(
    [...crossedBefore, ...crossedAfter].flatMap((one) => [...one.keys()]),
  ),
].sort((a, b) => a.localeCompare(b));
const summed = (rowsOf: Map<string, number>[], pair: string) =>
  rowsOf.reduce((total, one) => total + (one.get(pair) ?? 0), 0);
console.log(`${"pair".padEnd(46)} ${"was".padStart(8)} ${"now".padStart(8)}`);
for (const pair of pairs) {
  const was = summed(crossedBefore, pair);
  const now = summed(crossedAfter, pair);
  console.log(
    `${pair.padEnd(46)} ${String(was).padStart(8)} ${String(now).padStart(8)}` +
      (now > was ? "   WORSE" : now < was ? "   better" : ""),
  );
}
const appeared = pairs.filter(
  (pair) =>
    summed(crossedBefore, pair) === 0 && summed(crossedAfter, pair) > 0,
);
if (appeared.length > 0)
  throw new Error(`these pairs cross only after the change: ${appeared.join(", ")}`);

if (process.argv.includes("--write") === false)
  console.log("dry run; pass --write to apply");
else if (basis.id === REVISION)
  console.log("already published as this revision; nothing to do");
else {
  if (basis.id !== SUCCEEDS)
    throw new Error(
      `this step succeeds ${SUCCEEDS}, but the basis reads ${basis.id}`,
    );
  const was = basis.id;
  basis.id = REVISION;
  fs.writeFileSync(file, gzipSync(`${JSON.stringify(basis)}\n`, { level: 9 }));
  for (const document of documents) document.basis = REVISION;
  fs.writeFileSync(
    `${published}/subjects.json`,
    `${JSON.stringify(documents, null, 2)}\n`,
  );
  fs.writeFileSync(
    `${published}/mandible-receipt.json`,
    `${JSON.stringify(
      {
        basis: REVISION,
        supersedes: was,
        surface: BONE,
        endpoint: OPEN,
        vertices: arch.length,
        screw: {
          axis: screw.axis,
          pivotMetres: screw.pivot,
          slideMetres: screw.slide,
          degrees: screw.degrees,
        },
        neutralResidualMillimetres: hinge.rms * 1000,
        endpointMovedMillimetres: {
          rms: Math.sqrt(sum / arch.length) * 1000,
          worst: worst * 1000,
        },
        perSubjectResidualMillimetres: Object.fromEntries(
          documents.map((document, index) => [
            document.id.replace("-connected", ""),
            { before: before[index], after: after[index] },
          ]),
        ),
        crossingsUnderJawOpen: Object.fromEntries(
          pairs.map((pair) => [
            pair,
            { before: summed(crossedBefore, pair), after: summed(crossedAfter, pair) },
          ]),
        ),
        limits: [
          "A displacement field is not a joint: what is left after identity has moved the arch is (I - R) S and is reported above, not removed.",
          "The chord an endpoint walks instead of an arc, 1.16 mm at half open, is untouched here.",
          "The soft tissue's share of jawOpen is unchanged; only the bone was rigid to begin with.",
        ],
      },
      null,
      2,
    )}\n`,
  );
  console.log(`published ${REVISION}, succeeding ${was}`);
}

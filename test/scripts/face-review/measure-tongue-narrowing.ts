/** Can one shared displacement close a defect that only some identities have?
 *
 * A combination corrective belongs to the basis: one authored target, spent by
 * everyone in proportion to how much of the combination is present. The tongue
 * sinking into the lower lip is not shared that way -- with the mouth already
 * wide open it happens to the six identities whose tongue-over-lip overlap
 * reaches furthest towards the corners of the mouth, and not to the other
 * twelve. Whether one target can serve that is the question blocking the
 * repair, and it is a question about existence rather than about authoring.
 *
 * So this tries the simplest shared target the finding actually suggests. The
 * tongue sinks because it is wide for those mouths, not because it is long, so
 * the candidate is a tongue that narrows towards its midline as it comes out --
 * which is what a tongue does. One parameter, swept, measured on all eighteen.
 *
 * What would disqualify it is either end: a narrowing that leaves any of the
 * six still sunk, or one that has to go so far that it deforms the twelve that
 * never needed it. The answer is read off the ladder rather than argued.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/measure-tongue-narrowing.ts
 */
import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
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

/** Tongue right out of a mouth already as wide as it opens. */
const POSE = { tongueOut: 1, jawOpen: 1 };

/** Shares of its own half width the tongue is asked to give up. */
const LADDER = [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5];

/** The built face in the pose, and the tongue mesh it is carrying. */
const staged = (document: IAutoMovieHumanFaceBasisDocument) => {
  const model = build({ ...document, expression: POSE });
  const part = model.parts.find(
    (each) => each.id === "Human.tongue01/Human.tongue01",
  );
  if (part === undefined || part.geometry.type !== "mesh")
    throw new Error("no tongue mesh in the built model");
  return { model, tongue: part.geometry.mesh };
};

/**
 * The tongue narrowed towards its own midline by `share`, front-weighted.
 *
 * The root is left alone and the tip gives up the whole share, ramped by how
 * far forward a vertex sits between the two. A corrective that moved the root
 * would be moving tissue the pose does not move.
 */
const narrowed = (tongue: IAutoMovieMesh, share: number): IAutoMovieMesh => {
  const positions = [...tongue.positions];
  let back = Infinity;
  let front = -Infinity;
  for (let i = 2; i < positions.length; i += 3) {
    back = Math.min(back, positions[i]);
    front = Math.max(front, positions[i]);
  }
  const reach = front - back;
  for (let row = 0; row < positions.length / 3; row++) {
    const forward = reach === 0 ? 0 : (positions[row * 3 + 2] - back) / reach;
    positions[row * 3] *= 1 - share * forward;
  }
  return { ...tongue, positions };
};

/**
 * Triangles where the tongue and the lips actually pass through each other.
 *
 * Not the count of lips the tongue stands in front of: a tongue out of a mouth
 * stands in front of the lower lip and should, so that count falls to zero only
 * when the tongue has been narrowed until it no longer comes out over the lip
 * at all. What is wanted is interpenetration, which is what the model crossing
 * measurement reports and what named the six subjects in the first place.
 */
const crossing = (
  model: IAutoMovieModel,
  tongue: IAutoMovieMesh,
): { lips: number; everywhere: number } => {
  const part = model.parts.find(
    (each) => each.id === "Human.tongue01/Human.tongue01",
  );
  if (part === undefined || part.geometry.type !== "mesh")
    throw new Error("no tongue mesh in the built model");
  const was = part.geometry.mesh.positions;
  part.geometry.mesh.positions = tongue.positions;
  try {
    let lips = 0;
    let everywhere = 0;
    for (const one of measureAutoMovieModelCrossings(model)) {
      const pair = [one.part, one.other];
      const count = one.triangles + one.otherTriangles;
      everywhere += count;
      if (
        pair.some((each) => each.includes("tongue")) &&
        pair.some((each) => each.includes("lips"))
      )
        lips += count;
    }
    // Narrowing draws the tongue in towards its own midline, so it cannot walk
    // into a cheek or an arch it was clear of. Counting every pair says so
    // rather than reasoning it, because a repair that trades one crossing for
    // another has not repaired anything.
    return { lips, everywhere };
  } finally {
    part.geometry.mesh.positions = was;
  }
};

const rows: Record<string, unknown> = {};
const clears: (number | null)[] = [];
for (const document of documents) {
  const name = document.id.replace("-connected", "");
  const { model, tongue } = staged(document);

  const ladder = LADDER.map((share) => ({
    share,
    ...crossing(model, narrowed(tongue, share)),
  }));
  const cleared = ladder.find((one) => one.lips === 0)?.share ?? null;
  clears.push(cleared);
  rows[name] = { ladder, clearedAt: cleared };
  console.log(
    `${name.padEnd(26)} ` +
      ladder.map((one) => String(one.lips).padStart(5)).join("") +
      `   clears at ${String(cleared === null ? "never" : cleared).padEnd(5)}` +
      `   every pair ${ladder[0].everywhere} -> ${ladder[1].everywhere}`,
  );
}
console.log(
  `\n${"share".padEnd(26)} ` +
    LADDER.map((s) => String(s).padStart(5)).join(""),
);
const answered = clears.filter((one) => one !== null) as number[];
console.log(
  `\n${answered.length} of ${clears.length} clear at some narrowing;` +
    (answered.length === clears.length
      ? ` one share of ${Math.max(...answered)} would serve all of them`
      : " no single share serves all of them"),
);
fs.writeFileSync(
  "../.shots/human-2469/investigation-2498/tongue-narrowing.json",
  `${JSON.stringify(rows, null, 2)}\n`,
);

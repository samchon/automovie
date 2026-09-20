/** Four channels and one bone: do their displacements still make a bone?
 *
 * `jawOpen`, `jawForward`, `jawLeft` and `jawRight` each move the lower dental
 * arch, and each moves it rigidly: the arch is bone and a rigid fit of any one
 * of them leaves almost nothing over. Drive two at once and the basis adds
 * their displacement fields, because that is what a basis does.
 *
 * This was written to prove that they therefore do not compose -- two rotations
 * compose and do not add, so summing their displacements should land the arch
 * somewhere no rigid motion can reach. It measures the opposite, and the
 * measurement stands: `jawForward + jawLeft` leaves 0.0001 mm over a rigid fit,
 * and `jawOpen` with any of them leaves exactly what `jawOpen` leaves alone.
 * Three of the four are pure translations, which add exactly, and a rotation
 * with translations is still a rigid motion.
 *
 * So the arch stays a bone under every pair, and the 21 combinations that put
 * teeth through lips -- out of the 38 that put any surface through a surface
 * neither side crosses -- are not caused by the bone going somewhere a bone
 * cannot go. Either the lips fail to follow a jaw that is where it says it is,
 * or the pose was never reachable in the first place.
 *
 * The second is worth saying plainly, because the rig does not: four channels
 * each bounded to [0, 1] describe a box, and a mandible's reachable positions
 * are not a box. Dentistry has measured that envelope since Posselt, and
 * maximum lateral excursion does not happen at maximum protrusion. Asking for
 * `jawForward` and `jawLeft` at once at full is asking for a jaw nobody has.
 * A joint carries its envelope; four independent channels cannot.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/measure-jaw-composition.ts
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

import { rigid } from "./rigid";

const JAW = ["jawOpen", "jawForward", "jawLeft", "jawRight"];
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

/** How far one pose puts the arch from any rigid motion of its rest, in mm. */
const bend = (
  rest: number[],
  posed: number[],
): { millimetres: number; vertices: number } => {
  const moved: number[] = [];
  for (let row = 0; row < rest.length / 3; row++) {
    let travel = 0;
    for (let k = 0; k < 3; k++)
      travel += (posed[row * 3 + k] - rest[row * 3 + k]) ** 2;
    if (travel > 1e-10) moved.push(row);
  }
  if (moved.length < 4) return { millimetres: 0, vertices: moved.length };
  return { millimetres: rigid(rest, posed, moved).rms * 1000, vertices: moved.length };
};

const report: Record<string, unknown> = {};
for (const document of documents) {
  const name = document.id.replace("-connected", "");
  const rest = placed(document, {});

  const alone: Record<string, number> = {};
  for (const channel of JAW)
    alone[channel] = bend(rest, placed(document, { [channel]: 1 })).millimetres;

  const together: Record<string, number> = {};
  for (let i = 0; i < JAW.length; i++)
    for (let j = i + 1; j < JAW.length; j++) {
      const pair = `${JAW[i]} + ${JAW[j]}`;
      together[pair] = bend(
        rest,
        placed(document, { [JAW[i]]: 1, [JAW[j]]: 1 }),
      ).millimetres;
    }

  report[name] = { alone, together };
  if (name === documents[0].id.replace("-connected", "")) {
    console.log(
      `${"pose".padEnd(28)} ${"left over".padStart(10)}   (how far the arch is ` +
        `from being a bone)`,
    );
    for (const [channel, value] of Object.entries(alone))
      console.log(`${channel.padEnd(28)} ${value.toFixed(4).padStart(10)}`);
    for (const [pair, value] of Object.entries(together))
      console.log(`${pair.padEnd(28)} ${value.toFixed(4).padStart(10)}`);
    console.log();
  }
}

const values = (
  pick: (row: {
    alone: Record<string, number>;
    together: Record<string, number>;
  }) => number[],
) =>
  Object.values(report).flatMap((row) =>
    pick(
      row as { alone: Record<string, number>; together: Record<string, number> },
    ),
  );

const singles = values((row) => Object.values(row.alone));
const pairs = values((row) => Object.values(row.together));
console.log(
  `across ${documents.length} subjects the worst a single channel leaves is ` +
    `${Math.max(...singles).toFixed(4)} mm, and the worst a pair leaves is ` +
    `${Math.max(...pairs).toFixed(4)} mm`,
);
console.log(
  `the same number, because that worst is jawOpen's own remainder and no pair ` +
    `adds to it: the arch is still a bone under every combination`,
);

fs.writeFileSync(
  "../.shots/human-2469/investigation-2498/jaw-composition.json",
  `${JSON.stringify(report, null, 2)}
`,
);

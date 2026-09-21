/** Does the lower lip go where the mandible goes?
 *
 * The teeth come through the lips in twenty-one of the thirty-eight expression
 * pairs that put a surface through one neither side crosses, and the two
 * explanations have been narrowed to one: the arch stays rigid under every
 * combination, and protrusion at 8.4 mm and lateral excursion at 7.9 mm are
 * what a clinician measures on a person, so the bone is where a bone can be.
 * That leaves the soft tissue.
 *
 * Anatomy says how much of it should follow. The lower lip is not a free
 * curtain hanging past the teeth: orbicularis oris blends into mentalis and
 * depressor labii, which arise from the mandible itself, and the chin skin is
 * tethered to the bone. Slide a jaw sideways and the lower lip and chin go with
 * it -- not by all of the excursion, because the upper lip and the commissures
 * are anchored to the maxilla, but by much of it near the midline of the lower
 * lip, and by nearly all of it at the chin.
 *
 * So this reads, for each jaw channel, how far the arch travels and how far the
 * lips and the chin travel with it. A lip that carries none of the jaw's motion
 * is a lip the teeth will walk out of, and the ratio says so in one number
 * rather than in a count of triangles.
 *
 * The chin is found rather than named: the skin below the lower lip's own
 * lowest point and in front of the head, which is where a chin is.
 *
 * It answers yes. The lower lip carries 100 percent of an opening jaw and 57 to
 * 58 percent of a protruding or excursing one, and the chin carries 90 to 150
 * percent; the commissures being anchored to the maxilla is exactly why the
 * lateral figure is not higher. The soft tissue follows.
 *
 * Which leaves one explanation and it is the architectural one. Each channel is
 * right on its own and the basis adds them, but `mouthRight`'s displacement of
 * the lip was authored over a jaw that was shut. Laid on top of an open one it
 * carries the lip somewhere that does not respect where the arch now is, and
 * the teeth come through. That is not a model that is wrong, it is the model
 * working as a linear model does, and it is the reason MetaHuman evaluates pose
 * space deformers after its channels. The basis has the mechanism and two
 * correctives in it. The enumeration says it needs thirty-eight.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/measure-lip-carry.ts
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

const JAW = ["jawOpen", "jawForward", "jawLeft", "jawRight"];
const ARCH = "Human.teeth_base/Human.teeth_base";
const LIPS = "Human/lips";
const SKIN = "Human/skin";

const published = "studies/human-face/connected-basis/global-face";
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/basis.json.gz`)).toString("utf8"),
);
const documents: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(`${published}/subjects.json`, "utf8"),
);
const build = createHumanFaceBasisBuilder(basis);

const parts = (
  document: IAutoMovieHumanFaceBasisDocument,
  expression: Record<string, number>,
): Map<string, number[]> => {
  const found = new Map<string, number[]>();
  for (const part of build({ ...document, expression, hair: undefined }).parts)
    if (part.geometry.type === "mesh")
      found.set(part.id, part.geometry.mesh.positions);
  return found;
};

/** Mean travel, in millimetres, over the rows named. */
const travelled = (rest: number[], posed: number[], rows: number[]): number => {
  let total = 0;
  for (const row of rows) {
    let apart = 0;
    for (let k = 0; k < 3; k++)
      apart += (posed[row * 3 + k] - rest[row * 3 + k]) ** 2;
    total += Math.sqrt(apart);
  }
  return (total / Math.max(rows.length, 1)) * 1000;
};

const every = (flat: number[]) => [...new Array(flat.length / 3).keys()];

const report: Record<string, unknown> = {};
for (const document of documents) {
  const name = document.id.replace("-connected", "");
  const rest = parts(document, {});
  const arch = rest.get(ARCH)!;
  const lips = rest.get(LIPS)!;
  const skin = rest.get(SKIN)!;

  // The lower arch is the half of the dental surface `jawOpen` moves.
  const opened = parts(document, { jawOpen: 1 }).get(ARCH)!;
  const lower: number[] = [];
  for (let row = 0; row < arch.length / 3; row++) {
    let travel = 0;
    for (let k = 0; k < 3; k++)
      travel += (opened[row * 3 + k] - arch[row * 3 + k]) ** 2;
    if (travel > 1e-10) lower.push(row);
  }

  // The lower lip: the half of the lip surface below its own middle height.
  const lipHeights = every(lips)
    .map((row) => lips[row * 3 + 1])
    .sort((a, b) => a - b);
  const lipMiddle = lipHeights[Math.floor(lipHeights.length / 2)];
  const lowerLip = every(lips).filter((row) => lips[row * 3 + 1] < lipMiddle);

  // The chin: skin below the lips and in front of the head.
  const lipBottom = lipHeights[0];
  const depths = every(skin)
    .map((row) => skin[row * 3 + 2])
    .sort((a, b) => a - b);
  const forward = depths[Math.floor(depths.length * 0.8)];
  const chin = every(skin).filter(
    (row) => skin[row * 3 + 1] < lipBottom && skin[row * 3 + 2] > forward,
  );

  const rows: Record<string, unknown> = {};
  for (const channel of JAW) {
    const posed = parts(document, { [channel]: 1 });
    const bone = travelled(arch, posed.get(ARCH)!, lower);
    const lip = travelled(lips, posed.get(LIPS)!, lowerLip);
    const point = travelled(skin, posed.get(SKIN)!, chin);
    rows[channel] = {
      archMillimetres: bone,
      lowerLipMillimetres: lip,
      chinMillimetres: point,
      lipCarries: lip / Math.max(bone, 1e-9),
      chinCarries: point / Math.max(bone, 1e-9),
    };
  }
  report[name] = { lowerLipVertices: lowerLip.length, chinVertices: chin.length, rows };

  if (name === documents[0].id.replace("-connected", "")) {
    console.log(
      `${name}: lower lip ${lowerLip.length} vertices, chin ${chin.length}`,
    );
    console.log(
      `${"channel".padEnd(14)} ${"arch".padStart(7)} ${"lip".padStart(7)}` +
        ` ${"chin".padStart(7)}   lip carries   chin carries`,
    );
    for (const channel of JAW) {
      const row = rows[channel] as Record<string, number>;
      console.log(
        `${channel.padEnd(14)} ${row.archMillimetres.toFixed(2).padStart(7)}` +
          ` ${row.lowerLipMillimetres.toFixed(2).padStart(7)}` +
          ` ${row.chinMillimetres.toFixed(2).padStart(7)}` +
          ` ${(row.lipCarries * 100).toFixed(0).padStart(11)}%` +
          ` ${(row.chinCarries * 100).toFixed(0).padStart(13)}%`,
      );
    }
    console.log();
  }
}

const middle = (channel: string, key: string) => {
  const rows = Object.values(report).map(
    (one) =>
      ((one as { rows: Record<string, Record<string, number>> }).rows[channel])[
        key
      ],
  );
  return [...rows].sort((a, b) => a - b)[Math.floor(rows.length / 2)];
};
console.log(`across ${documents.length} subjects, at the median:`);
for (const channel of JAW)
  console.log(
    `  ${channel.padEnd(14)} the lower lip carries ` +
      `${(middle(channel, "lipCarries") * 100).toFixed(0).padStart(3)}% of the arch, ` +
      `the chin ${(middle(channel, "chinCarries") * 100).toFixed(0).padStart(3)}%`,
  );

fs.writeFileSync(
  "../.shots/human-2469/investigation-2498/lip-carry.json",
  `${JSON.stringify(report, null, 2)}\n`,
);

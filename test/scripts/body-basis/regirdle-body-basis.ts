import type { IAutoMovieHumanBodyBasis } from "@automovie/human";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { reweightHumanBodyShoulderSkin } from "./reweightHumanBodyShoulderSkin";

/**
 * Publish the next body basis revision from the shipped one, with the humerus's
 * skin share above each glenohumeral centre moved to that side's girdle bone
 * (`reweightHumanBodyShoulderSkin`).
 *
 * Usage, from `test/`:
 * `pnpm exec ttsx -P tsconfig.scripts.json scripts/body-basis/regirdle-body-basis.ts <revision> [--onset 70] [--full 110]`
 *
 * The tool reads `studies/human-body/connected-basis/basis.json.gz`, changes
 * only the skin weights of every surface, renames the basis to `<revision>`,
 * writes the file back and records the change in `girdle-receipt.json` beside
 * it: the basis it replaces and its digest, the parameters, the number of
 * vertices each surface changed, and the digest of the new basis document. The
 * glenohumeral centre of a side is the rest landmark its upper-arm joint
 * declares as its head, so no coordinate is typed here. Pose correctives and
 * shape targets are position rows and are not touched; a corrective row on a
 * reweighted vertex is reported so that the census can judge it, since the
 * rows were solved under the previous weights.
 *
 * Refuses a basis that has not the two upper-arm joints, or a revision equal
 * to the current one, so running the tool twice cannot apply the rule twice.
 * Writes are synchronous and last, so a refusal leaves both files unchanged.
 */
const argument = (name: string, fallback: number): number => {
  const at = process.argv.indexOf(name);
  return at < 0 ? fallback : Number(process.argv[at + 1]);
};

const revision = process.argv[2];
if (revision === undefined || revision.startsWith("--"))
  throw new Error("Give the new basis revision as the first argument.");
const onsetDegrees = argument("--onset", 70);
const fullDegrees = argument("--full", 110);

const directory = path.resolve("studies/human-body/connected-basis");
const file = path.join(directory, "basis.json.gz");
const compressed = fs.readFileSync(file);
const text = zlib.gunzipSync(compressed).toString("utf8");
const basis = JSON.parse(text) as IAutoMovieHumanBodyBasis;
if (basis.id === revision)
  throw new Error("The basis already carries the revision " + revision + ".");

const landmark = (id: string) => {
  const index = basis.landmarks.ids.indexOf(id);
  if (index < 0) throw new Error("The basis has no landmark " + id + ".");
  const [x, y, z] = basis.landmarks.positions.slice(3 * index, 3 * index + 3);
  return { x, y, z };
};
const headOf = (bone: string) => {
  const joint = basis.joints.find((one) => one.bone === bone);
  if (joint === undefined) throw new Error("The rig has no joint " + bone + ".");
  return landmark(joint.head);
};
const centres = {
  leftUpperArm: headOf("leftUpperArm"),
  rightUpperArm: headOf("rightUpperArm"),
};

const surfaces = basis.surfaces.map((surface) => {
  const { skin, changed } = reweightHumanBodyShoulderSkin({
    positions: surface.positions,
    skin: surface.skin,
    centres,
    onsetDegrees,
    fullDegrees,
  });
  const moved = new Set<number>();
  for (let v = 0; v < surface.positions.length / 3; ++v)
    for (let k = 0; k < 4; ++k)
      if (
        surface.skin.boneIndices[4 * v + k] !== skin.boneIndices[4 * v + k] ||
        surface.skin.weights[4 * v + k] !== skin.weights[4 * v + k]
      ) {
        moved.add(v);
        break;
      }
  const correctiveRows: Record<string, number> = {};
  for (const [name, rows] of Object.entries(surface.targets ?? {}))
    if (name.startsWith("pose/")) {
      let count = 0;
      for (let i = 0; i < rows.length; i += 4) if (moved.has(rows[i])) ++count;
      if (count !== 0) correctiveRows[name] = count;
    }
  surface.skin = skin;
  return { id: surface.id, changed, correctiveRows };
});

const previous = basis.id;
basis.id = revision;
const output = JSON.stringify(basis);
const receipt = {
  basis: revision,
  supersedes: previous,
  supersededSha256: crypto.createHash("sha256").update(text).digest("hex"),
  method:
    "the humerus's skin share above each glenohumeral centre moves to the same side's girdle bone, by a smoothstep on the angle between the upward axis and the vertex seen from the centre",
  onsetDegrees,
  fullDegrees,
  surfaces,
  uncompressedSha256: crypto.createHash("sha256").update(output).digest("hex"),
};
fs.writeFileSync(file, zlib.gzipSync(Buffer.from(output), { level: 9 }));
fs.writeFileSync(
  path.join(directory, "girdle-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(receipt, null, 2));

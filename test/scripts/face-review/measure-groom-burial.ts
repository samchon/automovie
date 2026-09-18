/** Place every groom station in model space, for the burial reading beside it.
 *
 * A side view showing hair over the crown and bare skin behind it has two
 * causes that look identical: the groom covers only that much, or the rest of
 * it is inside the skull. They call for opposite responses, so the reading has
 * to separate them.
 *
 * Being under the plane of the triangle a lock grows from is not the same as
 * being inside the head, and two wrong readings came from confusing them. The
 * first took the wrong axis of the seat frame and reported locks 380 mm deep,
 * which is deeper than a head is wide. The second took the right axis — the
 * schema names the frame in order, the triangle's first edge, its surface
 * normal, then their cross product — and still read half of every groom as
 * buried, because a head is curved: a lock running a hundred millimetres down
 * the occiput passes under its own root triangle's plane while staying well
 * outside the skull.
 *
 * So the station is placed in model space here and given its signed distance to
 * the nearest skin triangle beside this, with the sign from that triangle's own
 * normal. The root sits on the surface by construction and carries nothing, so
 * only the stations after it are written.
 *
 * Each subject is placed twice, with its identity and without, because the
 * per-vertex identity moved the scalp. A seat rides the surface by design, but
 * whether the locks still clear the skin after the surface moved is a
 * measurement rather than a deduction.
 *
 * Usage: ttsx -P tsconfig.json --no-plugins scripts/face-review/measure-groom-burial.ts
 */
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

import {
  createHumanFaceBasisBuilder,
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceGroom,
} from "@automovie/human";

const published = "studies/human-face/connected-basis/global-face";
const out = "../.shots/human-2469/investigation-2498/groom-burial";
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/basis.json.gz`)).toString("utf8"),
);
const grooms: Record<string, IAutoMovieHumanFaceGroom> = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/grooms.json.gz`)).toString("utf8"),
);
const documents: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(`${published}/subjects.json`, "utf8"),
);
const build = createHumanFaceBasisBuilder(basis);
fs.mkdirSync(out, { recursive: true });

const unit = (one: number[]): number[] => {
  const size = Math.hypot(one[0], one[1], one[2]);
  return size === 0 ? [0, 0, 0] : one.map((value) => value / size);
};
const cross = (a: number[], b: number[]): number[] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

let written = 0;
for (const document of documents) {
  const name = document.id.replace("-connected", "");
  const groom =
    document.hair === undefined || document.hair === null
      ? undefined
      : grooms[document.hair];
  if (groom === undefined) {
    console.log(`${name.padEnd(26)} no groom`);
    continue;
  }

  const place = (one: IAutoMovieHumanFaceBasisDocument) => {
    const model = build(one);
    const skin = model.parts.find((part) => part.id === "Human/skin");
    if (skin === undefined || skin.geometry.type !== "mesh")
      throw new Error(`${name}: no skin mesh`);
    const positions = skin.geometry.mesh.positions;
    const indices = skin.geometry.mesh.indices;
    if (indices === null) throw new Error(`${name}: skin is not indexed`);
    const stations: number[] = [];
    for (const card of groom.cards) {
      const at = card.triangle * 3;
      const corner = [0, 1, 2].map((k) =>
        [0, 1, 2].map((axis) => positions[indices[at + k] * 3 + axis]),
      );
      const [u, v] = card.weights;
      const w = 1 - u - v;
      const seat = [0, 1, 2].map(
        (axis) =>
          u * corner[0][axis] + v * corner[1][axis] + w * corner[2][axis],
      );
      const edge = [0, 1, 2].map((axis) => corner[1][axis] - corner[0][axis]);
      const other = [0, 1, 2].map((axis) => corner[2][axis] - corner[0][axis]);
      const tangent = unit(edge);
      const up = unit(cross(edge, other));
      const across = cross(up, tangent);
      for (let i = 1; i < card.guide.length; i++) {
        const station = card.guide[i];
        for (let axis = 0; axis < 3; axis++)
          stations.push(
            seat[axis] +
              station[0] * tangent[axis] +
              station[1] * up[axis] +
              station[2] * across[axis],
          );
      }
    }
    return { positions, indices, stations };
  };

  const withIdentity = place(document);
  const without = place({ ...document, identity: undefined });
  fs.writeFileSync(
    `${out}/${name}.json`,
    JSON.stringify({ subject: name, withIdentity, without }),
  );
  written++;
  console.log(
    `${name.padEnd(26)} ${withIdentity.stations.length / 3} stations placed`,
  );
}
console.log(`${written} grooms written for measurement`);

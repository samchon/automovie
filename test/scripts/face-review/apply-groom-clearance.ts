/** Lift every groom station that ended up inside the head back out of it.
 *
 * Measured across the population, eight to twenty-four per cent of each groom's
 * stations sit more than ten millimetres inside the body, and the deep ones sit
 * at the crown. That is not hair touching skin — a lock resting on a cheek or a
 * shoulder is a millimetre or two under — it is hair that went into the skull
 * and does not come out, so the rendered groom is thinner than the one that was
 * authored.
 *
 * The cause is the transfer, not the identity: the reading is the same with the
 * per-vertex identity and without it. These locks were authored on the
 * procedural head and re-seated on the connected one, and wherever the
 * connected skull is the larger of the two, the station that kept its authored
 * height ended up underneath.
 *
 * So each buried station is moved out along the normal of the surface it is
 * under, far enough to clear it by half a millimetre. The displacement is
 * computed in model space beside this and turned into the lock's own frame
 * here, because that frame is what a seated card is written in and what makes
 * the placement survive the next shape edit.
 *
 * The displacement is then smoothed along each lock before it is applied, and
 * that part is not optional. A first attempt moved every buried station on its
 * own and took the burial from a median of 28% to 0.2% — and the render came
 * back with hair in spikes and tears. A guide is a curve: moving one station
 * sixty millimetres while its neighbour stays put is a kink, and enough kinks
 * are a broken hairstyle. The number improved and the thing the number stood
 * for got worse, so the number was not the finding; the render was.
 *
 * So the per-station push is low-passed along the lock. A station deep inside
 * still comes out, its neighbours come partway with it, and the guide stays a
 * guide. The lock keeps its length, its width and its direction: nothing here
 * re-authors a hairstyle.
 *
 * REJECTED, and kept for that. Smoothed, this reaches 15.3% burial overall with
 * ten-millimetre burial at 0.5 to 2.5 per cent, and the render is still worse
 * than leaving the grooms alone: the crowns of daniel-radcliffe, lee-tae-ri,
 * park-eun-bin, rupert-grint and maggie-smith come back rough where they were
 * smooth. The buried segments were hidden, and bringing them out shows geometry
 * authored for a different head.
 *
 * Both attempts were reverted and the archive is byte-identical to what it was.
 * What the measurement actually asks for is re-seating the locks against the
 * connected scalp when the groom is authored, not pushing authored ones outward
 * afterwards. Running this will change the published grooms; it is here to be
 * read, and to save the next person the two days.
 *
 * Usage: ttsx -P tsconfig.json --no-plugins scripts/face-review/apply-groom-clearance.ts
 */
import fs from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";

import {
  createHumanFaceBasisBuilder,
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceGroom,
} from "@automovie/human";

const published = "studies/human-face/connected-basis/global-face";
const corrections = "../.shots/human-2469/investigation-2498/groom-burial";
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

const unit = (one: number[]): number[] => {
  const size = Math.hypot(one[0], one[1], one[2]);
  return size === 0 ? [0, 0, 0] : one.map((value) => value / size);
};
const cross = (a: number[], b: number[]): number[] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: number[], b: number[]): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

let lifted = 0;
for (const document of documents) {
  const name = document.id.replace("-connected", "");
  const groom =
    document.hair === undefined || document.hair === null
      ? undefined
      : grooms[document.hair];
  const file = `${corrections}/${name}-correction.json`;
  if (groom === undefined || fs.existsSync(file) === false) continue;
  const correction: { push: number[]; moved: number } = JSON.parse(
    fs.readFileSync(file, "utf8"),
  );

  const model = build(document);
  const skin = model.parts.find((part) => part.id === "Human/skin");
  if (skin === undefined || skin.geometry.type !== "mesh") continue;
  const positions = skin.geometry.mesh.positions;
  const indices = skin.geometry.mesh.indices;
  if (indices === null) continue;

  let at = 0;
  let moved = 0;
  groom.cards = groom.cards.map((card) => {
    const corner = [0, 1, 2].map((k) =>
      [0, 1, 2].map((axis) => positions[indices[card.triangle * 3 + k] * 3 + axis]),
    );
    const edge = [0, 1, 2].map((axis) => corner[1][axis] - corner[0][axis]);
    const other = [0, 1, 2].map((axis) => corner[2][axis] - corner[0][axis]);
    const tangent = unit(edge);
    const up = unit(cross(edge, other));
    const across = cross(up, tangent);
    // The whole lock's pushes first, so they can be smoothed as one curve.
    const pushes: number[][] = [[0, 0, 0]];
    for (let index = 1; index < card.guide.length; index++) {
      pushes.push([
        correction.push[at],
        correction.push[at + 1],
        correction.push[at + 2],
      ]);
      at += 3;
    }
    // Four passes of a 1-2-1 filter along the lock. The root is held at zero:
    // it sits on the surface by construction, and moving it would unseat the
    // card from the triangle that names it.
    for (let pass = 0; pass < 4; pass++) {
      const next = pushes.map((one) => [...one]);
      for (let index = 1; index < pushes.length; index++) {
        const before = pushes[index - 1];
        const after = pushes[Math.min(index + 1, pushes.length - 1)];
        for (let axis = 0; axis < 3; axis++)
          next[index][axis] =
            (before[axis] + 2 * pushes[index][axis] + after[axis]) / 4;
      }
      next[0] = [0, 0, 0];
      pushes.splice(0, pushes.length, ...next);
    }
    const guide = card.guide.map((station, index) => {
      const push = pushes[index];
      if (Math.hypot(push[0], push[1], push[2]) < 1e-9) return station;
      moved++;
      // The displacement is in model space; the station is in the seat frame.
      return [
        Number((station[0] + dot(push, tangent)).toFixed(6)),
        Number((station[1] + dot(push, up)).toFixed(6)),
        Number((station[2] + dot(push, across)).toFixed(6)),
      ] as [number, number, number];
    });
    return { ...card, guide };
  });
  lifted += moved;
  console.log(`${name.padEnd(26)} ${moved} stations lifted clear`);
}

fs.writeFileSync(
  `${published}/grooms.json.gz`,
  gzipSync(`${JSON.stringify(grooms)}\n`, { level: 9 }),
);
console.log(`${lifted} stations lifted across ${documents.length} subjects`);

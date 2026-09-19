/** Does any expression turn a triangle inside out?
 *
 * Counting how much two surfaces overlap is a reading that needs anatomy to
 * interpret: a lid closing over an eyeball is supposed to increase the overlap
 * between the lid and the eyeball, and a measure that calls every increase a
 * fault calls a blink a fault. This one needs no anatomy. A triangle whose
 * normal has flipped relative to the neutral has been turned inside out, and no
 * expression justifies that: it is the surface folding through itself, which
 * renders as a black shard or a hole whichever way the light falls.
 *
 * Each channel is driven alone and at full strength, because a single channel
 * that already folds is wrong in the shape itself, and no amount of combination
 * correction above it would help.
 *
 * Fold is read as a sign change of the triangle's normal projected on its own
 * neutral normal, so it is invariant to the whole head moving, and area is
 * reported beside the count because one folded sliver and a folded cheek are
 * not the same defect.
 *
 * What this cannot tell you is whether anyone will see it, and on this face
 * nobody does. Every material the head is built from is authored double-sided
 * -- `createPortraitMaterials` sets it on the skin, and the eye, the iris and
 * the hair do the same -- so a shader handed a triangle facing away flips the
 * normal back and lights it correctly. A fold is therefore invisible here by
 * construction, and that is not an accident: the skin is an open mesh that
 * stops at the neck, and a single-sided one would show that opening as a hole.
 *
 * Checked rather than assumed. The three largest folds by area -- the jaw
 * channels through the teeth, and the two blinks through the lid -- were
 * photographed against their own before and after: the teeth seam removed
 * changed the render by not one pixel, and the closed lid carries no off-skin
 * colour at all. So the ranking this file produces is a ranking of geometric
 * fault, not of what reaches a viewer, and it must not be read as the second.
 *
 * The measure still earns its place. A fold is wrong wherever the asset is
 * consumed, and a single-sided consumer would show every one of these as a
 * hole. What reaches this viewer is the other census: a surface passing
 * through another is about occlusion rather than normals, so being
 * double-sided does not hide it, and the teeth appearing at the corner of an
 * open mouth is exactly that.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/measure-expression-folds.ts [subject,...]
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

const published = "studies/human-face/connected-basis/global-face";
const out = "../.shots/human-2469/investigation-2498";
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/basis.json.gz`)).toString("utf8"),
);
const documents: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(`${published}/subjects.json`, "utf8"),
);
const build = createHumanFaceBasisBuilder(basis);
const expressions = basis.channels
  .filter((channel) => channel.kind === "expression")
  .map((channel) => channel.id);

interface Surface {
  readonly id: string;
  readonly positions: readonly number[];
  readonly indices: readonly number[];
}

/** Every indexed mesh of a built face, in one list, in part order. */
const surfacesOf = (document: IAutoMovieHumanFaceBasisDocument): Surface[] => {
  const out: Surface[] = [];
  for (const part of build(document).parts) {
    if (part.geometry.type !== "mesh") continue;
    const mesh = part.geometry.mesh;
    out.push({
      id: part.id,
      positions: mesh.positions,
      indices: mesh.indices ?? [...new Array(mesh.positions.length / 3).keys()],
    });
  }
  return out;
};

/** Triangle normals, unnormalised, so the cross product's length is twice the area. */
const normalsOf = (surface: Surface): Float64Array => {
  const out = new Float64Array(surface.indices.length);
  for (let i = 0; i < surface.indices.length; i += 3) {
    const corner = [0, 1, 2].map((k) =>
      [0, 1, 2].map(
        (axis) => surface.positions[surface.indices[i + k] * 3 + axis],
      ),
    );
    const edge = [0, 1, 2].map((axis) => corner[1][axis] - corner[0][axis]);
    const reach = [0, 1, 2].map((axis) => corner[2][axis] - corner[0][axis]);
    out[i] = edge[1] * reach[2] - edge[2] * reach[1];
    out[i + 1] = edge[2] * reach[0] - edge[0] * reach[2];
    out[i + 2] = edge[0] * reach[1] - edge[1] * reach[0];
  }
  return out;
};

const wanted = process.argv[2]?.split(",");
const report: Record<string, unknown> = {};
for (const document of documents) {
  const name = document.id.replace("-connected", "");
  if (wanted !== undefined && !wanted.includes(name)) continue;
  const started = Date.now();
  const rest = surfacesOf({ ...document, expression: {} });
  const restNormals = rest.map(normalsOf);
  const rows: {
    channel: string;
    folded: number;
    area: number;
    where: string;
  }[] = [];
  for (const channel of expressions) {
    const posed = surfacesOf({ ...document, expression: { [channel]: 1 } });
    let folded = 0;
    let area = 0;
    const where = new Map<string, number>();
    for (let s = 0; s < posed.length; s++) {
      const now = normalsOf(posed[s]);
      const was = restNormals[s];
      for (let i = 0; i < now.length; i += 3) {
        const along =
          now[i] * was[i] + now[i + 1] * was[i + 1] + now[i + 2] * was[i + 2];
        if (along >= 0) continue;
        folded++;
        area += Math.hypot(now[i], now[i + 1], now[i + 2]) / 2;
        where.set(posed[s].id, (where.get(posed[s].id) ?? 0) + 1);
      }
    }
    if (folded > 0)
      rows.push({
        channel,
        folded,
        area: Number((area * 1e6).toFixed(2)),
        where: [...where]
          .sort((a, b) => b[1] - a[1])
          .map(([part, count]) => `${part}:${count}`)
          .join(" "),
      });
  }
  rows.sort((a, b) => b.area - a.area);
  report[name] = { channelsThatFold: rows.length, detail: rows };
  console.log(
    `${name.padEnd(26)} ${rows.length} of ${expressions.length} channels fold a triangle ` +
      `(${Date.now() - started} ms)`,
  );
  for (const row of rows.slice(0, 5))
    console.log(
      `    ${row.channel.padEnd(24)} ${String(row.folded).padStart(5)} triangles, ` +
        `${row.area} mm2   ${row.where}`,
    );
}
fs.writeFileSync(
  `${out}/expression-folds.json`,
  `${JSON.stringify(report, null, 2)}\n`,
);

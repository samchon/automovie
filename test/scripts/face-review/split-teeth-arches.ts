/** Cut the seam that joins the upper teeth to the lower ones.
 *
 * `Human.teeth_base` carries both dental arches in a single mesh, and the two
 * are joined at the back corners of the mouth by a strip of triangles. Real
 * arches are not joined across the bite, and the rig cannot pretend they are:
 * the jaw channels move the lower arch and leave the upper one where it is, so
 * every triangle spanning the two is sheared until it turns inside out.
 *
 * Measured before touching anything. The lower arch moves rigidly -- fitted to
 * the best rigid motion, `jawLeft` is a pure 7.92 mm translation with a
 * residual of 0.000 mm and no rotation at all -- and a rigid motion cannot fold
 * a triangle. Of 7120 triangles, 3640 are entirely still, 3446 entirely
 * moving, and 34 span the two. All eight that fold under `jawLeft` are among
 * those 34, and none is anywhere else. The seam is 178.55 mm2, about one per
 * cent of the mesh, sitting where the arches meet behind the last molars.
 *
 * So the seam is removed rather than corrected. Nothing else changes: no vertex
 * moves, no position or target is touched, and only the index buffer of that
 * one surface loses the spanning triples. Vertices left unreferenced stay
 * where they are, so any per-vertex data indexed against this surface -- the
 * subjects' identity layers -- keeps its meaning.
 *
 * HELD, and kept for that. Applied, it does what it claims: the channels that
 * fold a triangle fall from eight to five on every subject tried, and the three
 * with the largest area -- jawLeft, jawRight, jawForward -- disappear
 * completely, taking the teeth surface from 516 folded triangles across the
 * population to none. The render does not change at all. Photographed at the
 * same poses before and after, the corner of the mouth is identical to the
 * pixel, so the grey sliver that pokes out there when the jaw opens is
 * something else, and the crossing of face skin through teeth that the census
 * reports on jawOpen survives untouched.
 *
 * Two reasons to hold it rather than ship it. A fix that changes nothing a
 * viewer sees is not worth a basis revision on its own, and it does need one:
 * replay is guaranteed by the basis revision identity, so a mesh that changes
 * under an unchanged id would let a document replay against geometry it was not
 * authored on. When there is a basis revision carrying fixes that do show, this
 * belongs in it.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/split-teeth-arches.ts [--write]
 */
import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import fs from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";

const published = "studies/human-face/connected-basis/global-face";
const file = `${published}/basis.json.gz`;
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(file)).toString("utf8"),
);
const surface = basis.surfaces.find((one) => one.id === "Human.teeth_base");
if (surface === undefined) throw new Error("no teeth surface in this basis");

/** The four expression channels that articulate the jaw, named rather than
 * matched: `jawPrognathism` is a shape channel that moves the whole mesh, and a
 * prefix test swept it in and reported every vertex as part of the lower arch.
 */
const JAW = ["jawForward", "jawLeft", "jawOpen", "jawRight"];

/** Vertices those channels displace: the lower arch, and nothing else. */
const moved = new Set<number>();
for (const [name, target] of Object.entries(surface.targets))
  if (JAW.includes(name))
    for (let i = 0; i < target.length; i += 4)
      if (
        Math.abs(target[i + 1]) +
          Math.abs(target[i + 2]) +
          Math.abs(target[i + 3]) >
        0
      )
        moved.add(target[i]);

/** Whether a triangle spans the bite: some corners move with the jaw, some do not. */
const spans = (a: number, b: number, c: number): boolean => {
  const moving = [a, b, c].filter((vertex) => moved.has(vertex)).length;
  return moving > 0 && moving < 3;
};

const indices = surface.indices;
const kept: number[] = [];
let cut = 0;
for (let i = 0; i < indices.length; i += 3)
  if (spans(indices[i], indices[i + 1], indices[i + 2])) cut++;
  else kept.push(indices[i], indices[i + 1], indices[i + 2]);

console.log(
  `teeth: ${indices.length / 3} triangles, ${moved.size} vertices move with the jaw`,
);
console.log(`seam triangles spanning the two arches: ${cut}`);
console.log(`remaining: ${kept.length / 3}`);

// A region carries the same triangles again, with their corner UVs, and the
// package asserts that the regions partition the surface exactly. So the seam
// comes out of both, and each dropped triangle takes its six UV values with it.
const regions = surface.regions.map((region) => {
  const keptIndices: number[] = [];
  const keptUvs: number[] = [];
  let removed = 0;
  for (let i = 0; i < region.indices.length; i += 3) {
    if (
      spans(region.indices[i], region.indices[i + 1], region.indices[i + 2])
    ) {
      removed++;
      continue;
    }
    keptIndices.push(
      region.indices[i],
      region.indices[i + 1],
      region.indices[i + 2],
    );
    if (region.uvs !== null)
      for (let k = 0; k < 6; k++) keptUvs.push(region.uvs[i * 2 + k]);
  }
  console.log(`  region ${region.id}: ${removed} of its triangles removed`);
  return {
    ...region,
    indices: keptIndices,
    uvs: region.uvs === null ? null : keptUvs,
  };
});

if (process.argv.includes("--write")) {
  surface.indices = kept;
  surface.regions = regions;
  fs.writeFileSync(file, gzipSync(`${JSON.stringify(basis)}\n`, { level: 9 }));
  console.log(`written to ${file}`);
} else console.log("dry run; pass --write to apply");

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
 * What it buys, measured: the channels that fold a triangle fall from eight to
 * five on every subject tried, and the three largest by area -- jawLeft,
 * jawRight, jawForward -- disappear completely, taking the teeth surface from
 * 516 folded triangles across the population to none.
 *
 * What it does not buy: any visible change. Photographed at the same poses
 * before and after, the corner of the mouth is identical to the pixel. That is
 * expected and not a disappointment -- every material the head is built from is
 * double-sided, so a folded triangle is lit as though it were not, and the seam
 * is at the back of the mouth besides. The grey sliver that shows at the
 * commissure when the jaw opens is a different thing entirely: ray-cast
 * outward, all 1946 back-teeth vertices have skin outboard of them at neutral
 * and at jawOpen alike, so no tooth is outside the cheek and what shows through
 * the opening is a molar, correctly.
 *
 * It ships anyway, because a fold is wrong wherever the asset is consumed and a
 * single-sided consumer would show every one of these as a hole.
 *
 * Because it changes the mesh it changes the basis, so this writes the whole
 * revision rather than the surface alone: the new identity, and the identity
 * carried by every document, groom and skin published against it. Replay is
 * guaranteed by that identity, and a mesh that moved under an unchanged one
 * would let a document replay against geometry it was not authored on.
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

/** The identity this revision publishes under. */
const REVISION = "mpfb-connected-head-2026-09-19-split-arches";

if (process.argv.includes("--write")) {
  const was = basis.id;
  surface.indices = kept;
  surface.regions = regions;
  basis.id = REVISION;
  fs.writeFileSync(file, gzipSync(`${JSON.stringify(basis)}\n`, { level: 9 }));

  // Everything published against the old identity now names the new one. The
  // skin surface is untouched, so a groom's seat -- a part, a triangle ordinal
  // and a barycentric point on it -- still means what it meant, and so does a
  // skin's UV and a subject's per-vertex identity.
  const subjects = `${published}/subjects.json`;
  const documents: { basis: string }[] = JSON.parse(
    fs.readFileSync(subjects, "utf8"),
  );
  for (const document of documents)
    if (document.basis === was) document.basis = REVISION;
  fs.writeFileSync(subjects, `${JSON.stringify(documents, null, 2)}\n`);

  for (const name of ["grooms", "skins"]) {
    const path = `${published}/${name}.json.gz`;
    const records: Record<string, { basis?: string }> = JSON.parse(
      gunzipSync(fs.readFileSync(path)).toString("utf8"),
    );
    for (const record of Object.values(records))
      if (record.basis === was) record.basis = REVISION;
    fs.writeFileSync(
      path,
      gzipSync(`${JSON.stringify(records)}\n`, { level: 9 }),
    );
  }
  console.log(`revision ${was} -> ${REVISION}`);
  console.log(`written: basis, ${documents.length} subjects, grooms, skins`);
} else console.log("dry run; pass --write to apply");

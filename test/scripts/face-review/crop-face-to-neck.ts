/** Cut the invented bust off the head, leaving the face and a neck to join to.
 *
 * The portrait is read down to model Y = -85 mm and no further, because below
 * the collar a portrait shows clothing rather than the person. Everything under
 * that line on the skin was therefore invented -- 2126 of 35652 triangles, a
 * fifth of the surface, with not one texel that came from the photograph. This
 * ships a face; a body is a separate thing, made separately, and a face editor
 * carrying a chest nobody measured is carrying someone else's work badly.
 *
 * The cut is where the observation stops, which is also where a body can be
 * joined. Cutting at the jaw instead would be purer still and leave nothing to
 * attach to.
 *
 * It introduces no topology. The head was already open at the bottom, a ring of
 * 200 vertices at a flat -145 mm where the original asset cut the shoulders;
 * afterwards it is open at a ring of 120 at -80.8 to -90.2 mm, following the
 * neck's own slope. Every vertex on that ring meets exactly two border edges,
 * so it is one simple loop and not a frayed edge, and the two loops around the
 * mouth are untouched.
 *
 * A groom seat names a triangle by its ordinal in the built part's buffer, and
 * a part is a region rather than the whole surface: `Human/skin` carries 32612
 * of the surface's 35652 triangles and `Human/lips` the rest. Remapping from
 * the surface's own ordering instead was enough to send every lock flying off
 * every head, which the first render said at once and which is why the map here
 * is built from the region. Remapped correctly, every seat survives the cut --
 * no hair is rooted below the collar.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/crop-face-to-neck.ts [--write]
 */
import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import fs from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";

/** Where the observation stops, and so where the head stops, in metres. */
const NECK = -0.085;
/** The identity this revision publishes under, and the one it succeeds. */
const REVISION = "mpfb-connected-head-2026-09-20-face-and-neck";
const SUCCEEDS = "mpfb-connected-head-2026-09-19-split-arches";

const published = "studies/human-face/connected-basis/global-face";
const file = `${published}/basis.json.gz`;
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(file)).toString("utf8"),
);
const skin = basis.surfaces.find((one) => one.id === "Human");
if (skin === undefined) throw new Error("no skin surface in this basis");

const height = (vertex: number): number => skin.positions[vertex * 3 + 1];
const keep = (a: number, b: number, c: number): boolean =>
  (height(a) + height(b) + height(c)) / 3 >= NECK;

const indices: number[] = [];
for (let i = 0; i < skin.indices.length; i += 3) {
  const [a, b, c] = [skin.indices[i], skin.indices[i + 1], skin.indices[i + 2]];
  if (keep(a, b, c)) indices.push(a, b, c);
}
console.log(
  `skin: ${skin.indices.length / 3} triangles, ${indices.length / 3} above ${NECK * 1000} mm`,
);

/** Old seat ordinal to new, for the one region a groom ever names. */
const seats = new Map<number, number>();
const regions = skin.regions.map((region) => {
  const keptIndices: number[] = [];
  const keptUvs: number[] = [];
  for (let i = 0; i < region.indices.length; i += 3) {
    const [a, b, c] = [
      region.indices[i],
      region.indices[i + 1],
      region.indices[i + 2],
    ];
    if (!keep(a, b, c)) continue;
    if (region.id === "Human/skin") seats.set(i / 3, keptIndices.length / 3);
    keptIndices.push(a, b, c);
    if (region.uvs !== null)
      for (let k = 0; k < 6; k++) keptUvs.push(region.uvs[i * 2 + k]);
  }
  console.log(
    `  region ${region.id}: ${region.indices.length / 3} -> ${keptIndices.length / 3}`,
  );
  return {
    ...region,
    indices: keptIndices,
    uvs: region.uvs === null ? null : keptUvs,
  };
});

if (process.argv.includes("--write") === false) {
  console.log("dry run; pass --write to apply");
} else {
  if (basis.id === REVISION) {
    console.log("already published as this revision; nothing to do");
  } else {
    if (basis.id !== SUCCEEDS)
      throw new Error(
        `this step succeeds ${SUCCEEDS}, but the basis reads ${basis.id}`,
      );
    const was = basis.id;
    skin.indices = indices;
    skin.regions = regions;
    basis.id = REVISION;
    fs.writeFileSync(
      file,
      gzipSync(`${JSON.stringify(basis)}\n`, { level: 9 }),
    );

    const grooms = `${published}/grooms.json.gz`;
    const records: Record<
      string,
      { basis?: string; cards: { part: string; triangle: number }[] }
    > = JSON.parse(gunzipSync(fs.readFileSync(grooms)).toString("utf8"));
    let stranded = 0;
    for (const record of Object.values(records)) {
      if (record.basis === was) record.basis = REVISION;
      record.cards = record.cards.filter((card) => {
        if (card.part !== "Human/skin") return true;
        const moved = seats.get(card.triangle);
        if (moved === undefined) {
          stranded++;
          return false;
        }
        card.triangle = moved;
        return true;
      });
    }
    if (stranded > 0)
      throw new Error(`${stranded} groom seats sat below the cut; refusing`);
    fs.writeFileSync(
      grooms,
      gzipSync(`${JSON.stringify(records)}\n`, { level: 9 }),
    );

    const subjects = `${published}/subjects.json`;
    const documents: { basis: string }[] = JSON.parse(
      fs.readFileSync(subjects, "utf8"),
    );
    for (const document of documents)
      if (document.basis === was) document.basis = REVISION;
    fs.writeFileSync(subjects, `${JSON.stringify(documents, null, 2)}\n`);

    const skins = `${published}/skins.json.gz`;
    const painted: Record<string, { basis?: string }> = JSON.parse(
      gunzipSync(fs.readFileSync(skins)).toString("utf8"),
    );
    for (const record of Object.values(painted))
      if (record.basis === was) record.basis = REVISION;
    fs.writeFileSync(
      skins,
      gzipSync(`${JSON.stringify(painted)}\n`, { level: 9 }),
    );

    console.log(`revision ${was} -> ${REVISION}`);
    console.log("every groom seat survived the cut");
  }
}

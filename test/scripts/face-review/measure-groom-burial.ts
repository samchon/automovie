/** Place every groom station in model space, for the burial reading beside it.
 *
 * A side view showing hair over the crown and bare skin behind it has two
 * causes that look identical: the groom covers only that much, or the rest of
 * it is inside the skull. They call for opposite responses, so the reading has
 * to separate them.
 *
 * Nothing here re-derives where a station lands. Three readings were taken from
 * a hand-written copy of the seat arithmetic and all three were wrong, each in
 * a different way: the first took the wrong axis of the seat frame and reported
 * locks 380 mm deep, which is deeper than a head is wide; the second tested the
 * station against the plane of its own root triangle, and a head is curved, so
 * a lock running down the occiput passes under that plane while staying well
 * outside the skull; the third fixed the plane test and still read a median
 * 28% of every groom as buried, because the copy put the surface normal on the
 * frame's second axis and assigned the barycentric weights to the wrong
 * corners. The frame is `[edge, cross(normal, edge), normal]` and the seat is
 * `a + edge * u + reach * v`, and the only thing that knows that is
 * `resolveHumanFaceGroom`, which is what the renderer itself calls.
 *
 * So the stations come from that function, in the head space it returns them
 * in, and this file converts millimetres to metres and does no geometry of its
 * own. The signed distance to the nearest skin triangle is taken beside this,
 * with the sign from that triangle's own normal. The root sits on the surface
 * by construction and carries nothing, so only the stations after it are
 * written.
 *
 * Each subject is evaluated from its numerical shape controls. The seat
 * follows that surface; clearance of the remaining guide stations still
 * requires measurement against the resulting scalp.
 *
 * Historical diagnostic only. Restore the three original basis/subjects/grooms
 * files into an explicit input directory from their recorded Git revision. The
 * current numerical hair documents have no groom key and are not inputs here.
 * Usage: ttsx -P tsconfig.scripts.json scripts/face-review/measure-groom-burial.ts HISTORICAL_DIRECTORY NEW_OUTPUT_DIRECTORY
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceGroom,
  createHumanFaceBasisBuilder,
  resolveHumanFaceGroom,
} from "@automovie/human";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

const published = process.argv[2];
const out = process.argv[3];
if (published === undefined || out === undefined || fs.existsSync(out))
  throw new Error(
    "Supply a historical source directory and a new output directory.",
  );
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/basis.json.gz`)).toString("utf8"),
);
const archive = path.join(published, "grooms.json.gz");
const grooms: Record<string, IAutoMovieHumanFaceGroom> = JSON.parse(
  (archive.endsWith(".gz")
    ? gunzipSync(fs.readFileSync(archive))
    : fs.readFileSync(archive)
  ).toString("utf8"),
);
const documents: (Omit<IAutoMovieHumanFaceBasisDocument, "hair"> & {
  hair?: string | null;
})[] = JSON.parse(fs.readFileSync(`${published}/subjects.json`, "utf8"));
const build = createHumanFaceBasisBuilder(basis);
fs.mkdirSync(out, { recursive: true });

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
    const shape = resolveHumanFaceGroom({ groom, model });
    const stations: number[] = [];
    for (const card of shape.cards)
      // The renderer hands back millimetres; the surface is measured in metres.
      for (let i = 1; i < card.guide.length; i++)
        for (const value of card.guide[i]) stations.push(value / 1000);
    return { positions, indices, stations };
  };

  const { hair: _historicalKey, ...face } = document;
  const placed = place(face);
  fs.writeFileSync(
    `${out}/${name}.json`,
    JSON.stringify({ subject: name, placed }),
  );
  written++;
  console.log(
    `${name.padEnd(26)} ${placed.stations.length / 3} stations placed`,
  );
}
console.log(`${written} grooms written for measurement`);

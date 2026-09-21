/** How far does the tongue come out, and what does it come out through?
 *
 * `tongueOut` alone at full strength pushes the tongue through the lips on
 * every published subject. ARKit ships the channel standalone and a viewer is
 * free to drive it that way, so the rig has to answer for it rather than the
 * author. MetaHuman answers combinations like this with a corrective, and a
 * corrective is the authored difference between the linear sum and the face
 * that combination should actually be -- which means the difference has to be
 * measured before it can be authored.
 *
 * So this reads the tongue against the lips at a ladder of jaw openings: the
 * tongue's furthest forward point, the lip aperture in front of it, and whether
 * the two still cross. The opening at which the crossing clears is the
 * combination that is reachable, and the distance still to travel at zero jaw
 * is what a corrective would have to carry.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/measure-tongue-clearance.ts
 */
import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

const published = "studies/human-face/connected-basis/global-face";
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/basis.json.gz`)).toString("utf8"),
);
const documents: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(`${published}/subjects.json`, "utf8"),
);
const build = createHumanFaceBasisBuilder(basis);

/** The jaw openings to read, from shut to wide. */
const LADDER = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.75, 1];

/** Does the tongue pass through anything, and by how many triangles? */
const through = (document: IAutoMovieHumanFaceBasisDocument) => {
  const out = new Map<string, number>();
  for (const crossing of measureAutoMovieModelCrossings(build(document))) {
    const pair = [crossing.part, crossing.other].sort((a, b) =>
      a.localeCompare(b),
    );
    if (pair.some((one) => one.includes("tongue")) === false) continue;
    out.set(
      pair.join(" x "),
      (out.get(pair.join(" x ")) ?? 0) +
        crossing.triangles +
        crossing.otherTriangles,
    );
  }
  return out;
};

/** The furthest forward point of a named part, in metres.
 *
 * Forward is +Z in the head frame, which the reading itself confirms: at rest
 * the tongue sits well behind the lips, and a tongue that read as ahead of them
 * with the mouth shut would mean the axis, not the rig, was wrong.
 */
const reach = (document: IAutoMovieHumanFaceBasisDocument, part: string) => {
  const found = build(document).parts.find((one) => one.id === part);
  if (found === undefined)
    throw new Error(`no part ${part} in the built model`);
  if (found.geometry.type !== "mesh") throw new Error(`${part} is not a mesh`);
  const { positions } = found.geometry.mesh;
  let far = -Infinity;
  for (let i = 2; i < positions.length; i += 3)
    far = Math.max(far, positions[i]);
  return far;
};

const rows: Record<string, unknown> = {};
for (const document of documents) {
  const name = document.id.replace("-connected", "");
  const ladder = LADDER.map((jaw) => {
    const expression: Record<string, number> = { tongueOut: 1 };
    if (jaw !== 0) expression.jawOpen = jaw;
    const posed = { ...document, expression };
    const crossings = through(posed);
    return {
      jawOpen: jaw,
      tongue: Number(
        (reach(posed, "Human.tongue01/Human.tongue01") * 1000).toFixed(2),
      ),
      lips: Number((reach(posed, "Human/lips") * 1000).toFixed(2)),
      crossings: Object.fromEntries(crossings),
      triangles: [...crossings.values()].reduce((sum, one) => sum + one, 0),
    };
  });
  const cleared = ladder.find((one) => one.triangles === 0);
  rows[name] = { ladder, clearedAt: cleared?.jawOpen ?? null };
  console.log(
    `${name.padEnd(26)} shut ${String(ladder[0].triangles).padStart(4)} tri` +
      `   tongue ${ladder[0].tongue.toFixed(1)} vs lips ${ladder[0].lips.toFixed(1)} mm` +
      `   clears at jawOpen ${cleared === undefined ? "never" : cleared.jawOpen}`,
  );
}
fs.writeFileSync(
  "../.shots/human-2469/investigation-2498/tongue-clearance.json",
  `${JSON.stringify(rows, null, 2)}\n`,
);

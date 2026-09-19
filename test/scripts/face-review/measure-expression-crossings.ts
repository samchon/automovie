/** Does any expression push one facial surface through another?
 *
 * Everything measured of this face so far has been measured at rest. The editor
 * carries fifty-two expression channels and they are linear: each one adds its
 * own displacement to the neutral and nothing corrects what happens when two of
 * them move the same vertices. That is the standard failure of a blendshape rig
 * without combination correction, and the standard symptom is a surface passing
 * through another one -- a lip through the teeth, a lid through the eyeball, a
 * cheek through the gum -- which is exactly what this instrument reads.
 *
 * The count itself is not the reading. A layered character rests with its
 * shells inside each other on purpose: the connected face crosses on six pairs
 * at rest because the eyeball sits inside the lid and the lashes are rooted in
 * the skin. So each pose is measured against the same subject's neutral and
 * what is reported is the change -- a pair that appears, or a triangle count
 * that grows, is the pose pushing tissue through tissue.
 *
 * Channels are driven one at a time first, because a single channel that
 * already crosses says the shape itself is wrong and no combination correction
 * would save it. Pairs are worth measuring after that, and only among channels
 * that touch the same region, because fifty-two channels make thirteen hundred
 * pairs and most of them share no vertices at all.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/measure-expression-crossings.ts [subject,...]
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

/** The pairs a crossing measurement names, as a set, so two can be differenced. */
const crossingsOf = (
  document: IAutoMovieHumanFaceBasisDocument,
): Map<string, number> => {
  const found = new Map<string, number>();
  for (const crossing of measureAutoMovieModelCrossings(build(document))) {
    // The two names are sorted, so a pair is one key whichever way round it is
    // reported. Left as written, the same two surfaces named in the other order
    // between rest and pose would read as a pair the pose invented, and a pair
    // a pose invents is the headline this file exists to produce.
    const pair = [crossing.part, crossing.other]
      .sort((a, b) => a.localeCompare(b))
      .join(" x ");
    found.set(
      pair,
      (found.get(pair) ?? 0) + crossing.triangles + crossing.otherTriangles,
    );
  }
  return found;
};

const wanted = process.argv[2]?.split(",");
const report: Record<string, Record<string, unknown>> = {};
for (const document of documents) {
  const name = document.id.replace("-connected", "");
  if (wanted !== undefined && !wanted.includes(name)) continue;
  const started = Date.now();
  const rest = crossingsOf({ ...document, expression: {} });
  const rows: { channel: string; appeared: string[]; grew: number }[] = [];
  for (const channel of expressions) {
    const posed = crossingsOf({ ...document, expression: { [channel]: 1 } });
    const appeared: string[] = [];
    let grew = 0;
    for (const [pair, triangles] of posed) {
      const before = rest.get(pair);
      if (before === undefined) appeared.push(pair);
      else if (triangles > before) grew += triangles - before;
    }
    if (appeared.length > 0 || grew > 0) rows.push({ channel, appeared, grew });
  }
  report[name] = {
    restPairs: [...rest.keys()],
    channelsThatCross: rows.length,
    detail: rows,
  };
  console.log(
    `${name.padEnd(26)} rest crosses on ${rest.size} pairs; ` +
      `${rows.length} of ${expressions.length} channels add a crossing ` +
      `(${Date.now() - started} ms)`,
  );
  for (const row of rows.slice(0, 6))
    console.log(
      `    ${row.channel.padEnd(24)} ` +
        (row.appeared.length > 0 ? `new: ${row.appeared.join(", ")}  ` : "") +
        (row.grew > 0 ? `grew by ${row.grew} triangles` : ""),
    );
}
fs.writeFileSync(
  `${out}/expression-crossings.json`,
  `${JSON.stringify(report, null, 2)}\n`,
);

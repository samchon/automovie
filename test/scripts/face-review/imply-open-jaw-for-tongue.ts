/** Make `tongueOut` reach a face somebody could make.
 *
 * Driven on its own, `tongueOut` does not put a tongue out. It pushes the
 * tongue into shut lips, and the render shows what the crossing count means: a
 * pink lobe fused with the lower lip, on every subject. There is no opening of
 * the jaw that a viewer is obliged to ask for alongside it, so the rig has to
 * carry the implication.
 *
 * The basis has no mechanism for one channel implying another. It does not need
 * one. Fold the whole `jawOpen` displacement into the `tongueOut` endpoint and
 * give a corrective on `(tongueOut+, jawOpen+)` its negative. A corrective
 * fires on the product of its drivers, so the double count cancels exactly
 * rather than approximately:
 *
 *   w_t (T + J) + w_j J - w_t w_j J
 *
 * is `T + J` at (1, 0), at (1, 1) and at (1, 0.5) alike, plain `J` with the
 * tongue in, and `0.5 T + J` at half a tongue out of a mouth already open.
 * Every corner and every middle, and `jawOpen` on its own is untouched.
 *
 * The poses this produces were photographed before it was written. A tongue out
 * of the mouth the fold opens reads correctly at six tenths and at full on both
 * the subject with the most crossings and the one with the fewest. The band in
 * between still counts a couple of hundred triangles, and that band is not
 * visible: the tongue is inside the mouth there and the crossing is the inner
 * face of the lower lip, occluded by the tongue itself. It is left alone.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/imply-open-jaw-for-tongue.ts [--write]
 */
import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import fs from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";

/** The identity this revision publishes under, and the one it succeeds. */
const REVISION = "mpfb-connected-head-2026-09-20-tongue-implies-jaw";
const SUCCEEDS = "mpfb-connected-head-2026-09-20-face-and-neck";

/** The endpoint the corrective spends to take the folded jaw back off. */
const UNFOLD = "tongueOutJawOpenUnfold";

const published = "studies/human-face/connected-basis/global-face";
const file = `${published}/basis.json.gz`;
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(file)).toString("utf8"),
);

const tongue = basis.channels.find((one) => one.id === "tongueOut");
const jaw = basis.channels.find((one) => one.id === "jawOpen");
if (tongue === undefined || jaw === undefined)
  throw new Error("this basis has no tongueOut or no jawOpen");
if (tongue.positive === null || jaw.positive === null)
  throw new Error("both channels must have a positive endpoint to fold");
const OUT = tongue.positive;
const OPEN = jaw.positive;

/** A sparse target read as vertex to displacement. */
const spread = (rows: number[] | undefined): Map<number, number[]> => {
  const out = new Map<number, number[]>();
  for (let i = 0; rows !== undefined && i < rows.length; i += 4)
    out.set(rows[i], [rows[i + 1], rows[i + 2], rows[i + 3]]);
  return out;
};

/** Back to sparse quadruples, strictly increasing by vertex as the schema says. */
const gather = (moved: Map<number, number[]>): number[] => {
  const out: number[] = [];
  for (const vertex of [...moved.keys()].sort((a, b) => a - b)) {
    const [x, y, z] = moved.get(vertex)!;
    // A vertex whose two displacements cancel is not a moved vertex.
    if (x === 0 && y === 0 && z === 0) continue;
    out.push(vertex, x, y, z);
  }
  return out;
};

let folded = 0;
let unfolded = 0;
for (const surface of basis.surfaces) {
  const open = spread(surface.targets[OPEN]);
  if (open.size === 0) continue;

  const out = spread(surface.targets[OUT]);
  for (const [vertex, move] of open) {
    const already = out.get(vertex) ?? [0, 0, 0];
    out.set(vertex, [
      already[0] + move[0],
      already[1] + move[1],
      already[2] + move[2],
    ]);
  }
  const back = new Map<number, number[]>();
  for (const [vertex, move] of open)
    back.set(vertex, [-move[0], -move[1], -move[2]]);

  surface.targets[OUT] = gather(out);
  surface.targets[UNFOLD] = gather(back);
  folded += out.size;
  unfolded += back.size;
  console.log(
    `  ${surface.id}: ${OUT} now moves ${surface.targets[OUT].length / 4}` +
      ` vertices, ${UNFOLD} ${surface.targets[UNFOLD].length / 4}`,
  );
}
console.log(`folded ${folded} vertex rows, unfolded ${unfolded}`);

const corrective = {
  id: "tongueOutJawOpenUnfold",
  inputs: [
    { channel: "tongueOut", side: "positive" as const },
    { channel: "jawOpen", side: "positive" as const },
  ],
  weight: 1,
  target: UNFOLD,
};

if (process.argv.includes("--write") === false) {
  console.log("dry run; pass --write to apply");
  console.log(`would add corrective ${JSON.stringify(corrective)}`);
} else if (basis.id === REVISION) {
  console.log("already published as this revision; nothing to do");
} else {
  if (basis.id !== SUCCEEDS)
    throw new Error(
      `this step succeeds ${SUCCEEDS}, but the basis reads ${basis.id}`,
    );
  const was = basis.id;
  basis.correctives = [...(basis.correctives ?? []), corrective];
  basis.id = REVISION;
  fs.writeFileSync(file, gzipSync(`${JSON.stringify(basis)}\n`, { level: 9 }));

  // Everything that names the basis it was authored against follows it.
  const restamp = (path: string, zipped: boolean) => {
    const raw = zipped
      ? gunzipSync(fs.readFileSync(path)).toString("utf8")
      : fs.readFileSync(path, "utf8");
    const parsed: unknown = JSON.parse(raw);
    const records: { basis?: string }[] = Array.isArray(parsed)
      ? parsed
      : Object.values(parsed as Record<string, { basis?: string }>);
    let moved = 0;
    for (const record of records)
      if (record.basis === was) {
        record.basis = REVISION;
        moved++;
      }
    const text = Array.isArray(parsed)
      ? `${JSON.stringify(parsed, null, 2)}\n`
      : `${JSON.stringify(parsed)}\n`;
    fs.writeFileSync(
      path,
      zipped ? gzipSync(text, { level: 9 }) : Buffer.from(text, "utf8"),
    );
    console.log(`  ${path}: ${moved} restamped`);
  };
  restamp(`${published}/subjects.json`, false);
  restamp(`${published}/grooms.json.gz`, true);

  console.log(`revision ${was} -> ${REVISION}`);
}

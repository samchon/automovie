/** Stop drawing the ninety percent of a brow texture that is not a brow.
 *
 * The eyebrow and eyelash surfaces carry strand textures whose alpha does the
 * shaping: 89.4 percent of the brow texture is under five percent alpha and
 * 85.1 percent of the lash texture is. Their materials declare `opacity: 1` and
 * no alpha mode, so the viewer's own default treats them as opaque and draws
 * the gaps between the strands. The gaps are near black. On the render a brow
 * is a black smear and the lashes are a scribble over the lid with pink specks
 * under it, on every subject -- the most visible fault on this face, and one
 * the crossing census cannot see because nothing passes through anything.
 *
 * Nothing needs inventing. `IAutoMovieMaterial` already carries `alphaMode` and
 * `alphaCutoff`, and the viewer already maps them:
 *
 *   alphaTest: alphaMode === "mask" ? (material.alphaCutoff ?? 0.5) : 0
 *
 * and the playground turns on alpha-to-coverage whenever that test is live,
 * which is what gives a cut-out hair card a clean edge under MSAA. The basis
 * simply never declared either field.
 *
 * Masking rather than blending, because these are hair cards: two sided, many
 * of them overlapping, and blending would need a sort order they do not have.
 *
 * The two cutoffs are read off the textures rather than guessed. Rendering the
 * surviving texels at a ladder of gates shows the brow keeping a solid body
 * with feathered edges down to about a fifth, and going gappy by a half. The
 * brow gets the lower gate because its texture never reaches full opacity at
 * all -- its densest texel is under 0.95 -- so a higher gate eats its body. The
 * lash texture has a twentieth of itself at full opacity and reads cleanly at a
 * fifth.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/mask-brow-and-lash-alpha.ts [--write]
 */
import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import fs from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";

/** The identity this revision publishes under, and the one it succeeds. */
const REVISION = "mpfb-connected-head-2026-09-20-strand-alpha";
const SUCCEEDS = "mpfb-connected-head-2026-09-20-tongue-implies-jaw";

/** The gate each strand material gets, read off its own texture. */
const GATES: Record<string, number> = {
  "Human.eyebrow001": 0.15,
  "Human.eyelashes01": 0.2,
};

const published = "studies/human-face/connected-basis/global-face";
const file = `${published}/basis.json.gz`;
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(file)).toString("utf8"),
);

const touched: string[] = [];
for (const material of basis.materials) {
  const gate = GATES[material.id];
  if (gate === undefined) continue;
  if (material.baseColorTexture === null)
    throw new Error(`${material.id} has no texture to gate`);
  material.alphaMode = "mask";
  material.alphaCutoff = gate;
  touched.push(`${material.id} at ${gate}`);
}
const missing = Object.keys(GATES).filter(
  (id) => basis.materials.some((one) => one.id === id) === false,
);
if (missing.length > 0)
  throw new Error(`this basis has no material ${missing.join(", ")}`);
console.log(`masking ${touched.join(", ")}`);

if (process.argv.includes("--write") === false) {
  console.log("dry run; pass --write to apply");
} else if (basis.id === REVISION) {
  console.log("already published as this revision; nothing to do");
} else {
  if (basis.id !== SUCCEEDS)
    throw new Error(
      `this step succeeds ${SUCCEEDS}, but the basis reads ${basis.id}`,
    );
  const was = basis.id;
  basis.id = REVISION;
  fs.writeFileSync(file, gzipSync(`${JSON.stringify(basis)}\n`, { level: 9 }));

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
  restamp(`${published}/skins.json.gz`, true);

  console.log(`revision ${was} -> ${REVISION}`);
}

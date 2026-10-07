import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import { findBodyCrossings } from "./findBodyCrossings";
import { listBodyHipStates } from "./listBodyHipStates";
import { summarizeBodyContacts } from "./readBodyContacts";

/**
 * Read the hip-flexion review population off a body basis and write the
 * states that cross as a census receipt the solver reads.
 *
 * Usage, from `test/`:
 *
 * `pnpm exec ttsx -P tsconfig.scripts.json scripts/body-basis/find-body-crossings.ts --basis <in.gz> --out <receipt.json> [--angles 75,90,100,110,125] [--extra-shapes '{"heavy@0.7":{"macroWeight":0.7}}'] [--only <regex>] [--side left]`
 *
 * The population is `listBodyHipStates`: the neutral body and every macro
 * channel at each end of its envelope, plus the extra shapes given as JSON,
 * each with the left, the right and both thighs flexed to each angle. With
 * `--only` keeps the states whose name matches the pattern. With
 * `--side left` the right-thigh-only states are left out, since the solver
 * publishes a right corrective as the mirror of its left one. The receipt is
 * `{ sets: { hips: { findings } } }`, the form `solve-body-correctives.ts
 * --census <receipt> --set hips` reads; it also lists the states the builder
 * refused. A state is a finding when it crosses where the rest pose does not.
 *
 * Every state is built through the public builder and split by the package's
 * segmenter, a few seconds each on a full body.
 */
const argv = process.argv.slice(2);
const option = (name: string): string | undefined =>
  argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined;
const basisPath = option("--basis");
const outPath = option("--out");
if (basisPath === undefined || outPath === undefined)
  throw new Error("Give --basis <in.gz> and --out <receipt.json>.");
const angles = (option("--angles") ?? "75,90,100,110,125")
  .split(",")
  .map(Number);
const extra = JSON.parse(option("--extra-shapes") ?? "{}") as Record<
  string,
  Record<string, number>
>;
const basis = JSON.parse(
  gunzipSync(fs.readFileSync(basisPath)).toString("utf8"),
) as IAutoMovieHumanBodyBasis;
const only = option("--only") === undefined ? null : new RegExp(option("--only")!);
const states = listBodyHipStates(basis, angles, extra).filter(
  (state) =>
    (only === null || only.test(state.name)) &&
    (option("--side") !== "left" ||
      !state.name.split(":")[1].startsWith("rightUpperLeg")),
);
console.log(states.length, "states on", basis.id);
const { findings, refused } = findBodyCrossings(basis, states, (state, found) =>
  console.log(
    state.name.padEnd(48),
    typeof found === "string"
      ? "REFUSED " + found.slice(0, 80)
      : summarizeBodyContacts(found),
  ),
);
fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify({
    basis: basis.id,
    states: states.length,
    sets: { hips: { findings } },
    refused,
  }),
);
console.log(findings.length, "findings,", refused.length, "refused");

import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import { type BodyCensusSets } from "./BodyCensusSets";
import { bodyCorrectiveBasisDigest } from "./bodyCorrectiveBasisDigest";
import { createBodyCorrectiveSession } from "./createBodyCorrectiveSession";
import { createBodyCorrectiveShardMetadata } from "./createBodyCorrectiveShardMetadata";
import { listCensusStates } from "./listCensusStates";
import { listSingleAxisStates } from "./listSingleAxisStates";

/**
 * Solve crossing states of the connected body basis into pose correctives and
 * write them as a shard for `merge-body-correctives.ts`. Nothing is written
 * into `studies/`.
 *
 * Usage, from `test/`:
 *
 * `pnpm exec ttsx -P tsconfig.scripts.json scripts/body-basis/solve-body-correctives.ts --basis <in.gz> --set single|<census set>[,<set>...] [--census <receipt.json>] [--only <regex>] [--drop <regex>] [--side left] <output-dir>`
 *
 * - `--set single` visits every mobile joint axis at the census sample angles;
 *   any other value names sets of the census receipt (`--census`, default the
 *   study's `census-receipt.json`), whose findings are the states.
 * - `--only` keeps the states whose name matches the pattern.
 * - `--side left` leaves a state whose name first names the right side to the
 *   mirror of its left counterpart, which the merge tool publishes.
 * - `--drop` removes the correctives whose id matches the pattern from the
 *   working basis before solving, so the states they were solved for are
 *   solved again on a basis that no longer wears them. The shard records the
 *   dropped ids and the merge tool removes them from the basis it publishes.
 *
 * The shard is `pose.json` in the output directory: the basis revision and
 * complete input payload digest (`bodyCorrectiveBasisDigest`), the
 * set, the filters, the dropped ids, the correctives with their rest rows and
 * one record per visited state (the pairs that crossed, the onset, the
 * verification and the outcome). It is rewritten after every state. A basis
 * with correctives is solved on top of them: a state wears every corrective
 * accepted before it, so states of one group belong to one run in the order
 * the lister gives.
 *
 * A run visits states through the public builder and the crossing instrument,
 * about half a minute each on a full body, and needs a few gigabytes.
 */
const argv = process.argv.slice(2);
const option = (name: string): string | undefined =>
  argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined;
const output = path.resolve(
  argv.filter(
    (arg, at) =>
      !arg.startsWith("--") &&
      !["--basis", "--set", "--census", "--only", "--drop", "--side"].includes(
        argv[at - 1],
      ),
  )[0] ?? ".shots/body-basis/solve",
);
const basisPath = option("--basis");
const set = option("--set");
if (basisPath === undefined || set === undefined)
  throw new Error("Give --basis <in.gz> and --set single|<census set>.");
const only =
  option("--only") === undefined ? null : new RegExp(option("--only")!);
const drop =
  option("--drop") === undefined ? null : new RegExp(option("--drop")!);
const side = option("--side");
if (side !== undefined && side !== "left")
  throw new Error("--side takes left.");

const loaded = JSON.parse(
  gunzipSync(fs.readFileSync(basisPath)).toString("utf8"),
) as IAutoMovieHumanBodyBasis;
const basisSha256 = bodyCorrectiveBasisDigest(loaded);
const shardMetadata = createBodyCorrectiveShardMetadata({
  id: loaded.id,
  sha256: basisSha256,
});
const dropped = new Set(
  (loaded.correctives ?? [])
    .filter((corrective) => drop?.test(corrective.id) === true)
    .map((corrective) => corrective.id),
);
const basis: IAutoMovieHumanBodyBasis = {
  ...loaded,
  correctives: (loaded.correctives ?? []).filter((c) => !dropped.has(c.id)),
  surfaces: [
    {
      ...loaded.surfaces[0],
      targets: Object.fromEntries(
        Object.entries(loaded.surfaces[0].targets).filter(
          ([name]) => !dropped.has(name),
        ),
      ),
    },
    ...loaded.surfaces.slice(1),
  ],
};

const firstSide = (name: string): string | null =>
  /left|right/i.exec(name)?.[0].toLowerCase() ?? null;
const states = (
  set === "single"
    ? listSingleAxisStates(basis)
    : listCensusStates(
        (
          JSON.parse(
            fs.readFileSync(
              option("--census") ??
                path.resolve(
                  "studies/human-body/connected-basis/census-receipt.json",
                ),
              "utf8",
            ),
          ) as { sets: BodyCensusSets }
        ).sets,
        set.split(","),
      )
).filter(
  (state) =>
    (only === null || only.test(state.name)) &&
    (side !== "left" || firstSide(state.name) !== "right"),
);

fs.mkdirSync(output, { recursive: true });
console.log(states.length, "states on", basis.id, "dropping", dropped.size);
const session = createBodyCorrectiveSession(basis, (line) => console.log(line));
const save = (): void =>
  fs.writeFileSync(
    path.join(output, "pose.json"),
    JSON.stringify({
      ...shardMetadata,
      set,
      only: only?.source ?? null,
      side: side ?? null,
      dropped: [...dropped],
      ...session.published(),
    }),
  );
for (const state of states) {
  session.solve(state);
  save();
}
save();

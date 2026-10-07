/**
 * Compile source generation G1 from one sampled work directory and its
 * authored head stages (#2689), from the test CWD:
 *
 *   ttsx -P tsconfig.human-source.json --no-plugins scripts/human-source/compile-source-generation.ts WORK OUTPUT [PROVIDER REPLAY [TRAITS]] [--oral-evaluations N] [--tongue-evaluations N]
 *
 * `--inspection-checkpoint DIRECTORY` explicitly composes a failed-qualified
 * completed-eye checkpoint through the same binding and registration owners.
 * It requires PROVIDER/REPLAY and excludes oral fitting options. Its output
 * remains inspection-only with the full lip refusal recorded, not publication.
 *
 * WORK is a directory prepared by `prepare-mpfb-profile.py` and sampled by
 * `sample-mpfb-generation.py` (`acquisition.json`, `upstream/`, `sample/`);
 * `sample-source-generation.ts` runs both. OUTPUT is a new directory.
 *
 * PROVIDER is the authored head provider directory (its packet, neutral and
 * joints) and REPLAY the complete output of `replay-head-source-provider.py`
 * over this same sample. They are given together or omitted together: with
 * them the compiler builds the current authored root and also writes its
 * source stage to `OUTPUT-source-stage`; without them it compiles the native
 * sampled skin only. TRAITS is the output directory of
 * `compile-head-trait-endpoints.py` over the same sample, authoring directory
 * and PROVIDER, and needs the provider pair.
 *
 * Use it to recompile an existing work directory after a compiler change;
 * `compileHumanSourceGeneration` owns the stage order.
 */
import path from "node:path";

import { compileHumanSourceGeneration } from "./compileHumanSourceGeneration.ts";

const arguments_ = process.argv.slice(2);
let oralEvaluations: number | undefined;
let tongueEvaluations: number | undefined;
let inspectionCheckpoint: string | undefined;
for (const option of ["--oral-evaluations", "--tongue-evaluations", "--inspection-checkpoint"]) {
  const at = arguments_.indexOf(option);
  if (at === -1) continue;
  if (at + 1 >= arguments_.length || arguments_.indexOf(option, at + 1) !== -1) throw new Error(option + " requires one unique evaluation budget.");
  if (option === "--inspection-checkpoint") inspectionCheckpoint = path.resolve(arguments_[at + 1]);
  else if (option === "--oral-evaluations") oralEvaluations = Number(arguments_[at + 1]);
  else tongueEvaluations = Number(arguments_[at + 1]);
  arguments_.splice(at, 2);
}
const [work, output, provider, replay, traits] = arguments_.map((p) => path.resolve(p));
if (work === undefined || output === undefined) throw new Error("Usage: compile-source-generation.ts WORK OUTPUT [PROVIDER REPLAY [TRAITS]]");
compileHumanSourceGeneration(work, output, path.resolve(__dirname, "../../.."), provider, replay, traits, oralEvaluations, tongueEvaluations, inspectionCheckpoint);

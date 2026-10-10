/**
 * Compile source generation G1 from one sampled work directory and its
 * authored head stages (#2689), from the test CWD:
 *
 *   ttsx -P tsconfig.human-source.json scripts/human-source/compile-source-generation.ts WORK OUTPUT [PROVIDER REPLAY [TRAITS]] --attachment-document FACE_DOCUMENT [--oral-evaluations N] [--tongue-evaluations N]
 *
 * FACE_DOCUMENT is an existing numerical face document with explicit eyes.
 * Its original fields and basis identity are retained, its exact bytes enter
 * generation identity, and publication rechecks them. Normal document parsing
 * admits scalar/optical feasibility only, not this new host or a clinical model.
 *
 * `--inspection-checkpoint DIRECTORY` explicitly composes a failed-qualified
 * completed-eye checkpoint through the same binding and registration owners.
 * It requires PROVIDER/REPLAY and excludes oral fitting options. Its output
 * remains inspection-only with the full lip refusal recorded, not publication.
 *
 * WORK is a complete acquired native source (`acquisition.json`, `upstream/`,
 * `sample/`). Normal `sample-source-generation.ts` verifies and imports the
 * preserved licensed bytes through TypeScript, retaining original acquisition
 * and sample provenance without fresh MPFB extraction. OUTPUT is new.
 *
 * PROVIDER is the authored head provider directory (its packet, neutral and
 * joints) produced by `author-head-source-provider.ts` and
 * `prepare-head-source-provider.ts`. REPLAY is the complete output of
 * `replay-head-source-provider.ts`
 * over this same sample. They are given together or omitted together: with
 * them the compiler builds the current authored root and also writes its
 * source stage to `OUTPUT-source-stage`; without them it compiles the native
 * sampled skin only. TRAITS is the output directory of
 * `compile-head-trait-endpoints.ts` over the same sample, authoring directory
 * and PROVIDER, and needs the provider pair. Dimensional precision endpoints
 * are optional, not a prerequisite for the acquired coarse neutral.
 *
 * Use it to recompile an existing work directory after a compiler change;
 * `compileHumanSourceGeneration` owns the stage order. After final head-row
 * and optical support registration, its shared attachment producer prepares
 * the supplied numerical context and all registered native tarsal extents before
 * writing either product view or P1 face. The manifest records that numerical
 * support witness and keeps source, inspection and clinical qualification
 * separate. The ordinary brow bootstrap remains an additional support witness.
 * An explicit numerical context can also use the same owner through
 * `compile-source-attachment-charts.ts`, followed by the normal immutable
 * `project-source-face-metadata.ts` projection into its original head.
 */
import path from "node:path";

import { compileHumanSourceGeneration } from "./compileHumanSourceGeneration.ts";

const arguments_ = process.argv.slice(2);
let oralEvaluations: number | undefined;
let tongueEvaluations: number | undefined;
let inspectionCheckpoint: string | undefined;
let attachmentDocument: string | undefined;
for (const option of [
  "--oral-evaluations",
  "--tongue-evaluations",
  "--inspection-checkpoint",
  "--attachment-document",
]) {
  const at = arguments_.indexOf(option);
  if (at === -1) continue;
  if (at + 1 >= arguments_.length || arguments_.indexOf(option, at + 1) !== -1)
    throw new Error(option + " requires one unique value.");
  if (option === "--inspection-checkpoint")
    inspectionCheckpoint = path.resolve(arguments_[at + 1]);
  else if (option === "--attachment-document")
    attachmentDocument = path.resolve(arguments_[at + 1]);
  else if (option === "--oral-evaluations")
    oralEvaluations = Number(arguments_[at + 1]);
  else tongueEvaluations = Number(arguments_[at + 1]);
  arguments_.splice(at, 2);
}
const [work, output, provider, replay, traits] = arguments_.map((p) =>
  path.resolve(p),
);
if (work === undefined || output === undefined)
  throw new Error(
    "Usage: compile-source-generation.ts WORK OUTPUT [PROVIDER REPLAY [TRAITS]] --attachment-document FACE_DOCUMENT",
  );
compileHumanSourceGeneration(
  work,
  output,
  path.resolve(__dirname, "../../.."),
  provider,
  replay,
  traits,
  oralEvaluations,
  tongueEvaluations,
  inspectionCheckpoint,
  attachmentDocument,
);

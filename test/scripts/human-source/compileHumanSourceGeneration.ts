import { prepareHumanSourceGenerationInputs } from "./prepareHumanSourceGenerationInputs.ts";
import { replayHumanSourceGeneration } from "./replayHumanSourceGeneration.ts";
import { assembleHumanSourceGenerationViews } from "./assembleHumanSourceGenerationViews.ts";
import { publishHumanSourceGeneration } from "./publishHumanSourceGeneration.ts";
import type { IHumanSourceGenerationOptions } from "./structures/IHumanSourceGenerationOptions.ts";

/**
 * Compile source generation G1 from one prepared and sampled work directory
 * (#2689) into a new OUTPUT directory and return the generation id.
 *
 * Order: verify the acquisition against the lock and the sample against its
 * manifest; read the published face and body and the two historical faces by
 * digest; freeze the neck cut (`buildHumanSourceCut`); reproduce face rows,
 * body rows and the body rig; compare the replay with historical body stages.
 * Every input is then read and the input record is frozen, so the generation
 * id assembled next covers all of them. Assemble the one-skin generation,
 * define every MPFB macro once over the whole skin (`defineHumanSourceMacros`),
 * define the remaining one-sided endpoints on the body band
 * (`defineHumanSourceBand`), build
 * the P1 pair after binding the attached parts to the skin and regenerating
 * their body-control rows (`bindHumanSourceParts`), measure every row's carry on
 * those artifacts, classify provenance from the measured residuals, split the
 * generation into the person head and body views (`splitHumanSourcePersonViews`),
 * prepare complete native attachments on the final head/optical frame, and
 * write both views with the reproduction record and a content-only manifest.
 * Explicit completed-eye inspection uses verified checkpoint geometry through
 * these same owners and retains its full-stage refusal; ordinary compilation
 * still requires every source-neutral authoring stage to succeed.
 * Attachment preparation requires an existing explicit-eye numerical document.
 * Its unchanged source identity and scalar values are pinned before generation
 * composition and checked again before publication. Parsing admits its schema
 * and optical feasibility; it does not admit the new host, model or clinical fit.
 * Tracked published bases are read only.
 */
export function compileHumanSourceGeneration(
  work: string,
  output: string,
  repository: string,
  provider?: string,
  replay?: string,
  traitsDirectory?: string,
  oralEvaluations?: number,
  tongueEvaluations?: number,
  inspectionCheckpoint?: string,
  attachmentDocument?: string,
): string {
  if (
    inspectionCheckpoint !== undefined &&
    (provider === undefined ||
      replay === undefined ||
      oralEvaluations !== undefined ||
      tongueEvaluations !== undefined)
  )
    throw new Error(
      "Completed-eye inspection requires its provider/replay and cannot claim an oral fitting run.",
    );
  const started = Date.now();
  const options: IHumanSourceGenerationOptions = {
    work, output, repository, provider, replay, traitsDirectory,
    oralEvaluations, tongueEvaluations, inspectionCheckpoint,
    attachmentDocument,
  };
  const inputs = prepareHumanSourceGenerationInputs(options);
  const prepared = replayHumanSourceGeneration(options, inputs);
  const compiled = assembleHumanSourceGenerationViews(prepared);
  publishHumanSourceGeneration(options, compiled);
  console.log("[human-source] written", output, ((Date.now() - started) / 1000).toFixed(1), "s");
  return compiled.generation.id;
}

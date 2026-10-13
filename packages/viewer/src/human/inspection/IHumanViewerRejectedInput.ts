import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * A document the viewer refused or has not yet decided, with the reason: an
 * input file, the published person generation, or a document the viewer
 * itself authors (the standard people), which takes the same owner admission.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the refused file and why.
 *
 * @evidence contracts/common.md#principled-implementation File identity, cause and pending state preserve refusals separately from admissions still awaiting authority.
 * @evidence contracts/common.md#clear-and-simple-design Optional document identity and descriptor extend the same record for individual entries without creating a second rejection channel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A pending candidate descriptor is selectable for admission work and cannot become a drawable accepted document by transport alone.
 *
 * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic File identity, cause and pending state preserve refusals separately from admissions still awaiting authority.
 * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation A pending candidate descriptor is selectable for admission work and cannot become a drawable accepted document by transport alone.
 *
 * @author Samchon
 */
export interface IHumanViewerRejectedInput {
  /**
   * The input file name inside the inputs directory, the generation view
   * paths, or `viewer-authored <document id>` for a document the viewer builds.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Identifies the actual input file, generation views or application-authored document whose admission is unavailable or refused.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Identifies the actual input file, generation views or application-authored document whose admission is unavailable or refused.
   */
  file: string;

  /**
   * Why it was refused, or what it is waiting for when pending.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Preserves the original refusal or infrastructure waiting cause rather than an assumed valid result.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Preserves the original refusal or infrastructure waiting cause rather than an assumed valid result.
   */
  reason: string;

  /**
   * True while the input is not yet decided (a sidecar still being read, a
   * document awaiting admission); false for a refusal that stands until the
   * file changes.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Distinguishes undecided sidecar/admission work from a standing refusal that changes only with its input.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Distinguishes undecided sidecar/admission work from a standing refusal that changes only with its input.
   */
  pending: boolean;

  /**
   * The document id when the entry is one document of a file (or one viewer-authored document).
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Keeps an optional individual document identity when one file offers several entries.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Keeps an optional individual document identity when one file offers several entries.
   */
  id?: string;

  /**
   * Selectable numerical descriptor while pending; it is not a drawable or admitted document.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Exposes a selectable pending descriptor for owner admission without classifying it as drawable or already admitted.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Exposes a selectable pending descriptor for owner admission without classifying it as drawable or already admitted.
   */
  candidate?: IHumanViewerCatalogueEntry;
}

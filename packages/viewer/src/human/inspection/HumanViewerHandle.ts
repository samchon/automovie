import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human";
import type { IAutoMovieHumanFacePeriocularMappingReport } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularMappingReport";
import type { IConnectedBodyConstructionExportResult } from "@automovie/human/body/runtime/IConnectedBodyConstructionExportResult";
import type { IConnectedBodyRigReading } from "@automovie/human/body/runtime/IConnectedBodyRigReading";

import type { HumanViewerAddress } from "./HumanViewerAddress.js";

/**
 * Read-only browser observation protocol, shared by the page host and server.
 * Numerical document editing is absent. A PNG may contain a
 * composed local photograph, but photographs and their paths never enter
 * numerical cache persistence.
 *
 * @evidence contracts/common.md#principled-implementation The protocol separates display selection from numerical authoring and private reference resources.
 * @evidence contracts/common.md#clear-and-simple-design A single browser contract serves resident HTTP and human navigation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Operations never address anatomical vertices or fitted subject constants.
 * @evidence contracts/common.md#meaningful-documentation Defines read-only ownership, provenance and canvas capture.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Display selection, device/source observation, original construction readings and canvas capture share the committed generation's supported handle.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The observation handle exposes the product resident rather than a viewer-only anatomy model or an inferred acceptance verdict.
 *
 * @author Samchon
 */
export interface HumanViewerHandle {
  /**
   * Apply display state and finish the GPU frame.
   *
   * @evidence contracts/common.md#principled-implementation An explicit display address is awaited through the committed generation before its completed GPU frame is exposed.
   * @evidence contracts/common.md#clear-and-simple-design Display selection remains one operation while model construction stays with the product viewport.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The call selects a document and view without altering anatomical vertices or fitting subject parameters.
   * @evidence contracts/common.md#meaningful-documentation The promise marks completed drawing and propagates display or generation failure.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach An explicit display address is awaited through the committed generation before its completed GPU frame is exposed.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The promise marks completed drawing and propagates display or generation failure.
   */
  show(address: HumanViewerAddress): Promise<void>;

  /**
   * Exact displayed mesh names from the product observation hook.
   *
   * @evidence contracts/common.md#principled-implementation Mesh names come from the currently displayed viewport's product observation hook.
   * @evidence contracts/common.md#clear-and-simple-design Only the displayed names are returned; construction admission has its separate accessor.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The list reports actual meshes rather than a precomputed expected part catalogue.
   * @evidence contracts/common.md#meaningful-documentation The result identifies displayed mesh names and supplies no physical acceptance verdict.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Mesh names come from the currently displayed viewport's product observation hook.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The result identifies displayed mesh names and supplies no physical acceptance verdict.
   */
  parts(): string[];

  /**
   * Unmasked WebGL device string.
   *
   * @evidence contracts/common.md#principled-implementation The renderer accessor reports the current unmasked WebGL device identity.
   * @evidence contracts/common.md#clear-and-simple-design Device observation remains independent of document selection and numerical build telemetry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Hardware identity comes from WebGL rather than an HTTP readiness assumption.
   * @evidence contracts/common.md#meaningful-documentation The returned string identifies the device used to draw the observed frame.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The renderer accessor reports the current unmasked WebGL device identity.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The returned string identifies the device used to draw the observed frame.
   */
  renderer(): string;

  /**
   * Source digest against which the current resident was built.
   *
   * @evidence contracts/common.md#principled-implementation The revision accessor identifies the source digest used by the current resident.
   * @evidence contracts/common.md#clear-and-simple-design Display provenance is read separately from the host's newer source catalogue.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A newer backend revision cannot replace the digest under which the displayed resident was built.
   * @evidence contracts/common.md#meaningful-documentation The result labels resident source authority rather than compile success alone.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The revision accessor identifies the source digest used by the current resident.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The result labels resident source authority rather than compile success alone.
   */
  revision(): string;

  /**
   * Actual numerical worker builds, excluding disk and GPU cache hits.
   *
   * @evidence contracts/common.md#principled-implementation The counter reports actual numerical worker builds and distinguishes reuse from computation.
   * @evidence contracts/common.md#clear-and-simple-design One cumulative counter is enough to compare successive display requests.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Disk and resident cache hits cannot be counted as numerical builds.
   * @evidence contracts/common.md#meaningful-documentation The contract states which completed operations increment the reading.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The counter reports actual numerical worker builds and distinguishes reuse from computation.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The contract states which completed operations increment the reading.
   */
  builds(): number;

  /**
   * Milliseconds the numerical worker took for the last build, zero before the first.
   *
   * @evidence contracts/common.md#principled-implementation The last build's worker duration preserves the producer's actual elapsed measurement.
   * @evidence contracts/common.md#clear-and-simple-design Only the latest numerical duration is exposed; per-stage drawing timings are separate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A cache hit cannot acquire a manufactured numerical build duration.
   * @evidence contracts/common.md#meaningful-documentation Milliseconds are measured by the worker and zero means no first build yet.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The last build's worker duration preserves the producer's actual elapsed measurement.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Milliseconds are measured by the worker and zero means no first build yet.
   */
  buildMs(): number;

  /**
   * Page milliseconds per named stage of the last show, empty for a pure cache hit.
   *
   * @evidence contracts/common.md#principled-implementation Named stage readings describe the last show operation rather than the lifetime of the source server.
   * @evidence contracts/common.md#clear-and-simple-design A timing map keeps producer stage names without adding a second timing schema.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A pure cache hit reports an empty map instead of invented stage work.
   * @evidence contracts/common.md#meaningful-documentation The result uses page milliseconds and explicitly describes the cache-hit absence.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Named stage readings describe the last show operation rather than the lifetime of the source server.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The result uses page milliseconds and explicitly describes the cache-hit absence.
   */
  spans(): Record<string, number>;

  /**
   * Last committed display selection; refuses before any model is displayed.
   *
   * @evidence contracts/common.md#principled-implementation The observation returns the last committed display selection.
   * @evidence contracts/common.md#clear-and-simple-design Committed selection has one owner and is separate from a candidate still loading.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The accessor refuses before display instead of guessing an initial model or camera.
   * @evidence contracts/common.md#meaningful-documentation Failure before the first model and the committed-address meaning are explicit.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The observation returns the last committed display selection.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Failure before the first model and the committed-address meaning are explicit.
   */
  address(): HumanViewerAddress;

  /**
   * Actual construction checks, null when no construction is displayed.
   *
   * @evidence contracts/common.md#principled-implementation The accessor forwards the original construction admission independently of rendering success.
   * @evidence contracts/common.md#clear-and-simple-design Nullable admission distinguishes construction from displays with no construction report.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A visible model cannot manufacture passed physical checks.
   * @evidence contracts/common.md#meaningful-documentation Null means no construction is displayed; any present report remains the product owner's reading.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach The accessor forwards the original construction admission independently of rendering success.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Null means no construction is displayed; any present report remains the product owner's reading.
   */
  admission(): IAutoMovieHumanConstructionAdmission | null;

  /**
   * Same-resident placement readings; absent for a preview or a face.
   *
   * @evidence contracts/common.md#principled-implementation Placement readings belong to the same displayed Body or Person construction.
   * @evidence contracts/common.md#clear-and-simple-design The optional accessor projects one owner reading without copying its anatomical calculation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preview and Face displays have no invented body placement report.
   * @evidence contracts/common.md#meaningful-documentation Omission or undefined means the displayed operation supplied no rig reading.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Placement readings belong to the same displayed Body or Person construction.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Omission or undefined means the displayed operation supplied no rig reading.
   */
  rigReading?(): IConnectedBodyRigReading | undefined;

  /**
   * Encode the displayed Person construction, preserving rejected admission.
   *
   * @evidence contracts/common.md#principled-implementation Static encoding uses the displayed Person's original document and product construction path.
   * @evidence contracts/common.md#clear-and-simple-design Encoding remains an explicit asynchronous operation separate from display and observation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A rejected construction admission is preserved rather than converted into an admitted preview.
   * @evidence contracts/common.md#meaningful-documentation The promise returns the product encoding outcome together with original admission state.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Static encoding uses the displayed Person's original document and product construction path.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The promise returns the product encoding outcome together with original admission state.
   */
  exportConstruction(): Promise<IConnectedBodyConstructionExportResult>;

  /**
   * Owner mapping readings from the constructed face; absence reports no reading.
   *
   * @evidence contracts/common.md#principled-implementation Mapping reports originate from the face construction currently observed.
   * @evidence contracts/common.md#clear-and-simple-design The optional accessor forwards the owner's report array instead of recalculating mappings.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent construction readings cannot be replaced by viewer-fitted correspondence.
   * @evidence contracts/common.md#meaningful-documentation Undefined means no owner mapping report is available for the display.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Mapping reports originate from the face construction currently observed.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Undefined means no owner mapping report is available for the display.
   */
  periocularMappings?():
    | IAutoMovieHumanFacePeriocularMappingReport[]
    | undefined;

  /**
   * Finished PNG; refuses before display, and includes a shown local reference photograph.
   *
   * @evidence contracts/common.md#principled-implementation Capture reads the finished displayed canvas, with any shown local photograph composition.
   * @evidence contracts/common.md#clear-and-simple-design One PNG accessor covers the final display instead of a second render path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It refuses before any display and does not treat HTTP readiness as a captured model.
   * @evidence contracts/common.md#meaningful-documentation The result is a finished PNG and retains the displayed reference layer.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Capture reads the finished displayed canvas, with any shown local photograph composition.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach The result is a finished PNG and retains the displayed reference layer.
   */
  png(): string;

  /**
   * Withdraw the least recently used resident other than the one shown and
   * await its owned retirement. False means no selectable resident remains;
   * failed retirement rejects instead of claiming physical release.
   *
   * @evidence contracts/common.md#principled-implementation Eviction selects a least-recently-used resident while preserving the currently shown one.
   * @evidence contracts/common.md#clear-and-simple-design The page's existing resident cache owns the release decision.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Eviction is based on cache membership and recency, never the age of the active display.
   * @evidence contracts/common.md#meaningful-documentation False means no selectable resident remains, while failed retirement rejects; the displayed model is excluded and counted arrays do not certify physical GPU release.
   *
   * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach Eviction selects a least-recently-used resident while preserving the currently shown one.
   * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach False means no releasable resident remains; the displayed model is excluded.
   */
  evict(): Promise<boolean>;
}

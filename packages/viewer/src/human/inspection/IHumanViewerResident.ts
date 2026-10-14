import type { IConnectedBodyConstructionExportResult } from "@automovie/human/body/runtime/IConnectedBodyConstructionExportResult";
import type { IConnectedBodyRigReading } from "@automovie/human/body/runtime/IConnectedBodyRigReading";
import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";
import type { IAutoMovieHumanFacePeriocularMappingReport } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularMappingReport";
import type * as THREE from "three";

/**
 * One document kept drawn-ready in the page: its stage, its group and counted arrays. The page applies a soft selected-byte budget that permits one oversize resident and separately retains pending or failed retirement accounting, rather than counting documents or certifying physical GPU memory.
 *
 * @evidence contracts/common.md#principled-implementation A resident couples the actual displayed group with its viewport, counted array-byte weight and optional owner construction readings; drawing does not imply admission and the weight is not a measured physical memory bound.
 * @evidence contracts/common.md#clear-and-simple-design One record carries stage operations and construction metadata needed by selection, capture and export, leaving numerical construction with Human.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Admission and periocular readings are forwarded from their owners, and bytes explicitly avoid claiming physical GPU allocation measurements.
 * @evidence contracts/common.md#meaningful-documentation Comments explain optional construction data, counted-array bytes and repeated release sharing its original retirement result and failures.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The resident type chooses no mesh-construction or byte-counting algorithm; builders and measureHumanViewerResidentBytes supply those results.
 * @evidence contracts/performance.md#reuse-equivalent-work Release repeats share the original completion; document identity and source/basis cache equivalence are owned by the surrounding residency cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page owns stage, group and retained arrays; release awaits worker, controls and resource retirements, while failed retirement accounting remains separate.
 *
 * @author Samchon
 */
export interface IHumanViewerResident<Stage> {
  /** The product viewport that draws the document. */
  stage: Stage;

  /** Actual construction admission, never inferred from drawing success. */
  admission?: IAutoMovieHumanConstructionAdmission;

  /**
   * Existing placement readings accompanying this resident's actual construction.
   */
  rigReading?: IConnectedBodyRigReading;

  /**
   * Encode this resident's original document through its product viewport.
   *
   * @evidence contracts/common.md#principled-implementation Construction export delegates to the resident's product viewport so bytes are encoded from the original construction document, preserving its admission even when rejected.
   * @evidence contracts/common.md#clear-and-simple-design The optional callback keeps body/person export beside the resident without inventing export behavior for unsupported face residents.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Export does not reconstruct geometry from a displayed mesh or substitute a different document after construction.
   * @evidence contracts/common.md#meaningful-documentation The member specifies original-document encoding through the viewport; absence means no construction-export capability was supplied.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback type defines no encoding algorithm; the connected body viewport owns serialization of construction data.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Export completion is not cached by this resident shape; the viewport decides whether construction work remains equivalent.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Export borrows the active viewport and returns its owned result; releasing the resident remains a separate lifecycle operation.
   */
  exportConstruction?: () => Promise<IConnectedBodyConstructionExportResult>;

  /**
   * Independent constructed-face mapping readings, forwarded unchanged from their owner.
   */
  periocularMappings?: IAutoMovieHumanFacePeriocularMappingReport[];

  /** The displayed group. */
  group: THREE.Group;

  /**
   * Resizes the stage to the frame.
   *
   * @evidence contracts/common.md#principled-implementation Viewport resizing delegates to the resident host's current frame rather than deriving dimensions from numerical body geometry.
   * @evidence contracts/common.md#clear-and-simple-design A parameterless closure keeps access to the host frame with its actual viewport owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The resize callback uses the mounted host dimensions, with no document-dependent sizing correction in this record.
   * @evidence contracts/common.md#meaningful-documentation The comment states that the stage is resized to the frame; the host retains the frame measurement responsibility.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The resize capability chooses no layout algorithm or pixel-allocation strategy inside this interface.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Frame sizes may change between calls; the resident declaration promises no cached resize result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Resizing transfers no ownership; the host and viewport retain their existing controls and render resources.
   */
  resize: () => void;

  /**
   * Withdraw this resident and await every owned worker, control and resource retirement attempt. Repeats share the original completion and failures; success is not a physical GPU allocation measurement.
   *
   * @evidence contracts/common.md#principled-implementation Awaited retirement joins independent owned cleanup attempts and preserves their failures rather than equating scene withdrawal with resource completion.
   * @evidence contracts/common.md#clear-and-simple-design One release promise provides a single lifecycle boundary for stage, numerical connection and host controls.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retirement completion is not reported as measured physical GPU reclamation and failed cleanup is not hidden by a retry wrapper.
   * @evidence contracts/common.md#meaningful-documentation The member documents withdrawal, awaited attempts, shared repeat results and the GPU-measurement limitation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The release signature does not choose traversal or cleanup scheduling; the resource-retirement owner implements the joined attempts.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated releases share their original promise and rejection causes so owned cleanup effects run once per resident.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Selection eviction and page shutdown invoke release; it awaits every worker, control and resource retirement attempt owned by the resident.
   */
  release: () => Promise<void>;

  /** Counted array-byte weight at build time; plain arrays use eight bytes per element and repeated references count again. */
  bytes: number;
}

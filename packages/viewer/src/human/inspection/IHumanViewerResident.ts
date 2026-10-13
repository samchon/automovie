import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";
import type { IAutoMovieHumanFacePeriocularMappingReport } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularMappingReport";
import type { IConnectedBodyConstructionExportResult } from "@automovie/human/body/runtime/IConnectedBodyConstructionExportResult";
import type { IConnectedBodyRigReading } from "@automovie/human/body/runtime/IConnectedBodyRigReading";
import type * as THREE from "three";

/**
 * One document kept drawn-ready in the page: its stage, its group and counted arrays. The page bounds selected `bytes` and separately retains pending or failed retirement accounting, rather than counting documents or certifying physical GPU memory.
 *
 * @evidence contracts/common.md#principled-implementation A resident pairs its displayed group, product stage and counted array bytes with the construction owner's independent admission and export readings.
 * @evidence contracts/common.md#clear-and-simple-design The generic stage keeps face and body viewports usable without duplicating their construction or release rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Construction admission is carried explicitly and cannot be inferred from a successfully drawn group or counted bytes.
 * @evidence contracts/common.md#meaningful-documentation Identifies the owned group, optional construction readings, resize and release operations, and the array-byte accounting boundary.
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
   * @evidence contracts/common.md#principled-implementation The optional exporter encodes the resident's original document through its product viewport, preserving the construction owner's result type.
   * @evidence contracts/common.md#clear-and-simple-design Export remains a stage operation rather than a second cache-owned encoder.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A drawn resident does not bypass construction admission or fabricate an accepted export.
   * @evidence contracts/common.md#meaningful-documentation States that export uses the original resident document and may be absent for a stage without this capability.
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
   * @evidence contracts/common.md#principled-implementation Resize adjusts this resident's stage to the current frame without changing its numerical document.
   * @evidence contracts/common.md#clear-and-simple-design The resident stores a stage-local operation instead of reimplementing viewport sizing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Frame resizing carries no permission to rebuild anatomy or replace the displayed model.
   * @evidence contracts/common.md#meaningful-documentation Identifies the stage sizing operation and its association with this resident.
   */
  resize: () => void;

  /**
   * Withdraw this resident and await every owned worker, control and resource
   * retirement attempt. Repeats share the original completion and failures;
   * success is not a physical GPU allocation measurement.
   *
   * @evidence contracts/common.md#principled-implementation Release independently attempts the original stage, worker connection and host cleanup, then reports their ordered causes through one shared completion.
   * @evidence contracts/common.md#clear-and-simple-design The resident cache invokes one release operation while the stage retains resource cleanup details.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Releasing a resident cannot authorize stopping unrelated browser or process owners.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes immediate withdrawal from awaited owned retirement, sticky failure and unmeasured physical GPU release.
   */
  release: () => Promise<void>;

  /** Bytes of arrays the resident keeps alive, counted when it was built. */
  bytes: number;
}

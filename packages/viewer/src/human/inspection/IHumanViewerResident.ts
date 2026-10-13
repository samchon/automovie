import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";
import type { IAutoMovieHumanFacePeriocularMappingReport } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularMappingReport";
import type { IConnectedBodyConstructionExportResult } from "@automovie/human/body/runtime/IConnectedBodyConstructionExportResult";
import type { IConnectedBodyRigReading } from "@automovie/human/body/runtime/IConnectedBodyRigReading";
import type * as THREE from "three";

/**
 * One document kept drawn-ready in the page: its stage, its group and counted arrays. The page bounds selected `bytes` and separately retains pending or failed retirement accounting, rather than counting documents or certifying physical GPU memory.
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

  /** Encode this resident's original document through its product viewport. */
  exportConstruction?: () => Promise<IConnectedBodyConstructionExportResult>;

  /**
   * Independent constructed-face mapping readings, forwarded unchanged from their owner.
   */
  periocularMappings?: IAutoMovieHumanFacePeriocularMappingReport[];

  /** The displayed group. */
  group: THREE.Group;

  /** Resizes the stage to the frame. */
  resize: () => void;

  /**
   * Withdraw this resident and await every owned worker, control and resource
   * retirement attempt. Repeats share the original completion and failures;
   * success is not a physical GPU allocation measurement.
   */
  release: () => Promise<void>;

  /** Bytes of arrays the resident keeps alive, counted when it was built. */
  bytes: number;
}

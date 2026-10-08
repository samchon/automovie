import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";
import type { IAutoMovieHumanFacePeriocularMappingReport } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularMappingReport";
import type { IConnectedBodyConstructionExportResult } from "@automovie/playground/src/human/body/IConnectedBodyConstructionExportResult";
import type * as THREE from "three";

/**
 * One document kept drawn-ready in the page: its stage, its group and what it
 * costs. The page bounds the sum of `bytes` instead of the number of residents.
 *
 * @evidence contracts/common.md#principled-implementation Carries the measured size the resident cache is bounded by.
 * @evidence contracts/common.md#meaningful-documentation Names what a resident owns and releases.
 * @author Samchon
 */
export interface IHumanViewerResident<Stage> {
  /** The product viewport that draws the document. */
  stage: Stage;

  /** Actual construction admission, never inferred from drawing success. */
  admission?: IAutoMovieHumanConstructionAdmission;

  /** Encode this resident's original document through its product viewport. */
  exportConstruction?: () => Promise<IConnectedBodyConstructionExportResult>;

  /** Independent constructed-face mapping readings, forwarded unchanged from their owner. */
  periocularMappings?: IAutoMovieHumanFacePeriocularMappingReport[];

  /** The displayed group. */
  group: THREE.Group;

  /** Resizes the stage to the frame. */
  resize: () => void;

  /** Releases the stage's worker, controls and GPU resources. */
  release: () => void;

  /** Bytes of arrays the resident keeps alive, counted when it was built. */
  bytes: number;
}

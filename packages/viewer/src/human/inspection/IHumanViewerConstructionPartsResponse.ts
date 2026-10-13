import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human";
import type { IAutoMovieHumanFacePeriocularMappingReport } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularMappingReport";
import type { IConnectedBodyRigReading } from "@automovie/human/body/runtime/IConnectedBodyRigReading";
import type { HumanViewerAddress } from "./HumanViewerAddress.js";

/**
 * Face, Body or whole-person construction inspection from the normal parts route.
 * Mesh names describe the generated instance while the independent admission
 * report states whether the owner's physical checks accepted that instance.
 * Drawing or listing parts does not change the report.
 *
 * @evidence contracts/common.md#principled-implementation Preserves the original construction admission and generated mesh names as separate readings.
 * @evidence contracts/common.md#meaningful-documentation States the two authorities without equating construction with acceptance.
 *
 * @evidence contracts/common.md#clear-and-simple-design Part names, admission, address and source revision coexist as separate readings from one displayed construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Visible mesh names cannot overwrite a refused owner admission or imply physical construction acceptance.
 *
 * @author Samchon
 */
export interface IHumanViewerConstructionPartsResponse {
  /** Actual displayed generation read with these construction observations. */
  revision: string;

  /** Actual completed display selection, including document and camera. */
  address: HumanViewerAddress;

  /** Actual product owner's construction checks, including every refusal. */
  admission: IAutoMovieHumanConstructionAdmission;

  /** Exact names exposed by the constructed viewport's observation hook. */
  parts: string[];

  /** Rest/posed placement readings from the displayed construction. */
  rigReading?: IConnectedBodyRigReading;

  /**
   * Optional independent UV/offset/host readings from the actual construction owner.
   */
  periocularMappings?: IAutoMovieHumanFacePeriocularMappingReport[];
}

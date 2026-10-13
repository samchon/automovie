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
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Preserves the original construction admission and generated mesh names as separate readings.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Visible mesh names cannot overwrite a refused owner admission or imply physical construction acceptance.
 *
 * @author Samchon
 */
export interface IHumanViewerConstructionPartsResponse {
  /**
   * Actual displayed generation read with these construction observations.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Labels the actual displayed source generation under which the construction readings were obtained.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Labels the actual displayed source generation under which the construction readings were obtained.
   */
  revision: string;

  /**
   * Actual completed display selection, including document and camera.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Preserves the completed document and camera selection associated with the same construction observations.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Preserves the completed document and camera selection associated with the same construction observations.
   */
  address: HumanViewerAddress;

  /**
   * Actual product owner's construction checks, including every refusal.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Retains the product owner's complete physical construction verdict without deriving acceptance from visible mesh names.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Retains the product owner's complete physical construction verdict without deriving acceptance from visible mesh names.
   */
  admission: IAutoMovieHumanConstructionAdmission;

  /**
   * Exact names exposed by the constructed viewport's observation hook.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Reports actual generated mesh names independently of whether the construction admission passed.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Reports actual generated mesh names independently of whether the construction admission passed.
   */
  parts: string[];

  /**
   * Rest/posed placement readings from the displayed construction.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Forwards optional rest/posed placement readings from this displayed construction rather than recomputing them in Viewer.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Forwards optional rest/posed placement readings from this displayed construction rather than recomputing them in Viewer.
   */
  rigReading?: IConnectedBodyRigReading;

  /**
   * Optional independent UV/offset/host readings from the actual construction owner.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Forwards optional UV/offset/host mapping observations from the construction owner without viewer fitting.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Forwards optional UV/offset/host mapping observations from the construction owner without viewer fitting.
   */
  periocularMappings?: IAutoMovieHumanFacePeriocularMappingReport[];
}

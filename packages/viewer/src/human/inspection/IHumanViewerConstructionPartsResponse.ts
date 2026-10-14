import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human";
import type { IConnectedBodyRigReading } from "@automovie/human/body/runtime/IConnectedBodyRigReading";
import type { IAutoMovieHumanFacePeriocularMappingReport } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularMappingReport";

import type { HumanViewerAddress } from "./HumanViewerAddress.js";

/**
 * Face, Body or whole-person construction inspection from the normal parts route. Mesh names describe the generated instance while the independent admission report states whether the owner's physical checks accepted that instance. Drawing or listing parts does not change the report.
 *
 * @evidence contracts/common.md#principled-implementation Projects actual completed display address/revision, mesh names and independent product construction admission/optional rig/periocular readings.
 * @evidence contracts/common.md#clear-and-simple-design Keeps listed parts and owner physical checks in one response without making drawing or names substitute for admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A retained admitted:false report remains refused even after successful publication; part names are mesh observations and need not be unique identities.
 * @evidence contracts/common.md#meaningful-documentation Documents current display provenance and actual owner reports, with optional domain-specific readings absent when that construction does not provide them.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The response performs no inspection; page observation traverses current root meshes and the route serializes returned reports/names.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads retained construction observations for the current shown resident; source/address matching still precedes returning them through the route.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The response borrows report/address arrays until JSON transport; no new numerical build, geometry clone or native handle is owned by its type.
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

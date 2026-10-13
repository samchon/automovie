import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type {
  IAutoMovieHumanBodyAnatomicalInspection,
  IAutoMovieHumanBodyExteriorCandidateBuild,
  IAutoMovieHumanBodyFootSupport,
} from "../../index";

import type { ConnectedBodyModel } from "./ConnectedBodyModel";
import type { IConnectedBodyFemoralHeads } from "./IConnectedBodyFemoralHeads";
import type { IConnectedBodyMeasuredAnatomy } from "./IConnectedBodyMeasuredAnatomy";
import type { IConnectedBodyUnavailableAnatomy } from "./IConnectedBodyUnavailableAnatomy";
import type { IConnectedBodyRigReading } from "./IConnectedBodyRigReading";

/**
 * The worker's reply to a preview request.
 *
 * The model's buffers belong to this reply. Crossings and anatomy are read
 * only when requested; null means not requested. Inspection and exterior
 * candidates appear only for those request kinds and never certify a
 * resolved clinical skin.
 *
 * @author Samchon
 */
export interface IConnectedBodyPreviewResult {
  /** Reply kind. */
  operation: "preview";

  /** Transferable preview model. */
  model: ConnectedBodyModel;

  /** Surface crossings, or null when not requested. */
  crossings: IAutoMovieModelCrossing[] | null;

  /** Humeral head reading, its refusal, or null when not requested. */
  anatomy:
    | IConnectedBodyMeasuredAnatomy
    | IConnectedBodyUnavailableAnatomy
    | null;

  /** Femoral head target reading, or null when not requested or not asked for. */
  femoralHeads?: IConnectedBodyFemoralHeads | null;

  /** Each foot's ground gap, or null when not requested or the basis has no ground. */
  groundSupport?: IAutoMovieHumanBodyFootSupport[] | null;

  /** Additional build readings keyed by name. */
  extras: Record<string, unknown>;

  /** Returned rest/posed placement readings from this same construction. */
  rigReading?: IConnectedBodyRigReading;

  /** Candidate-only numerical inspection; legacy body previews omit it. */
  anatomicalRequest?: IAutoMovieHumanBodyAnatomicalInspection;

  /** Actual source-conditioned exterior; never a resolved clinical skin. */
  exteriorCandidate?: IAutoMovieHumanBodyExteriorCandidateBuild["exterior"];
}

import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanFacePeriocularTissueFit } from "./IHumanFacePeriocularTissueFit";
import type { AutoMovieHumanFacePeriocularTissue } from "../../../structures/AutoMovieHumanFacePeriocularTissue";
import type { IHumanFacePeriocularMappingReading } from "./IHumanFacePeriocularMappingReading";

/** Actual generated closed tissue shell and its shared source attachment.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularTissuePart {
  /** Anatomical side whose live source cage carries the shell. */
  side: "left" | "right";
  /** Coarse tissue identity; role assignment retains source authoring qualification. */
  tissue: AutoMovieHumanFacePeriocularTissue;
  /** Exact source generation shared by cage, host skin and this geometry. */
  generation: string;
  /** Licensed authored cage receipt identity, without a clinical acquisition claim. */
  sourceId: string;
  /** Closed capped shell in canonical head-frame metres, read by contact and finish. */
  mesh: IAutoMovieMesh;

  /** Room the requested dimensions had inside the lid at the stations this shell is built from. */
  fit: IHumanFacePeriocularTissueFit;

  /** Actual optional mapping observation; never a replacement admission verdict. */
  readMapping?: () => IHumanFacePeriocularMappingReading;
}

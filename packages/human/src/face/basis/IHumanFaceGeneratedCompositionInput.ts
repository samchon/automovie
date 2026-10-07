import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";

import type { IHumanFaceBrowAssembly } from "../anatomy/brow/IHumanFaceBrowAssembly";
import type { IHumanFaceLashRow } from "../anatomy/lash/structures/IHumanFaceLashRow";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IHumanFacePoseResult } from "./IHumanFacePoseResult";
import type { IHumanConstructionCheck } from "../../common/basis/IHumanConstructionCheck";

/** One owned model composition with exact geometry stages and the current finish lookup.
 *
 * @author Samchon
 */
export interface IHumanFaceGeneratedCompositionInput {
  /** Model-owned admission tasks; composition adds checks without changing geometry. */
  checks: IHumanConstructionCheck[];

  /** Current admitted numerical geometry and finish requests for this owned build. */
  document: IAutoMovieHumanFaceBasisDocument;
  /** Exact retained source/generated geometry used by the same contact stage. */
  pose: IHumanFacePoseResult;
  /** Actual requested shaft rows, including deliberate empty populations. */
  lashes?: readonly IHumanFaceLashRow[];
  /** Generated brow parts and exact resident card incidence they replace. */
  brows?: IHumanFaceBrowAssembly;
  /** The current build's owned resident model; no previous admitted model enters. */
  model: IAutoMovieModel;
  /** Extended together with model materials for the same build's AO publication. */
  materialMap: Map<string, IAutoMovieMaterial>;
}

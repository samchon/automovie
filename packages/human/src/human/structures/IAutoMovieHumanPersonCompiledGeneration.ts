import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";
import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanPersonChannelAlias } from "./IAutoMovieHumanPersonChannelAlias";
import type { IAutoMovieHumanPersonEndpointDriver } from "./IAutoMovieHumanPersonEndpointDriver";
import type { IAutoMovieHumanPersonGeneration } from "./IAutoMovieHumanPersonGeneration";
import type { IAutoMovieHumanPersonSkinPlan } from "./IAutoMovieHumanPersonSkinPlan";
import type { IAutoMovieHumanPersonSourceNormalInput } from "./IAutoMovieHumanPersonSourceNormalInput";

/**
 * Everything a one-skin generation fixes before any document: the admitted
 * views, the shared-sample plan, the body's rest rows at the shared and band
 * vertices, the neutral head anchor, aliases and drivers, and the region
 * corner tables. The full evaluator and the rest reader both read it.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonCompiledGeneration {
  /** The generation as joined. */
  generation: IAutoMovieHumanPersonGeneration;

  /** The basis the face producer evaluates: the band-extended face view, or the face view. */
  faceProducer: IAutoMovieHumanFaceBasis;

  /** The index of the head skin surface in the face producer's surfaces. */
  faceProducerSkin: number;

  /** The index of the band surface in the face producer's surfaces, when the generation has band rows. */
  faceProducerBand?: number;

  /** The index of the skin surface in the body view's surfaces. */
  bodyIndex: number;

  /** The head skin's source partition. */
  faceSource: IAutoMovieHumanBasisSourcePartition;

  /** The body skin's source partition. */
  bodySource: IAutoMovieHumanBasisSourcePartition;

  /** The forming step's shared-sample plan. */
  plan: IAutoMovieHumanPersonSkinPlan;

  /** The body's shape rows at the plan's rest rows. */
  restTargets: Record<string, number[]>;

  /** The body's neutral positions at the plan's rest rows. */
  restNeutral: number[];

  /** The body's neutral eye-centre anchor. */
  neutralAnchor: IAutoMovieVector3;

  /** Face channels the generation defines once through a body channel. */
  aliases: IAutoMovieHumanPersonChannelAlias[];

  /** Body endpoints whose head rows the face view holds. */
  drivers: IAutoMovieHumanPersonEndpointDriver[];

  /** Per body skin region id, the skin vertex each render vertex reads. */
  bodyRegions: ReadonlyMap<string, readonly number[]>;

  /**
   * The one normal field over both halves.
   */
  sourceNormals: (input: IAutoMovieHumanPersonSourceNormalInput) => number[];
}

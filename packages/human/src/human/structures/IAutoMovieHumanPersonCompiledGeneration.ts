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
 * @evidence contracts/common.md#principled-implementation One compiled record serves the evaluator and the rest reader, so both evaluate the same skin.
 * @evidence contracts/common.md#clear-and-simple-design The fields the per-document steps read, nothing more.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every table is derived from the generation's registration; nothing is matched by position.
 * @evidence contracts/common.md#meaningful-documentation States what each field holds.
 * @evidence contracts/modeling.md#shared-boundaries Holds the shared-sample plan both halves read one value through.
 * @evidence contracts/modeling.md#spatial-conventions Neutral positions and the anchor are metres of the generation's frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The views own their channels; aliases and drivers are carried as admitted.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits no document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record converts no input.
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
   *
   * @evidence contracts/common.md#principled-implementation The evaluator reads the source normal owner's compiled field.
   * @evidence contracts/common.md#clear-and-simple-design One performed skin in, one normal array out.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The member is a signature; it carries no behaviour.
   * @evidence contracts/common.md#meaningful-documentation States what it returns.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The member defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The member carries no channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The member emits no geometry.
   * @evidenceExclude contracts/modeling.md#spatial-conventions The owner states its units.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The owner gives shared samples one normal.
   * @evidenceExclude contracts/modeling.md#rendered-observation The member displays nothing.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The member carries no anatomical value.
   * @evidenceExclude contracts/anatomy.md#permitted-range The member admits nothing.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The member converts no input.
   */
  sourceNormals: (input: IAutoMovieHumanPersonSourceNormalInput) => number[];
}

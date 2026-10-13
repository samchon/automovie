import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";
import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanPersonChannelAlias } from "./IAutoMovieHumanPersonChannelAlias";
import type { IAutoMovieHumanPersonEndpointDriver } from "./IAutoMovieHumanPersonEndpointDriver";
import type { IAutoMovieHumanPersonGeneration } from "./IAutoMovieHumanPersonGeneration";
import type { IAutoMovieHumanPersonSkinPlan } from "./IAutoMovieHumanPersonSkinPlan";
import type { IAutoMovieHumanPersonSourceNormalInput } from "./IAutoMovieHumanPersonSourceNormalInput";

/**
 * Document-invariant context for the registered full evaluator and source-rest readers: admitted generation correspondence, optional transient band face view, shared sample plan, compact metre rest rows, neutral eye anchor, aliases/drivers, body region corner maps and one normal-field reader. Source normal compilation captures admitted partition copies; faceSource/bodySource and unchanged generation/plan members still borrow source records. Mutable arrays/maps and closures require unchanged source context rather than relying on runtime freeze.
 *
 * This context establishes source chart/weight correspondence under compiler checks. It does not establish clinical head/body proportion, global embeddedness, current GPU appearance or equivalence of rest shortcuts to omitted full stages.
 *
 * @evidence contracts/common.md#principled-implementation Actual shared sample identities, source/band rest operands and source-normal correspondence expose one generation's invariant inputs to both evaluator routes.
 * @evidence contracts/common.md#clear-and-simple-design Canonical generation/skin/source schemas hold their separate domains while indices, compact rest rows and region maps name existing consumer seams.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Borrowed source partitions are not falsely called detached/frozen, and source metadata admission is not promoted into clinical, global geometry or rendered qualification.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre/rest timing, copied versus borrowed context, mutable plan/cache premises and full/rest qualification boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This context type runs no compilation, correspondence scan or normal evaluation; concrete owners execute those algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Compile-once table reuse is evaluator/compiler behavior rather than a cache implemented by the interface.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring context acquires no source fetch, worker or handle; the actual containing builder/caller owns borrowed source and compiled buffer lifetime.
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
   * Read the source-normal field over both halves from actual performed metre fields and, when required, their same-generation reference. Returned normals are dimensionless owned coordinates; source incidence/callback purity and unchanged compiled context remain concrete owner premises.
   *
   * @evidence contracts/common.md#principled-implementation Matching performed source halves and explicit required reference address the single canonical shading field used by assembled skin parts.
   * @evidence contracts/common.md#clear-and-simple-design The callback exposes the existing source normal owner while geometry/chart admission and cofactor transport stay in their implementations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Required reference is not replaced by invented neutral data, and shading/source validity alone supplies no clinical volume mechanics or current visual proof.
   * @evidence contracts/common.md#meaningful-documentation Prose states actual metre inputs, dimensionless output, same-generation reference and owner purity/lifetime premises.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased function property runs no source-cell or star traversal; its compiled implementation owns actual costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Normal plan/query reuse is the concrete field owner's behavior rather than memoization in this signature.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature acquires no field buffer or task; returned arrays and actual compiled closures follow caller/builder lifetime.
   */
  sourceNormals: (input: IAutoMovieHumanPersonSourceNormalInput) => number[];
}

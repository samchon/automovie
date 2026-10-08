import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";

/**
 * Actual formed person skin and the body component whose layers it completes.
 * No source field or personal position is authored by this transport.
 *
 * @evidence contracts/common.md#principled-implementation Carries actual projected parts and the existing body's native source address into one completion.
 * @evidence contracts/common.md#clear-and-simple-design Names the region, instance and normal authorities the completion consumes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no substitute geometry or source identity.
 * @evidence contracts/common.md#meaningful-documentation States final part, native index and shared normal ownership.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Carries existing final metre geometry and dimensionless source indices.
 * @evidence contracts/modeling.md#shared-boundaries Names the actual rendered parts and their shared physical registration.
 * @evidenceExclude contracts/modeling.md#rendered-observation The Person consumer observes the supplied parts.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Supplies no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing owners admit source, document and layers.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Runtime parts are not a personal sculpt input.
 * @author Samchon
 */
export interface ICompleteHumanPersonBodyLayersProps {
  /** Immutable body source with native thickness registration. */
  basis: IAutoMovieHumanBodyBasis;

  /** Existing placed body construction, with layers deferred. */
  body: IAutoMovieHumanBodyBuild;

  /** Actual prefixed person parts after final skin projection. */
  parts: IAutoMovieModel["parts"];

  /** Final person physical instance and shared source registration. */
  domain: string;

  /** Person document instance, distinct from a reusable body document. */
  instance: string;

  /** Native body surface index in the immutable source. */
  surface: number;

  /** Actual face skin region identities, excluding other face tissues. */
  faceRegions: ReadonlyMap<string, readonly number[]>;

  /** Actual body skin region identities, excluding internal anatomy and garments. */
  bodyRegions: ReadonlyMap<string, readonly number[]>;

  /** Shared final normal field, with face vertices followed by body vertices. */
  normals: readonly number[];

  /** Native face vertex population preceding body normals. */
  faceVertices: number;
}

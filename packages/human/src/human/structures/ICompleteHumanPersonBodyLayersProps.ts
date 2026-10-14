import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";

/**
 * Actual formed person skin and the body component whose layers it completes. No source field or personal position is authored by this transport.
 *
 * @evidence contracts/common.md#principled-implementation Actual final skin parts and a shared normal field provide the layer exterior; explicit region maps exclude garments and internal anatomy from that reading.
 * @evidence contracts/common.md#clear-and-simple-design Native basis identity, physical domain and person instance stay with layer completion, which reconnects final skin to the body component.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Layer inputs come from the final person geometry rather than an earlier body-only exterior used to compensate for placement.
 * @evidence contracts/common.md#meaningful-documentation Comments identify native surface ordinals, face-before-body normal order, final physical registration and unprefixed region membership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Layer transport declares operands only; exterior reconstruction and anatomical layer generation choose traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record exposes current final skin rather than a cached exterior; layer completion owns dependency-sensitive reconstruction.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Final parts and basis metadata are caller-owned references; this input type acquires no layer query or retained task.
 *
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

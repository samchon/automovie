import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";

/**
 * Actual formed person skin and the body component whose layers it completes.
 * No source field or personal position is authored by this transport.
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

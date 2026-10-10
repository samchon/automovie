import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneWorldRest } from "../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";

/**
 * Offline reference placement of an atlas surface against one body shape.
 *
 * The compiler registers the mesh into common body metres and records the
 * carrying rig frame on that exact shape. Runtime only carries it rigidly;
 * an authored placement does not establish imaged articular centres, fitted
 * tissue contact or person-specific anatomy.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAtlasRegistration {
  /** Exact compiled body basis revision; copied stale resources refuse. */
  basis: string;

  /** Humanoid carrier; separate anatomical joints require another rig owner. */
  bone: AutoMovieHumanoidBone;

  /** Carrying frame against which the registered mesh was authored. */
  reference: IAutoMovieHumanBodyBoneWorldRest;

  /** Exact basis weights; omission of a channel means zero. */
  shape: Record<string, number>;

  /** Named paired references, conversions and unresolved registration limits. */
  protocol: string;

  /** Authored reference placement supplies no personal tissue registration. */
  qualification: "authored-reference-only";
}

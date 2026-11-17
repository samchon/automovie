import type { IAutoMovieQuaternion } from "../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../../skeleton/AutoMovieHumanoidBone";

/** Type contracts exchanged by AutoMovieHumanCanonicalSolids; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanCanonicalSolids {
  /** One drawn joint at the canonical rest.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One drawn joint at the canonical rest.
   * @evidence contracts/development/design.md#principled-representation `parent`: Parent Human joint, or null at the root. `carrier`: The rig bone that carries this joint rigidly. `position`: Rest joint centre, canonical metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanCanonicalSolids.build.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `parent`, `carrier`, `position`, `tip`, `radius`; callers supply the complete record.
   */
  export interface IJoint {
    /** Parent Human joint, or null at the root. */
    parent: string | null;

    /** The rig bone that carries this joint rigidly. */
    carrier: AutoMovieHumanoidBone;

    /** Rest joint centre, canonical metres. */
    position: IAutoMovieVector3;

    /** Rest tip of a leaf segment, canonical metres. */
    tip: IAutoMovieVector3 | null;

    /** Girth radius, metres. */
    radius: number;
  }

  /** One convex solid of the body.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One convex solid of the body.
   * @evidence contracts/development/design.md#principled-representation `id`: Unique shape id: the module's joint, numbered when the module is cut. `carrier`: The rig bone that carries the solid. `centre`: The solid's centroid, canonical metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanCanonicalSolids.build. Also types AutoMovieHumanCanonicalSolids.solids.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `id`, `carrier`, `centre`, `points`, `volume`, `inertia`, `inertiaRotation`; callers supply the complete record.
   */
  export interface ISolid {
    /** Unique shape id: the module's joint, numbered when the module is cut. */
    id: string;

    /** The rig bone that carries the solid. */
    carrier: AutoMovieHumanoidBone;

    /** The solid's centroid, canonical metres. */
    centre: IAutoMovieVector3;

    /** The hull's points about the centroid, canonical axes, metres. */
    points: IAutoMovieVector3[];

    /** Volume, cubic metres. */
    volume: number;

    /** Principal moments of the uniform solid per unit mass, square metres. */
    inertia: IAutoMovieVector3;

    /** Rotation from the principal frame to the canonical axes. */
    inertiaRotation: IAutoMovieQuaternion;
  }
}

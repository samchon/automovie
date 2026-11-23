import type { IAutoMoviePatternFaceFrame } from "./IAutoMoviePatternFaceFrame";
import type { IAutoMoviePatternFacet } from "./IAutoMoviePatternFacet";
import type { IAutoMovieSurfacePatternResult } from "./IAutoMovieSurfacePatternResult";

/**
 * Generated occurrences, placement panels and prototype choices for explicit
 * instance transforms.
 */
export namespace IAutoMoviePatternInstanceTransforms {
  /**
   * Generated occurrences, placement panels and prototype choices for explicit
   * instance transforms.
   *
   * A repeated module is a GPU instance, never duplicated vertex data, so the
   * whole modules leave here as explicit full-TRS slots: the occurrence id
   * becomes the slot id, the in-plane rotation becomes a real unit quaternion
   * rather than a yaw, and the module's two face dimensions plus its thickness
   * become a per-axis scale rather than a uniform one. A prototype table, when
   * given, is indexed by the occurrence's own seeded variant, so the variation
   * the run drew is the variation the instancer draws.
   *
   * A cut piece is not an instance and is not pretended to be one. Scaling a
   * whole module down to a cut piece's bounding box would render a tile that is
   * the wrong shape and the wrong size, so cut occurrences are returned by id
   * for the caller to build as geometry.
   *
   * The prototype's local `+X` maps to the module's U extent, local `+Y` to its
   * V extent, and local `+Z` to the face normal, which is `u × v`.
   *
   * A host that folds at a corner or curves is one developed face standing on
   * several flat panels, so a zone may name its own
   * {@link IAutoMoviePatternFacet} and every zone that does not stays on
   * {@link frame}.
   *
   * Throws when the thickness is not a finite positive number, a frame or facet
   * value is not finite, an axis is not unit length or the two axes are not
   * perpendicular within `1e-6`, a facet names a zone the run did not lay or
   * repeats one, or a whole occurrence's variant has no entry in `prototypes`.
   */
  export type IProps = {
    /**
     * Borrowed generated placements and zone quantities; cut pieces are
     * reported separately.
     */
    result: IAutoMovieSurfacePatternResult;

    /**
     * Default world-metre origin and approximately orthonormal axes for
     * developed U/V metres.
     */
    frame: IAutoMoviePatternFaceFrame;

    /** Panels the folded or curved zones return onto; the rest use `frame`. */
    facets?: readonly IAutoMoviePatternFacet[];

    /** Module thickness along the face normal in metres, strictly above zero. */
    thickness: number;

    /** Prototype ids indexed by variant; omitted leaves the set default. */
    prototypes?: readonly string[];
  };
}

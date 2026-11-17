import type { IAutoMovieConstructionProfileGuide } from "./IAutoMovieConstructionProfileGuide";
import type { IAutoMovieConstructionProfileLoop } from "./IAutoMovieConstructionProfileLoop";
import type { IAutoMovieConstructionProfileRegion } from "./IAutoMovieConstructionProfileRegion";

/**
 * An original section family assembled from oriented curve pieces in one physical plane.
 *
 * This declaration references actual functions in an invocation-owned engine source.
 * Loops are closed contours; their pieces can be open intervals and may be nonconvex.
 * Hole orientation and branch identities remain explicit. The record alone certifies
 * neither simple loops nor regularity, continuity or successful skin generation.
 *
 * @evidence contracts/development/design.md#principled-representation Whole original curve intervals and one common physical plane define the sections before surface generation; no polar or convex-envelope representation is imposed. Loop station domains retain metres, piece clocks retain source units and signed traversals preserve original functions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Closed data references identify functions, physical domains, curve clocks, guides and logical/material/binding regions; runtime callbacks stay in engine. Profile preparation, guide resolution and mesh selections share these members under the family that owns their identities.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Labels do not infer geometry, missing derivatives or shared binding. Parameter intervals retain their original functions rather than sampled refits; topology remains an explicit admission responsibility. No member substitutes output polylines for the original source or treats logical labels as proven geometric continuity.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes metre station intervals from original curve clocks, open pieces from closed loops and declared identity from verified geometry. Original contour pieces, guides and ownership regions of a profile family. Member documentation specifies their units, references and absence behavior.
 */
export interface IAutoMovieConstructionProfile {
  /** Stable generating-family identity, independent of logical anatomical names. */
  name: string;

  /** Actual retained physical station interval, metres, finite and increasing. */
  domain: [number, number];

  /** Common physical plane/frame owner key in the runtime source. */
  plane: string;

  /** Closed components or holes, each valid on its own physical station interval. */
  loops: IAutoMovieConstructionProfileLoop[];

  /** Original guides at explicit curve clocks, never observed display polylines. */
  guides: IAutoMovieConstructionProfileGuide[];

  /** Logical selections and material/binding addresses of actual source pieces. */
  regions: IAutoMovieConstructionProfileRegion[];

  /** Actual dependency identities; an edit supplies a new source instance. */
  revisions: {
    /** Identity of the original source-function revision. */
    source: string;

    /** Identity of the constraints used to prepare those source functions. */
    constraints: string;

    /** Identity of the retained piece/loop/branch topology. */
    topology: string;
  };
}

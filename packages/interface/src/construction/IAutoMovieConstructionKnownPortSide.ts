import type { IAutoMovieConstructionKnownPortSource } from "./IAutoMovieConstructionKnownPortSource";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * One resolved immutable original neighboring field and its actual chart map.
 *
 * @evidence contracts/development/design.md#principled-representation One resolved side couples the original world-mm surface to its original-clock/transverse chart map; both remain immutable while the band is read.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ConstructionKnownPort resolves this pair from the invocation source; SolidSurface and KnownPortSource retain ownership of the component contracts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pair does not certify map coverage or continuity; known-port preparation admits the complete rectangle before publication.
 * @evidence contracts/development/common.md#meaningful-documentation States the retained field, mapping coordinates and immutable lifetime.
 */
export interface IAutoMovieConstructionKnownPortSide {
  /** Same immutable original field used by the band, in kernel world millimetres. */
  field: IAutoMovieSolidSurface;

  /** Same original-clock/transverse map used for this field's exact pullback. */
  map: IAutoMovieConstructionKnownPortSource.IMap;
}

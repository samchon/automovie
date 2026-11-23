import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieStageSetPiece } from "../authoring/IAutoMovieStageSetPiece";
import type { IAutoMovieFootprint } from "../geometry/space/IAutoMovieFootprint";
import type { IAutoMovieHeightSurface } from "../geometry/space/IAutoMovieHeightSurface";
import type { IAutoMoviePropRelationTarget } from "../harness/IAutoMoviePropRelationTarget";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";

/**
 * The world face a prop or a built member rests on, as one record every kind of
 * support answers.
 *
 * Three producers state a face in different terms and are read here in one: a
 * region on the ground plan, and a rule saying how high the face stands over
 * that region. `propSupportFace` gives a building support patch its own
 * footprint and height rule, and gives another prop's `stack-top` the extent
 * carried through the host's full staged TRS, the same transform
 * `propOccupancyBounds` measures the resting prop through, so a scaled or
 * turned host's top and the geometry that shows it stay one surface.
 * `builtEnvironmentSupportStatus` gives a built body's bearing part its top as
 * a level rectangle. `propSupportGap` reads every one of them the same way.
 */
export interface IAutoMoviePropSupportFace {
  /**
   * The face's plan region in world XZ metres, holes included. A probe in a
   * hole's open interior is not over the face; every rim is. A prop
   * affordance's top is one convex ring; a support patch keeps whatever region
   * its rings describe.
   */
  polygon: IAutoMovieFootprint;

  /**
   * How high the face stands over each point of {@link polygon}, in world
   * metres, in the spelling `surfaceHeightAt` reads: the patch's own surface
   * record, a plane rule for a prop top, or a constant for a built part's top.
   */
  height: IAutoMovieHeightSurface;
}

/** Data and callback contracts shared by the PropSupportFace operations. */
export namespace IAutoMoviePropSupportFace {
  /**
   * The face one `on-support` relation resolves to, or `null` when the record
   * states none.
   *
   * A `surface` target resolves to the cited built environment's support patch:
   * its own footprint, holes included, and its own height rule. A
   * `prop-affordance` target resolves to the host prop's `stack-top` extent
   * carried through the affordance frame and the host's full staged transform
   * ({@link setPieceMatrix}), hulled into one convex ring, with a plane height
   * rule through the transformed top.
   *
   * Nothing is guessed. A citation that does not resolve, a host that is not
   * staged, a contact of a kind that carries no face (`handle`, `socket`,
   * `hook`), a `stack-top` without an extent, a patch whose region encloses no
   * area, and a top staged edge-on to the ground each answer `null`, because a
   * face nobody can measure is not a face a prop can be proven off. The edge-on
   * top's height over the ground plan is not a function, so there is no rule to
   * read it by, and inventing one would refuse or excuse a prop for a number
   * the author never wrote.
   *
   * Lookups take the first record of a given id, exactly as
   * {@link propAnchorFrame} does and for the same reason: contradicting ids are
   * {@link validatePropPlacements}'s own refusal, by name.
   */
  export type IProps = {
    /** The `on-support` relation's target: a patch, or another prop's contact. */
    target:
      | IAutoMoviePropRelationTarget.ISurface
      | IAutoMoviePropRelationTarget.IPropAffordance;

    /** Every built environment a patch citation may resolve against. */
    environments: readonly IAutoMovieBuiltEnvironment[];

    /** The prop registry a `prop-affordance` citation resolves against. */
    props?: readonly IAutoMoviePropSpec[];

    /** The staged set that gives a cited host prop its world transform. */
    set?: readonly IAutoMovieStageSetPiece[];
  };
}

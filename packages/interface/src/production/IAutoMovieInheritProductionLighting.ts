import type { IAutoMovieLight } from "../scene/IAutoMovieLight";
import type { IAutoMovieProductionLighting } from "../scene/IAutoMovieProductionLighting";
import type { IAutoMovieShotStoryTime } from "./IAutoMovieShotStoryTime";

/**
 * Data and callback contracts shared by the InheritProductionLighting operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation One shot's lights at one shot-local instant, with the production's sources inherited at the story moment the shot's pin places that instant at. Member documentation states the supplied records, units and absence meanings used by inheritProductionLighting.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unpinned shots retain their staged sources; this input does not imply that the production assembly's opening snapshot is a continuously sampled light track.
 * @evidence contracts/development/design.md#principled-representation lighting and pin explicitly permit null; seconds is shot-local and maps through the pin to the story clock before light-id merging.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieInheritProductionLighting, used by inheritProductionLighting. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieInheritProductionLighting {
  /**
   * One shot's lights at one shot-local instant, with the production's sources inherited at the story moment the shot's pin places that instant at.
   *
   * With no production lighting, or for a shot carrying no story pin, the staged lights come back unchanged in a new array, element by element. A film that says nothing about production light therefore renders the frames it always did, and an unpinned shot is never assigned a story moment it did not claim.
   *
   * Otherwise the production is resolved at `autoMovieStoryTime(pin, seconds)` and merged by light id:
   *
   * - A staged light whose id a production source shares is replaced in place by that source, so the scene says which of the production's lights it stands under and the production owns the values.
   * - A production source no staged light names is appended after the staged lights, in declaration order, so a film states its source once instead of every scene re-declaring it.
   *
   * The current production assembly caller evaluates this helper once at shot time zero. The result is an opening snapshot, not a continuously resampled production-light track; the shot's own lightMotions subsequently animate that snapshot. Returned light objects are staged or resolved objects themselves, not copies.
   *
   * @evidence contracts/development/common.md#meaningful-documentation One shot's lights at one shot-local instant, with the production's sources inherited at the story moment the shot's pin places that instant at. Member documentation states the supplied records, units and absence meanings used by inheritProductionLighting.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unpinned shots retain their staged sources; this input does not imply that the production assembly's opening snapshot is a continuously sampled light track.
   * @evidence contracts/development/design.md#principled-representation lighting and pin explicitly permit null; seconds is shot-local and maps through the pin to the story clock before light-id merging.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieInheritProductionLighting.IProps, used by inheritProductionLighting. Its lighting, lights, pin, seconds members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** The production's declared sources, or `null` when it declares none. */
    lighting: IAutoMovieProductionLighting | null;

    /** The shot's scene lights, in staging order. */
    lights: readonly IAutoMovieLight[];

    /** Where the shot sits on the story clock, or `null` when it is unpinned. */
    pin: IAutoMovieShotStoryTime | null;

    /** The instant to evaluate, in shot-local seconds. */
    seconds: number;
  };
}

import {
  IAutoMovieLight,
  IAutoMovieProductionLighting,
  IAutoMovieShotStoryTime,
} from "@automovie/interface";

import { autoMovieStoryTime } from "./autoMovieStoryTime";
import { resolveProductionLighting } from "./resolveProductionLighting";

/**
 * One shot's lights at one shot-local instant, with the production's sources
 * inherited at the story moment the shot's pin places that instant at.
 *
 * With no production lighting, or for a shot carrying no story pin, the staged
 * lights come back unchanged in a new array, element by element. A film that
 * says nothing about production light therefore renders the frames it always
 * did, and an unpinned shot is never assigned a story moment it did not claim.
 *
 * Otherwise the production is resolved at `autoMovieStoryTime(pin, seconds)`
 * and merged by light id:
 *
 * - A staged light whose id a production source shares is replaced in place by
 *   that source, so the scene says which of the production's lights it stands
 *   under and the production owns the values.
 * - A production source no staged light names is appended after the staged
 *   lights, in declaration order, so a film states its source once instead of
 *   every scene re-declaring it.
 *
 * The result composes with a shot's own `lightMotions`: the applier that plays
 * those clips runs over this list, so a lamp switched on inside the beat lands
 * on top of the inherited state. Returned light objects are the staged or
 * resolved objects themselves, not copies.
 *
 * @evidence contracts/common.md#principled-implementation An id-keyed left merge: a map from production id to resolved light replaces staged entries in place and a set of staged ids selects the sources to append, so staged order is preserved and the result is a pure function of lighting, lights, pin and time; it relies on ids being unique within each list, which scene and production validation enforce.
 * @evidence contracts/common.md#clear-and-simple-design Story-clock mapping is `autoMovieStoryTime` and sampling is `resolveProductionLighting`, both shared; this function owns only the merge rule, which is the one decision production shot assembly needs from the engine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every light is merged by the same id rule regardless of type or source; the unchanged pass-through for a missing lighting or pin is the stated additivity contract, not a special case for a fixture.
 * @evidence contracts/common.md#meaningful-documentation States both pass-through conditions, the story instant evaluated, the replace and append rules with their order, how it composes with `lightMotions`, the units of `seconds` and that light objects are shared rather than copied.
 * @evidence contracts/performance.md#efficient-algorithms Linear in staged lights plus production sources: one map and one set built once, then one lookup per staged light and one membership test per source, after the resolver's own pass over the production clips.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call resolves one instant of one production for one shot and coordinates no work across calls; the caller evaluates it once per shot.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The map and set are dropped on return; the caller owns the returned array, bounded by staged lights plus production sources.
 */
export const inheritProductionLighting = (props: {
  /** The production's declared sources, or `null` when it declares none. */
  lighting: IAutoMovieProductionLighting | null;

  /** The shot's scene lights, in staging order. */
  lights: readonly IAutoMovieLight[];

  /** Where the shot sits on the story clock, or `null` when it is unpinned. */
  pin: IAutoMovieShotStoryTime | null;

  /** The instant to evaluate, in shot-local seconds. */
  seconds: number;
}): IAutoMovieLight[] => {
  const { lighting, pin } = props;
  if (lighting === null || pin === null) return [...props.lights];

  const resolved: IAutoMovieLight[] = resolveProductionLighting({
    lighting,
    storySeconds: autoMovieStoryTime(pin, props.seconds),
  });
  const inherited: Map<string, IAutoMovieLight> = new Map(
    resolved.map((light: IAutoMovieLight): [string, IAutoMovieLight] => [
      light.id,
      light,
    ]),
  );
  const staged: Set<string> = new Set(
    props.lights.map((light: IAutoMovieLight): string => light.id),
  );
  return [
    ...props.lights.map(
      (light: IAutoMovieLight): IAutoMovieLight =>
        inherited.get(light.id) ?? light,
    ),
    ...resolved.filter((light: IAutoMovieLight): boolean => !staged.has(light.id)),
  ];
};

import {
  type IAutoMovieInheritProductionLighting,
  IAutoMovieLight,
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
 * The current production assembly caller evaluates this helper once at shot
 * time zero. The result is an opening snapshot, not a continuously resampled
 * production-light track; the shot's own lightMotions subsequently animate that
 * snapshot. Returned light objects are staged or resolved objects themselves,
 * not copies.
 */
export function inheritProductionLighting(
  props: IAutoMovieInheritProductionLighting.IProps,
): IAutoMovieLight[] {
  const { lighting, pin }: typeof props = props;
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
    ...resolved.filter(
      (light: IAutoMovieLight): boolean => !staged.has(light.id),
    ),
  ];
}

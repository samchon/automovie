import type {
  IAutoMovieMotionHumanBreath,
  IAutoMovieMotionHumanLayer,
} from "@automovie/interface";

import { HumanBreath } from "./HumanBreath";

/*
 * The breathing layer: the chest, the upper chest and the lumbar spine extend
 * and the shoulder girdles rise a little with each inhalation, by
 * HumanBreath.layer.
 * Parameter params: The rate and the exertion bouts; the defaults when absent.
 * Returns: The layer that breathes.
 */
export function expressionBreath(
  params: IAutoMovieMotionHumanBreath.IOptions = {},
): IAutoMovieMotionHumanLayer {
  return HumanBreath.layer(params);
}

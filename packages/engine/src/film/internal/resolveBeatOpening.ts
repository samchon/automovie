import {
  IAutoMovieBeatEndState,
  type IAutoMovieResolveBeatProps,
} from "@automovie/interface";

import { resolveBeatSnapshot } from "./resolveBeatSnapshot";

/**
 * Every scene actor at the shot's opening instant, `t = 0`, before any of its
 * motion has played: where each stands, faces and is coupled as the beat
 * begins.
 *
 * It has the shape of {@link resolveBeatEnd}'s state, so the gait phase, root
 * velocity and foot plants are the resumable fields at the opening. The
 * continuity check compares it with the previous beat's end state to catch a
 * cut that does not resume where that beat left off, a character who drifts or
 * a prop that disappears. `compileDefinedShot` returns it as the opening
 * continuity, overlaying a supplied previous beat's gait phase, root velocity,
 * foot plants and mount per actor.
 *
 * Throws on duplicated motion ids, performance nodes, mounts or plant entries,
 * and on a motion reference `props.motions` does not supply.
 *
 * @param props The compiled shot, its staged scene and motions, and the mount
 *   and plant facts to carry.
 * @returns One opening state per scene node, in scene order.
 */
export function resolveBeatOpening(
  props: IAutoMovieResolveBeatProps,
): IAutoMovieBeatEndState {
  return resolveBeatSnapshot(props, 0);
}

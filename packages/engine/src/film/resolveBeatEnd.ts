import {
  IAutoMovieBeatEndState,
  type IAutoMovieResolveBeatProps,
} from "@automovie/interface";

import { resolveBeatSnapshot } from "./resolveBeatSnapshot";

/**
 * The state a later beat resumes from: every scene actor at the exclusive end
 * of the compiled shot, `shot.duration` seconds in.
 *
 * Beyond where each actor stands and faces, the state is resumable: the gait
 * phase lets the next beat continue mid-stride, the root velocity lets it keep
 * momentum, the foot plants keep stance feet where they were (only when
 * `props.plants` carries the ground-IK output), and the mount binding keeps a
 * rider coupled without restating it. A prop the shot left in a hand or where a
 * throw landed ends at that baked transform, not at its staged spot.
 * `compileDefinedShot` returns it as the closing continuity, and
 * `validateFilmContinuity` compares it with the next beat's
 * {@link resolveBeatOpening}.
 *
 * Throws on duplicated motion ids, performance nodes, mounts or plant entries,
 * and on a motion reference `props.motions` does not supply.
 *
 * @param props The compiled shot, its staged scene and motions, and the mount
 *   and plant facts to carry.
 * @returns One end state per scene node, in scene order.
 */
export function resolveBeatEnd(
  props: IAutoMovieResolveBeatProps,
): IAutoMovieBeatEndState {
  return resolveBeatSnapshot(props, props.shot.duration);
}

import { IAutoMovieBeatEndState } from "@automovie/interface";

import { IResolveBeatProps } from "./IResolveBeatProps";
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
 *
 * @evidence contracts/common.md#principled-implementation Samples at shot-local zero through the shared `resolveBeatSnapshot`, the same rules as the end state, so comparing an opening with the previous end compares two measurements of one kind; a performance that starts later is held at its clip's first frame because its clip-local time clamps to zero.
 * @evidence contracts/common.md#clear-and-simple-design A named entry point that fixes the instant at zero, the mirror of `resolveBeatEnd`, so the sampling rules exist once and the two boundaries cannot disagree about how a state is read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no rule of its own and does not seed itself from a previous beat; the overlay of carried fields happens in `compileDefinedShot`, where the previous state is in hand.
 * @evidence contracts/common.md#meaningful-documentation States the instant, the shared shape and its resumable fields, what the continuity check compares it with, how `compileDefinedShot` overlays carried fields, and every throw.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Delegates the whole cost to `resolveBeatSnapshot`, which answers it; this wrapper passes a constant.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Computes one shot's opening state per call and caches nothing; `validateFilmContinuity` resolves each beat's opening once and pairs it with the previous beat's end, and `compileDefinedShot` stores its own copy on the compiled result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds nothing after returning; the opening states it hands back are owned as `resolveBeatSnapshot` describes.
 */
export const resolveBeatOpening = (
  props: IResolveBeatProps,
): IAutoMovieBeatEndState => resolveBeatSnapshot(props, 0);

import { IAutoMovieBeatEndState } from "@automovie/interface";

import { IResolveBeatProps } from "./IResolveBeatProps";
import { resolveBeatSnapshot } from "./resolveBeatSnapshot";

/**
 * The state a later beat resumes from: every scene actor at the exclusive end of the compiled shot, `shot.duration` seconds in.
 *
 * Beyond where each actor stands and faces, the state is resumable: the gait phase lets the next beat continue mid-stride, the root velocity lets it keep momentum, the foot plants keep stance feet where they were (only when `props.plants` carries the ground-IK output), and the mount binding keeps a rider coupled without restating it. A prop the shot left in a hand or where a throw landed ends at that baked transform, not at its staged spot. `compileDefinedShot` returns it as the closing continuity, and `validateFilmContinuity` compares it with the next beat's {@link resolveBeatOpening}.
 *
 * Throws on duplicated motion ids, performance nodes, mounts or plant entries, and on a motion reference `props.motions` does not supply.
 *
 * @param props The compiled shot, its staged scene and motions, and the mount and plant facts to carry.
 * @returns One end state per scene node, in scene order.
 *
 * @evidence contracts/common.md#principled-implementation Samples at `shot.duration`, the instant the cut leaves, through the shared `resolveBeatSnapshot`, so the end state is measured from the motions the shot plays rather than copied from the program that authored it.
 * @evidence contracts/common.md#clear-and-simple-design A named entry point that fixes the instant, so callers ask for the closing boundary by name and the sampling rules live once in `resolveBeatSnapshot`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no rule of its own; every actor goes through the same snapshot body the opening uses, so no actor, prop or caller is treated differently at the end.
 * @evidence contracts/common.md#meaningful-documentation States the instant, what makes the state resumable and when plants are present, where a baked prop ends, which callers read it and what it is compared with, and every throw.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Delegates the whole cost to `resolveBeatSnapshot`, which answers it; this wrapper adds one property read.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Computes one shot's closing state per call and caches nothing; `compileDefinedShot` stores it on the compiled result for the runtime to hand the next beat, and `validateFilmContinuity` resolves each beat's end once per check.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing beyond the returned state, whose ownership `resolveBeatSnapshot` answers.
 */
export function resolveBeatEnd (
  props: IResolveBeatProps,
): IAutoMovieBeatEndState { return resolveBeatSnapshot(props, props.shot.duration); }

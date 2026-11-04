import type { AutoMovieHumanRigControls } from "@automovie/human";
import type { MotionAction } from "../motion/core/MotionAction";

/**
 * One explicit writer of one anatomical arm on a separately realized body.
 * @evidence contracts/common.md#implementation-and-ownership A composition declares side ownership and source solver channels before merging. Duplicate sides, foreign controls, non-arm effectors and conflicting root/support requests refuse before output construction; a same-side foot cannot acquire arm ownership.
 * @evidence contracts/common.md#authoring-interface Only the named arm's pose, tasks and locks are authoritative; unowned body pose is ignored. Channels are the source's same eligible public paths. The host placement exclusively owns body pose and locks, while each writer must declare matching root orientation, translation and original support values.
 */
export interface LabArmWriter {
  /** Anatomical ownership, independent of camera and actor label. */
  side: MotionAction.Side;
  /** Independently sampled arm and its unchanged raw external task. */
  sample: MotionAction.Sample;
  /** Explicit same-source eligible channels; never inferred from another writer. */
  channels: readonly AutoMovieHumanRigControls.DegreeChannel[];
}

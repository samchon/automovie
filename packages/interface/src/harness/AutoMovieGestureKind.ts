import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * The closed set of gesture families a `gesture` action names.
 *
 * A closed set rather than a free string keeps parallel generations from
 * drifting between spellings such as "wave", "waving", and "hand-wave". The
 * action's `note` specialises within a family ("strike" with note "jab"), and
 * `custom` names a one-off.
 *
 * The set names both humanoid and creature families, because horses and cats
 * are rigged on the same {@link AutoMovieHumanoidBone} skeleton (spine as
 * barrel, limbs retargeted). The engine's reference synthesizer covers part of
 * it: `gestureMotion` plays fixed humanoid-bone keyframes on any rig for `bow`,
 * `nod`, `shake`, `crouch`, `kick`, `stagger`, `wave`, `celebrate`, `draw`,
 * `throw`, and `jump`; `point` and `strike` solve the right arm toward their
 * target only on a rig with arm geometry; and `guard`, `rear`, `buck`, `paw`,
 * and `custom` produce no motion unless a host supplies its own synthesizer.
 * `actionRegion` defaults `nod` and `shake` to `head`, `bow`, `crouch`, `kick`,
 * `stagger`, `jump`, and `draw` to `fullBody`, and every other kind to
 * `upperBody`. Hold preserves existing articulation and emote supplies facial expression; a stretch or tail flick that changes body joints needs authored enact motion or a host synthesizer.
 *
 * @evidence contracts/common.md#principled-implementation A closed string union converges parallel generations on one spelling per family, and the engine maps kinds to motion through explicit tables, `gestureMotion`'s generic set and `actionRegion`'s per-kind region defaults, so each kind's behavior is a lookup rather than a guess.
 * @evidence contracts/common.md#clear-and-simple-design Eighteen families with `note` for refinement and `custom` as the escape keep the vocabulary small enough to choose from while leaving variety to the free-text note the engine ignores.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Kinds the reference synthesizer cannot animate return no motion instead of borrowing another family's keyframes, and the documentation lists them so an author knows a host synthesizer must supply them.
 * @evidence contracts/common.md#meaningful-documentation States why the set is closed, how `note` and `custom` widen it, why creature families share the humanoid skeleton, exactly which kinds produce motion and under what condition, each kind's default region, and how to express an untargeted creature pose.
 * @author Samchon
 */
export type AutoMovieGestureKind =
  // humanoid
  | "strike"
  | "kick"
  | "guard"
  | "wave"
  | "bow"
  | "nod"
  | "shake"
  | "point"
  | "crouch"
  | "jump"
  | "stagger"
  | "draw"
  | "throw"
  | "celebrate"
  // creature (quadruped rig)
  | "rear"
  | "buck"
  | "paw"
  // escape
  | "custom";

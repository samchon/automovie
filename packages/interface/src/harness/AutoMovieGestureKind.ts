import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

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
 * `upperBody`. Hold preserves existing articulation and emote supplies facial
 * expression; a stretch or tail flick that changes body joints needs authored
 * enact motion or a host synthesizer.
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

import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * A closed set of **gesture families**. A closed enum (not a free string) is
 * deliberate: across many parallel generations, free names drift
 * ("wave"/"waving"/"hand-wave"); a fixed set converges. Use `note` to specialise
 * within a family ("strike" + note "jab"), or `custom` to describe a one-off.
 *
 * The set names **both humanoid and creature** families, because the project
 * rigs horses and cats on the same {@link AutoMovieHumanoidBone} skeleton (spine
 * = barrel, the limbs retargeted). The engine's reference synthesizer does not
 * cover every family yet: `gestureMotion` plays the same humanoid-bone
 * keyframes on any rig for `bow`, `nod`, `shake`, `crouch`, `kick`, `stagger`,
 * `wave`, `celebrate`, `draw`, `throw` and `jump`; `point` and `strike` need a
 * rig and a target resolving to a point; and `guard`, `rear`, `buck`, `paw` and
 * `custom` produce no motion unless a host supplies its own synthesizer. Idle
 * creature poses with no directed target (a cat's stretch/sit, a tail flick)
 * are a `hold` plus an `emote`.
 *
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

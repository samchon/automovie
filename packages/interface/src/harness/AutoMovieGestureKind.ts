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
 * @evidence contracts/common.md#principled-implementation A closed string-literal union, so parallel generations converge on one spelling per family and `note` carries the specialization; the reference synthesizer dispatches on the kind alone, with no per-rig variant of any family.
 * @evidence contracts/common.md#clear-and-simple-design One flat list commented as humanoid, creature and escape groups rather than per-species enums, because every actor shares the humanoid bone vocabulary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `guard`, `rear`, `buck`, `paw` and `custom` return `null` from the reference synthesizer, and `compilePerformance` skips a null clip without a violation, so such a gesture compiles successfully having performed nothing.
 * @evidence contracts/common.md#meaningful-documentation States why the set is closed, how `note` refines it, which kinds the reference synthesizer animates, which need a rig and target, and which currently produce no motion.
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

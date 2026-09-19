import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * A closed set of **gesture families** the engine has motion for. A closed enum
 * (not a free string) is deliberate: across many parallel generations, free
 * names drift ("wave"/"waving"/"hand-wave"); a fixed set converges. Use `note`
 * to specialise within a family ("strike" + note "jab"), or `custom` to
 * describe a one-off the engine should approximate.
 *
 * The set spans **both humanoid and creature** actors: the project rigs horses
 * and cats on the same {@link AutoMovieHumanoidBone} skeleton (spine = barrel,
 * the limbs retargeted), so the engine dispatches each kind to the actor's rig
 * vocabulary: `kick` is a leg snap on a fighter and a hind-leg lash on a horse;
 * `rear`/`buck`/`paw` only resolve on a quadruped rig. Idle creature poses with
 * no directed target (a cat's stretch/sit, a tail flick) are a `hold` plus an
 * `emote`, or a `custom` gesture.
 *
 * @evidence requirements/motion/object-motion-and-interaction.md#motion-object-authored-vocabulary Exposes `AutoMovieGestureKind` as the portable data boundary for the motion object authored vocabulary requirement.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `AutoMovieGestureKind` for the performance interaction attachment object handoff system contract.
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

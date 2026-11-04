/**
 * Explicit reproducible inputs for a single module exercise, independent of a film.
 *
 * @evidence contracts/common.md#implementation-and-ownership One typed record binds selectable technique, actor, timing and receiving relationship; seeded variation stays with the shared action implementation.
 * @evidence contracts/common.md#authoring-interface Distance is root separation in metres; timingScale multiplies each phase. Actor and limb selections are anatomical and independent of the camera.
 */
export interface LabSettings {
  /** Reusable action definition. */
  action: "jab" | "cross" | "hook" | "uppercut" | "low-kick" | "body-kick" | "high-kick" | "step" | "defense" | "one-two" | "blocked-one-two";
  /** Acting man; either can consume the same definition. */
  actor: "a" | "b";
  /** Selected limb; jab/cross determine stance lead consistently. */
  side: "left" | "right";
  /** Actual receiving surface or explicit evasion case. */
  target: "guard" | "body" | "head" | "leg" | "miss";
  /** Defending action definition. */
  defense: "cover" | "catch" | "parry" | "slip" | "weave" | "check" | "none";
  /** Root separation in metres. */
  distance: number;
  /** Deterministic unsigned seed. */
  seed: number;
  /** Bounded aim variation in metres. */
  aim: number;
  /** Relative phase-duration variation ceiling. */
  timingVariation: number;
  /** Multiplier of every source-specific phase duration. */
  timingScale: number;
  /** Actor-local sideways heading component, normalized by the action. */
  direction: number;
  /** Explicit supported entry before a strike; omission leaves it disabled. */
  entry?: boolean;
}

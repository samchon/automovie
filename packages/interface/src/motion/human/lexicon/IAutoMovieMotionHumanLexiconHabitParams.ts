import type { IAutoMovieMotionHumanWalkParams } from "../actions/IAutoMovieMotionHumanWalkParams";
import type { IAutoMovieMotionHumanHandToFace } from "../daily/IAutoMovieMotionHumanHandToFace";
import type { IAutoMovieMotionHumanGesture } from "../everyday/IAutoMovieMotionHumanGesture";
import type { IAutoMovieMotionHumanSeatedHeelBounce } from "../everyday/IAutoMovieMotionHumanSeatedHeelBounce";
import type { IAutoMovieMotionHumanTouch } from "../touch/IAutoMovieMotionHumanTouch";

/**
 * Open parameters of the habit lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before planning or resolving a row's fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The habit family is a closed export-name map. Each key uses the law contract directly or projects its open parameters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the habit row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconHabitParams {
  /** A draw on a cigarette: held at the lips for a puff's length, drawn by the seed between 1.6 and 2.1 s (#3346: mean puff durations of the Pennsylvania Adult Smoking Study and NCT04844762; a cigarette's dozen puffs, their intervals of 25 to 28 s and the decline of the puff over the cigarette are the composition's), the head level, between fingers that point up and back at the mouth with the palm toward the chin; its end stands 0.15 of a hand off the fingertips' pads (provisional). With `prop`, the held cigarette's `mouth` end meets the lips. */
  smoke: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task" | "seconds">;

  /** The walk under a screen read while walking (`handToFace({ task: "read" })` over it): the slow pace, 0.77 of the free walk's speed, inside the 20 to 40 per cent reduction #3338 states for texting walkers (Lamberg and Muratori 2012 report about a third; the band is provisional until the paper's table is read). The composition gives where to. */
  readingWalk: Omit<IAutoMovieMotionHumanWalkParams, "pace">;

  /**
   * A photograph through a camera's viewfinder, with the camera in hand: the
   * right hand took it up by its `grip` for this use (`pickUp` with `use: {
   * tip: "screen", line: "across", at: { region: "noseBridge" } }`), brings
   * its back to the bridge of the nose as that grasp presents it, and the
   * left hand takes its `support` end, the device archetype's compact camera
   * (`createDevice({ kind: "camera" })`) declaring all three. Without the
   * camera in hand the row is refused: no hand holds the attitude an implied
   * camera would ask at the eye. The camera's own points replace the
   * task's implied effector.
   */
  photograph: Omit<
    IAutoMovieMotionHumanHandToFace.IParams,
    "point" | "grasp" | "other" | "task"
  >;

  /** A look at a held screen, as a phone read at the reading distance. */
  checkPhone: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;

  /** A look at a wristwatch: the left wrist raised before the eyes at the reading distance (`handToFaceSheet.READING`), its back turned to them and the forearm across the body, the head bowed 20 degrees to it (provisional), held a second and a half (provisional). */
  checkWatch: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task" | "side">;

  /** Lipstick or balm drawn across the lips. */
  applyLipstick: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;

  /** A shave: the head of a held razor rubbed up the right jaw three times (`touch` with the held prop's working point). The composition names the razor (`prop`) taken up for its use, and its working point (`point`), the head; without a razor the palm's rub is mimed. */
  shave: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "kind" | "count" | "hold" | "tangent"
  >;

  /** A rub of tired eyes with the fingertips. */
  rubEyes: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;

  /** A scratch of the nape. */
  scratchNape: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "with" | "kind"
  >;

  /** Blowing the nose: the hand, as with a tissue, held over the nose with the head bowed a little (first pass; hold and bow provisional). */
  blowNose: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;

  /** Cream rubbed on the face with both palms, twice up the cheeks. */
  applyCream: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task" | "count">;

  /** Fanning oneself with a hand: six beats beside the face (first pass on the wave's stroke, provisional). */
  fanSelf: Omit<IAutoMovieMotionHumanGesture.IParams, "kind" | "count">;

  /** Smelling a held thing: brought under the nose and held, the head bowed to it (first pass; values provisional). */
  sniff: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;

  /** Flicking the hair back: the back of the hand stroked up the temple. */
  flickHair: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "target" | "with" | "kind" | "side"
  >;

  /** A selfie: a phone held out before the eyes at the reading distance, the elbow-bent convention of about 30 cm (#3346), the head level, held a second and a half (provisional). */
  selfie: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;

  /** Lighting a cigarette: a flame brought to the cigarette's end before the lips, the head bowed to it (first pass with one hand; the second, cupping hand is not placed). */
  lightCigarette: Omit<IAutoMovieMotionHumanHandToFace.IParams, "task">;

  /** Tapping the ash off a held cigarette: its lit end tapped twice on the place the composition gives, such as an ashtray's surface (`target`); the composition names the cigarette (`prop`). */
  ashTap: Omit<IAutoMovieMotionHumanTouch.IParams, "kind" | "count" | "point">;

  /** Stubbing a held cigarette out: its lit end pressed on the place the composition gives and held there (the twist of the stub is not moved yet); the composition names the cigarette (`prop`). */
  stubOut: Omit<IAutoMovieMotionHumanTouch.IParams, "kind" | "count" | "point">;

  /** Bounce the heel from a seated posture. */
  seatedHeelBounce: IAutoMovieMotionHumanSeatedHeelBounce;
}

import type { AutoMovieHumanController } from "@automovie/human/control";

import type { IAutoMovieHumanPose } from "../../../human/src/structures/pose/IAutoMovieHumanPose";

/**
 * Small authored Human motions in clinical degrees and seconds.
 *
 * These gestures target the existing Human pose evaluator before they become
 * reusable Three clips. Walking stays in place and sitting has no chair or
 * contact solver. They demonstrate character control, not measured gait,
 * balance, dynamics or collision response.
 *
 * @evidence contracts/common.md#principled-implementation Public Human pose fields describe neutral, alternating gait poses, a raised-hand wave and a seated transition; the existing skeleton evaluator owns axes and endpoint ROM clamping.
 * @evidence contracts/common.md#clear-and-simple-design Motion meaning and timing stay separate from geometry, Three playback and facial drawing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Degree targets are explicitly authored choreography, with no specimen selector, bone-name mapping, physics claim or world-vertex interpolation.
 * @evidence contracts/common.md#meaningful-documentation States clinical units, rest versus neutral, looping intent and the missing contact and dynamics guarantees.
 * @evidence contracts/performance.md#efficient-algorithms Five small motion definitions contain at most five keys each; construction performs fixed-size object assembly.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated key poses share their authored values; the controller compiles equal poses once within a motion preparation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The module owns only a fixed set of plain authoring records and no playback, geometry or native resources.
 */
export namespace HumanStickmanMotions {
  /** Stable semantic controls, independent from an avatar's visual sink.
   *
   * @evidence contracts/common.md#principled-implementation Names exactly the five authored example controls, independently of visual representation.
   * @evidence contracts/common.md#clear-and-simple-design A string union supplies semantic keys for the local example catalogue.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Names are choreography identifiers, not inferred gait or contact guarantees.
   * @evidence contracts/common.md#meaningful-documentation Documents stable control names and their independence from a drawing sink.
   * @evidence contracts/performance.md#efficient-algorithms The erased union selects no runtime algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work The same names index the fixed definitions consumed by controller construction.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The type retains no runtime state or resource.
   */
  export type Name = "rest" | "neutral" | "walk" | "wave" | "sit-stand";

  /** One existing public pose at a named time.
   *
   * @evidence contracts/common.md#principled-implementation Aliases the public controller's key record, whose local seconds accompany an existing clinical pose input.
   * @evidence contracts/common.md#clear-and-simple-design Reuses the controller key schema beside the example authoring values.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No alternative time unit, interpolation or clinical mapping is introduced.
   * @evidence contracts/common.md#meaningful-documentation Identifies a public pose at a named time; motion documentation distinguishes authored values from measured gait.
   * @evidence contracts/performance.md#efficient-algorithms The erased alias adds no key evaluation or allocation.
   * @evidence contracts/performance.md#reuse-equivalent-work The authoring and transport paths share the public key type.
   * @evidence contracts/performance.md#bound-retention-and-release-resources No key instance or playback resource is owned by the alias.
   */
  export type IKey = AutoMovieHumanController.IKey;

  /** Authored motion before compilation into an avatar's local transforms.
   *
   * @evidence contracts/common.md#principled-implementation Aliases the public controller's duration, loop and authored-key contract before body-specific compilation.
   * @evidence contracts/common.md#clear-and-simple-design The local name keeps example definitions compatible with the reusable transport.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias does not add a clock, contact solver or visual skeleton adapter.
   * @evidence contracts/common.md#meaningful-documentation States that definitions are authored input rather than compiled local transforms.
   * @evidence contracts/performance.md#efficient-algorithms The erased alias performs no compilation or sampling.
   * @evidence contracts/performance.md#reuse-equivalent-work Both example creation and facade preparation use the same public definition shape.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The type owns no clips or native resources; consumers own their definition snapshots.
   */
  export type IDefinition = AutoMovieHumanController.IDefinition;

  /** Anatomical neutral differs from the generated body's relaxed A-pose. */
  const neutral: IAutoMovieHumanPose = {
    arms: {
      left: {
        shoulder: { flexion: 0, abduction: 0, rotation: 0 },
        elbow: { flexion: 0 },
      },
      right: {
        shoulder: { flexion: 0, abduction: 0, rotation: 0 },
        elbow: { flexion: 0 },
      },
    },
    legs: {
      left: {
        hip: { flexion: 0, abduction: 0, rotation: 0 },
        knee: { flexion: 0 },
        ankle: { dorsiflexion: 0 },
      },
      right: {
        hip: { flexion: 0, abduction: 0, rotation: 0 },
        knee: { flexion: 0 },
        ankle: { dorsiflexion: 0 },
      },
    },
  };

  /** Alternating authored step with the opposite arm moving forward. */
  const leftStep: IAutoMovieHumanPose = {
    arms: {
      left: {
        shoulder: { flexion: -15, abduction: 0 },
        elbow: { flexion: 15 },
      },
      right: {
        shoulder: { flexion: 25, abduction: 0 },
        elbow: { flexion: 25 },
      },
    },
    legs: {
      left: {
        hip: { flexion: 30, abduction: 0 },
        knee: { flexion: 40 },
        ankle: { dorsiflexion: 5 },
      },
      right: {
        hip: { flexion: -12, abduction: 0 },
        knee: { flexion: 5 },
        ankle: { dorsiflexion: -5 },
      },
    },
  };

  /** Same step with the existing bilateral authoring fields exchanged. */
  const rightStep: IAutoMovieHumanPose = {
    arms: { left: leftStep.arms!.right, right: leftStep.arms!.left },
    legs: { left: leftStep.legs!.right, right: leftStep.legs!.left },
  };

  /** Raised left hand with one wrist direction. */
  const waveOut: IAutoMovieHumanPose = {
    ...neutral,
    arms: {
      ...neutral.arms!,
      left: {
        shoulder: { flexion: 25, abduction: 100 },
        elbow: { flexion: 90 },
        wrist: { radialDeviation: 15 },
      },
    },
  };

  /** Opposite wrist direction preserves the raised arm's authored support. */
  const waveIn: IAutoMovieHumanPose = {
    ...waveOut,
    arms: {
      ...waveOut.arms!,
      left: { ...waveOut.arms!.left, wrist: { radialDeviation: -20 } },
    },
  };

  /** Seated joint angles; the controller derives key root height from the ankle centres. */
  const seated: IAutoMovieHumanPose = {
    ...neutral,
    legs: {
      left: {
        hip: { flexion: 90, abduction: 0 },
        knee: { flexion: 90 },
        ankle: { dorsiflexion: 0 },
      },
      right: {
        hip: { flexion: 90, abduction: 0 },
        knee: { flexion: 90 },
        ankle: { dorsiflexion: 0 },
      },
    },
    arms: {
      left: { shoulder: { flexion: 35, abduction: 0 }, elbow: { flexion: 30 } },
      right: {
        shoulder: { flexion: 35, abduction: 0 },
        elbow: { flexion: 30 },
      },
    },
  };

  /** Private example choreography; callers receive a fresh owned snapshot. */
  const definitions: Readonly<Record<Name, IDefinition>> = {
    rest: {
      duration: 1,
      loop: true,
      alignAnkles: false,
      keys: [
        { time: 0, pose: {} },
        { time: 1, pose: {} },
      ],
    },
    neutral: {
      duration: 1,
      loop: true,
      alignAnkles: false,
      keys: [
        { time: 0, pose: neutral },
        { time: 1, pose: neutral },
      ],
    },
    walk: {
      duration: 1.2,
      loop: true,
      alignAnkles: false,
      keys: [
        { time: 0, pose: leftStep },
        { time: 0.3, pose: neutral },
        { time: 0.6, pose: rightStep },
        { time: 0.9, pose: neutral },
        { time: 1.2, pose: leftStep },
      ],
    },
    wave: {
      duration: 3,
      loop: false,
      alignAnkles: false,
      keys: [
        { time: 0, pose: neutral },
        { time: 0.7, pose: waveOut },
        { time: 1.3, pose: waveIn },
        { time: 1.9, pose: waveOut },
        { time: 3, pose: neutral },
      ],
    },
    "sit-stand": {
      duration: 4,
      loop: false,
      alignAnkles: true,
      keys: [
        { time: 0, pose: neutral },
        { time: 1.5, pose: seated },
        { time: 2.5, pose: seated },
        { time: 4, pose: neutral },
      ],
    },
  };

  /** Return independent example authoring data; no module-owned pose or duration escapes.
   *
   * @evidence contracts/common.md#principled-implementation Returns a structured clone of the five existing clinical-degree and second-based authoring records.
   * @evidence contracts/common.md#clear-and-simple-design One factory supplies independent example inputs without coupling the catalogue to geometry or playback.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It preserves authored timings and targets and makes no measured gait, balance or contact claim.
   * @evidence contracts/common.md#meaningful-documentation Fresh definitions permit caller edits without mutating subsequent example construction.
   * @evidence contracts/performance.md#efficient-algorithms Clones the fixed catalogue, whose five motions contain at most five keys each; cost scales with their pose fields.
   * @evidence contracts/performance.md#reuse-equivalent-work Source authoring records remain shared internally while each returned mutable graph is independent.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned plain graph escapes; no animation player, callback, GPU object or cache is acquired.
   */
  export function create(): Record<Name, IDefinition> {
    return structuredClone(definitions);
  }
}

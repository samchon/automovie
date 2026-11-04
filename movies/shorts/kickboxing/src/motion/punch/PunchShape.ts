import {
  AutoMovieHumanRigControls,
  type IAutoMovieHumanPose,
} from "@automovie/human";

/**
 * Clinical intent for a punch, separate from its target path and interaction.
 *
 * @evidence contracts/common.md#implementation-and-ownership IBA coaching plates 34,42,43,47,52 establish free-hand protection, shoulder/trunk participation, compact bent-arm hook/uppercut and supported leg drive. Degrees below are editable staging choices within Human controls, not measurements from those drawings. The actual consumer must solve and inspect hand targets, support and full-limb clearance.
 * @evidence contracts/common.md#authoring-interface Uses Human clinical degrees and own anatomical sides. Preparation and drive are closed-unit weights; amplitude in (0,2) scales the trunk/pelvis turn while leaving protective arm angles unchanged. The supplied guard is copied; the other arm remains in that guard. No film time, opponent identity or geometry is retained.
 */
export namespace PunchShape {
  /**
   * One reusable technique family; hook denotes a compact bent-arm hook.
   *
   * @evidence contracts/common.md#implementation-and-ownership Closed technique names select clinical shapes from the actually inspected IBA coaching plates. They carry no actor identity or movie timeline.
   * @evidence contracts/common.md#authoring-interface Hook and uppercut allow either anatomical hand; jab/cross lead/rear admission belongs to PunchAction.
   */
  export type Kind = "jab" | "cross" | "hook" | "uppercut";

  /**
   * Minimum elbow flexion for each authored delivery family, in clinical degrees.
   *
   * @evidence contracts/common.md#implementation-and-ownership Straight punches retain a12degree extension margin; IBA47's near-right-angle hook and IBA52's bent uppercut inform88/82degree compact staging choices. These are distinct technique controls, not measured universal joint angles.
   * @evidence contracts/common.md#authoring-interface Reach calculations and pose seeds consume this same owner. A closer target can require more flexion, while an unreachable target never forces a compact punch to extend into a straight.
   */
  export function extension(kind: Kind): number {
    return kind === "hook" ? 88 : kind === "uppercut" ? 82 : 12;
  }

  /**
   * Couple the attacking arm with scapula, trunk, pelvis and available knees.
   *
   * @evidence contracts/common.md#implementation-and-ownership Rotation mirrors by anatomical side; rear-side delivery requests more pelvis turn. Preparation and drive blend from the borrowed guard. These shoulder angles are a clinical seed, not proof of the family plane. After support realization PunchArm fits the independent pad with hard bend and smoothly phase-weighted actual elbow-plane inequalities, then independently admits shape, wrist and guard. Moving entry articulation retains fingers and wrist. Body support remains independently admitted.
   * @evidence contracts/common.md#authoring-interface Weights are finite in [0,1] and amplitude in (0,2). Returned pose owns its values and contains no root translation. The host realizes body/support first; normal Human shoulder rhythm remains active during arm adaptation. Neither these staging degrees nor a smooth blend certify physical feasibility.
   */
  export function sample(
    kind: Kind,
    side: "left" | "right",
    leadSide: "left" | "right",
    guard: IAutoMovieHumanPose,
    preparation: number,
    drive: number,
    amplitude: number = 1,
  ): IAutoMovieHumanPose {
    if (
      ![preparation, drive].every(
        (value: number): boolean =>
          Number.isFinite(value) && value >= 0 && value <= 1,
      )
    )
      throw new Error("Punch shape requires closed-unit preparation and drive");
    if (!Number.isFinite(amplitude) || amplitude <= 0 || amplitude >= 2)
      throw new Error(
        "Punch articulation scale must be finite and inside (0,2)",
      );
    const sign: number = side === "left" ? -1 : 1;
    const rear: boolean = side !== leadSide;
    const ready: IAutoMovieHumanPose = structuredClone(guard);
    ready.pelvis = {
      ...ready.pelvis,
      rotation: (guard.pelvis?.rotation ?? 0) - sign * (rear ? 5 : 2),
    };
    ready.legs ??= { left: {}, right: {} };
    ready.legs[side] = {
      ...ready.legs[side],
      knee: {
        ...ready.legs[side].knee,
        flexion:
          (guard.legs?.[side].knee?.flexion ?? 12) +
          (kind === "uppercut" ? 10 : 3),
      },
    };
    const prepared: IAutoMovieHumanPose = AutoMovieHumanRigControls.blend(
      guard,
      ready,
      preparation,
    );
    const target: IAutoMovieHumanPose = structuredClone(guard);
    const turn: number =
      kind === "jab" ? 8 : kind === "cross" ? 22 : kind === "hook" ? 25 : 18;
    target.pelvis = {
      ...target.pelvis,
      rotation: (guard.pelvis?.rotation ?? 0) + sign * turn * amplitude,
    };
    target.spine = {
      ...target.spine,
      thoracic: {
        ...target.spine?.thoracic,
        rotation: sign * (kind === "jab" ? 10 : 20) * amplitude,
        flexion: kind === "uppercut" ? 2 : 7,
      },
      lumbar: {
        ...target.spine?.lumbar,
        rotation: sign * 5,
        flexion: kind === "uppercut" ? 0 : 3,
      },
    };
    target.neck = {
      ...target.neck,
      atlantoAxial: { rotation: -sign * Math.min(20, turn) },
      atlantoOccipital: { flexion: 5 },
    };
    target.arms ??= { left: {}, right: {} };
    target.arms[side] = {
      ...target.arms[side],
      shoulderGirdle: {
        elevation: kind === "uppercut" ? 2 : 5,
        upwardRotation: kind === "hook" ? 20 : 12,
        protraction: kind === "jab" || kind === "cross" ? 12 : 7,
      },
      shoulder: {
        flexion: kind === "uppercut" ? 60 : 88,
        abduction: kind === "hook" ? 42 : kind === "uppercut" ? 8 : 3,
        rotation: kind === "hook" ? 20 : 0,
      },
      elbow: { flexion: extension(kind) },
      forearm: { pronation: kind === "uppercut" ? -35 : 65 },
      wrist: { flexion: 0, radialDeviation: 0 },
      hand: {
        thumb: {
          cmcFlexion: 12,
          cmcAbduction: 10,
          cmcOpposition: 35,
          mcpFlexion: 35,
          ipFlexion: 35,
        },
        index: { mcpFlexion: 70, pipFlexion: 85, dipFlexion: 55 },
        middle: { mcpFlexion: 75, pipFlexion: 85, dipFlexion: 55 },
        ring: { mcpFlexion: 75, pipFlexion: 85, dipFlexion: 55 },
        little: { mcpFlexion: 75, pipFlexion: 85, dipFlexion: 55 },
      },
    };
    target.legs ??= { left: {}, right: {} };
    target.legs[leadSide] = {
      ...target.legs[leadSide],
      knee: {
        ...target.legs[leadSide].knee,
        flexion:
          (guard.legs?.[leadSide].knee?.flexion ?? 12) +
          (kind === "uppercut" ? 3 : 5),
      },
    };
    if (kind !== "jab")
      target.legs[side] = {
        ...target.legs[side],
        hip: { ...target.legs[side].hip, rotation: sign * 8 },
        knee: {
          ...target.legs[side].knee,
          flexion: (guard.legs?.[side].knee?.flexion ?? 12) + (rear ? -3 : 3),
        },
        ankle: {
          ...target.legs[side].ankle,
          dorsiflexion: (guard.legs?.[side].ankle?.dorsiflexion ?? 0) - 7,
        },
      };
    return AutoMovieHumanRigControls.blend(prepared, target, drive);
  }
}

import type {
  IAutoMovieMotionHumanCollapse,
  IAutoMovieMotionHumanJoints,
} from "@automovie/interface";

/**
 * The trunk lean and clinical joint angles of a collapse at its sag, drop
 * and lay shares, degrees. The angles are provisional stage readings in the
 * knockdown's convention (`KnockdownFloor`): a positive pitch leans the
 * trunk forward, a positive roll toward the body's right, flexion raises a
 * limb forward. A forward fall kneels, then pitches nearly prone with the
 * hips and knees opening; a sideways fall kneels, then rolls onto one hip
 * and shoulder; an in-place collapse folds the knees and hips fully with the
 * trunk over them. A protective body raises its arms toward the floor ahead
 * of its trunk, a limp one keeps them at its sides with the head following
 * the trunk.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the convention, each direction's fold and each tone's arms.
 * @evidence contracts/development/design.md#principled-representation A closed-form map from three shares in [0, 1] to angles in degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The fold type, the hand share and the evaluator `collapse` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The angles are named provisional readings; the floor height is solved by the caller, never written here.
 */
export namespace CollapseFold {
  /**
   * One evaluated fold.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each member and its unit.
   * @evidence contracts/development/design.md#principled-representation Degrees in the knockdown's convention.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `collapse`'s lean, joints and floor primitives.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every member is always present.
   */
  export interface IFold {
    /** Trunk pitch, degrees; positive forward. */
    pitch: number;

    /** Trunk roll, degrees; positive toward the body's right. */
    roll: number;

    /** Clinical angle triples, degrees by bone. */
    joints: IAutoMovieMotionHumanJoints.Angles;
  }

  /** The share of the lay at which a protective body's hands reach the floor, before its trunk: provisional. */
  export const HANDS: number = 0.6;

  /**
   * Evaluate a collapse's fold.
   *
   * @param direction Where the body goes down; not `backward`, which the knockdown owns.
   * @param tone How the body meets the floor.
   * @param side A sideways fall's side.
   * @param sag The sag's share.
   * @param drop The drop onto the knees' share.
   * @param lay The lay onto the floor's share.
   * @param fittedKnee The forward lie's knee angle fitted to this body's
   *   distal and trunk support geometry, when requested.
   * @returns The fold.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Linear blends of each direction's knee, trunk and lying angles by the shares, the profiles' minimum-jerk shape coming from the caller's clock.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per direction, then the tone's arms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The named provisional angles remain with the fold. A supplied terminal knee comes from the person's physical support fit.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant arithmetic.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure evaluator with nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    direction: Exclude<IAutoMovieMotionHumanCollapse.Direction, "backward">,
    tone: IAutoMovieMotionHumanCollapse.Tone,
    side: "left" | "right",
    sag: number,
    drop: number,
    lay: number,
    fittedKnee?: number,
  ): IFold {
    const soft: number = SAG.knee * sag * (1 - drop);
    const sway: number = SAG.pitch * sag * (1 - drop);
    const held: number = drop * (1 - lay);
    const toward: number = side === "left" ? -1 : 1;
    const shape: IShape = SHAPES[direction];
    const hip: number = shape.hip * held + shape.lyingHip * lay;
    const knee: number =
      soft + shape.knee * held + (fittedKnee ?? shape.lyingKnee) * lay;
    const pitch: number = sway + shape.pitch * drop + shape.lyingPitch * lay;
    const roll: number = toward * shape.roll * lay;
    const protective: boolean = tone === "protective";

    // A protective arm reaches the floor first, then bends to let the trunk
    // down; sideways only the arm on the fall's side braces.
    const giving: number = Math.max(0, (lay - HANDS) / (1 - HANDS));
    const bracing = (
      arm: "left" | "right",
    ): readonly [number, number, number] =>
      protective && (direction !== "sideways" || arm === side)
        ? [
            // As far forward as the trunk pitches, so the arm points down to
            // the floor, then swept back along the trunk as the elbow gives.
            direction === "sideways"
              ? ARMS.reach * drop * 0.5 * (1 - giving)
              : pitch + ARMS.ahead - ARMS.sweep * giving,
            direction === "sideways"
              ? ARMS.brace * drop * (1 - giving) + ARMS.open * giving
              : ARMS.open,
            ARMS.elbow + (ARMS.yield - ARMS.elbow) * giving,
          ]
        : [ARMS.limp, ARMS.open, ARMS.limpElbow];
    const [leftArm, leftOpen, leftElbow] = bracing("left");
    const [rightArm, rightOpen, rightElbow] = bracing("right");
    const neck: number = protective ? -ARMS.neck * lay : 0;
    return {
      pitch,
      roll,
      joints: {
        neck: [neck, 0, 0],
        leftUpperLeg: [hip, 5, 0],
        rightUpperLeg: [hip, 5, 0],
        leftLowerLeg: [knee, 0, 0],
        rightLowerLeg: [knee, 0, 0],
        leftUpperArm: [leftArm, leftOpen, 0],
        rightUpperArm: [rightArm, rightOpen, 0],
        leftLowerArm: [leftElbow, 0, 0],
        rightLowerArm: [rightElbow, 0, 0],
      },
    };
  }

  /** One direction's kneeling and lying angles, degrees. */
  interface IShape {
    /** Hip flexion on the knees. */
    hip: number;
    /** Knee flexion on the knees. */
    knee: number;
    /** Trunk pitch reached by the drop. */
    pitch: number;
    /** Hip flexion lying. */
    lyingHip: number;
    /** Knee flexion lying. */
    lyingKnee: number;
    /** Trunk pitch added by the lay. */
    lyingPitch: number;
    /** Trunk roll reached by the lay toward the fall's side. */
    roll: number;
  }

  /** Each direction's angles, degrees (provisional stage readings). */
  const SHAPES: Readonly<
    Record<Exclude<IAutoMovieMotionHumanCollapse.Direction, "backward">, IShape>
  > = {
    forward: {
      hip: 70,
      knee: 105,
      pitch: 15,
      lyingHip: 5,
      lyingKnee: 10,
      lyingPitch: 75,
      roll: 0,
    },
    sideways: {
      hip: 60,
      knee: 95,
      pitch: 10,
      lyingHip: 10,
      lyingKnee: 15,
      lyingPitch: 0,
      roll: 92,
    },
    inPlace: {
      hip: 95,
      knee: 130,
      pitch: 30,
      lyingHip: 110,
      lyingKnee: 140,
      lyingPitch: 25,
      roll: 0,
    },
  };

  /** The sag's knee softening and trunk sway, degrees (provisional). */
  const SAG: Readonly<{ knee: number; pitch: number }> = { knee: 15, pitch: 4 };

  /** The arms of each tone, degrees (provisional): a protective reach toward the floor and its brace, a limp arm hanging. */
  const ARMS: Readonly<{
    reach: number;
    ahead: number;
    sweep: number;
    yield: number;
    brace: number;
    open: number;
    elbow: number;
    limp: number;
    limpElbow: number;
    neck: number;
  }> = {
    reach: 100,
    ahead: 0,
    sweep: 90,
    yield: 10,
    brace: 50,
    open: 10,
    elbow: 15,
    limp: 5,
    limpElbow: 10,
    neck: 30,
  };
}

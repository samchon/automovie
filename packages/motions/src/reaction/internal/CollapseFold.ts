import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanCollapse,
  IAutoMovieMotionHumanJoints,
} from "@automovie/interface";
import * as CollapseFoldData from "./CollapseFoldData";

/*
 * Evaluate a collapse's fold.
 * Parameter direction: Where the body goes down; not `backward`, which the
 * knockdown owns.
 * Parameter tone: How the body meets the floor.
 * Parameter side: A sideways fall's side.
 * Parameter sag: The sag's share.
 * Parameter drop: The drop onto the knees' share.
 * Parameter lay: The lay onto the floor's share.
 * Returns: The fold.
 */
export function CollapseFold(
  direction: Exclude<IAutoMovieMotionHumanCollapse.Direction, "backward">,
  tone: IAutoMovieMotionHumanCollapse.Tone,
  side: AutoMovieHumanSide,
  sag: number,
  drop: number,
  lay: number,
): CollapseFold.IFold {
  const soft: number = CollapseFoldData.SAG.knee * sag * (1 - drop);
  const sway: number = CollapseFoldData.SAG.pitch * sag * (1 - drop);
  const held: number = drop * (1 - lay);
  const toward: number = side === "left" ? -1 : 1;
  const shape: CollapseFoldData.IShape = CollapseFoldData.SHAPES[direction];
  const hip: number = shape.hip * held + shape.lyingHip * lay;
  const knee: number = soft + shape.knee * held + shape.lyingKnee * lay;
  const pitch: number = sway + shape.pitch * drop + shape.lyingPitch * lay;
  const roll: number = toward * shape.roll * lay;
  const protective: boolean = tone === "protective";

  // A protective arm reaches the floor first, then bends to let the trunk
  // down; sideways only the arm on the fall's side braces.
  const giving: number = Math.max(
    0,
    (lay - CollapseFold.HANDS) / (1 - CollapseFold.HANDS),
  );
  const bracing = (
    arm: AutoMovieHumanSide,
  ): readonly [number, number, number] =>
    protective && (direction !== "sideways" || arm === side)
      ? [
          // As far forward as the trunk pitches, so the arm points down to
          // the floor, then swept back along the trunk as the elbow gives.
          direction === "sideways"
            ? CollapseFoldData.ARMS.reach * drop * 0.5 * (1 - giving)
            : pitch + CollapseFoldData.ARMS.ahead - CollapseFoldData.ARMS.sweep * giving,
          direction === "sideways"
            ? CollapseFoldData.ARMS.brace * drop * (1 - giving) + CollapseFoldData.ARMS.open * giving
            : CollapseFoldData.ARMS.open,
          CollapseFoldData.ARMS.elbow + (CollapseFoldData.ARMS.yield - CollapseFoldData.ARMS.elbow) * giving,
        ]
      : [CollapseFoldData.ARMS.limp, CollapseFoldData.ARMS.open, CollapseFoldData.ARMS.limpElbow];
  const [leftArm, leftOpen, leftElbow] = bracing("left");
  const [rightArm, rightOpen, rightElbow] = bracing("right");
  const neck: number = protective ? -CollapseFoldData.ARMS.neck * lay : 0;
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

/*
 * The trunk lean and clinical joint angles of a collapse at its sag, drop and
 * lay shares, degrees. The angles are provisional stage readings in the
 * knockdown's convention (`KnockdownFloor`): a positive pitch leans the trunk
 * forward, a positive roll toward the body's right, flexion raises a limb
 * forward. A forward fall kneels, then pitches nearly prone with the hips and
 * knees opening; a sideways fall kneels, then rolls onto one hip and shoulder;
 * an in-place collapse folds the knees and hips fully with the trunk over them.
 * A protective body raises its arms toward the floor ahead of its trunk, a limp
 * one keeps them at its sides with the head following the trunk.
 */
export namespace CollapseFold {
  /*
   * One evaluated fold.
   */
  export interface IFold {
    /*
     * Trunk pitch, degrees; positive forward.
     */
    pitch: number;

    /*
     * Trunk roll, degrees; positive toward the body's right.
     */
    roll: number;

    /*
     * Clinical angle triples, degrees by bone.
     */
    joints: IAutoMovieMotionHumanJoints.Angles;
  }

  /*
   * The share of the lay at which a protective body's hands reach the floor,
   * before its trunk: provisional.
   */
  export const HANDS: number = 0.6;
}

import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { stand } from "./stand";

/**
 * The jump's relaxed hands, upright trunk and arm swing at their authored
 * flexions. Push, flight and their endpoint readers use this same table. The
 * prepare companion binds the unchanged relaxed/upright prefix for repeated
 * push and landing samples without retaining a sampled posture.
 *
 * @param body The actual body whose resting fingers and arm separation are
 *   read.
 * @param upright The jump's upright clinical joints.
 * @param left The left shoulder flexion, degrees.
 * @param right The right shoulder flexion, degrees.
 * @returns A fresh clinical joint record and arm tuples.
 */
export function jumpJoints(
  body: IAutoMovieMotionHumanBody,
  upright: IAutoMovieMotionHumanPosture["joints"],
  left: number,
  right: number,
): IAutoMovieMotionHumanPosture["joints"] {
  const abduction: number = stand.abduction(body);
  return write({ ...stand.relaxed(body), ...upright }, abduction, left, right);
}

/** Fixed-prefix companion of the same jump joint-table owner. */
export namespace jumpJoints {
  /**
   * The shoulders' flexion at take-off, degrees: the arm swing that adds to
   * take-off velocity (Ashby and Heegaard 2002, J. Biomech. 35).
   */
  export const TAKEOFF: number = 60;

  /**
   * The shoulders' flexion at touchdown, degrees, lowering to the stand through
   * the landing (provisional).
   */
  export const LANDING: number = 30;

  /**
   * Degrees of shoulder flexion per degree of elbow flexion the swinging arm
   * adds to the relaxed elbow (provisional).
   */
  export const SHOULDER_PER_ELBOW: number = 3;

  /**
   * Bind the jump's unchanged relaxed/upright joint prefix for arm samples. The
   * caller keeps this body's relaxed posture and upright table unchanged until
   * it releases the returned writer.
   *
   * @param body The actual fixed body owning relaxed hands and arm separation.
   * @param upright The unchanged upright clinical table.
   * @returns A reader of left/right shoulder flexions in degrees, returning a
   *   fresh table and four fresh arm tuples with the original borrowed
   *   unchanged joint tuples.
   *
   *   Abduction and the merged relaxed/upright prefix prepare once in original
   *   precedence. Each query copies all J prefix members and shares the cold
   *   writer's four original shoulder/elbow assignments, retaining fresh arm
   *   tuples and ordinary borrowed unchanged clinical tuples. Speedup is
   *   unmeasured; only the two-table merge and fixed stand lookups are shared.
   *
   *   Changing the fixed body/upright inputs requires new preparation. The caller
   *   releases one bounded prefix record and one scalar with its plan; no
   *   clinical range, rate, goal, sample result, workspace, loan, time history
   *   or external handle is replaced or retained by this reader.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    upright: IAutoMovieMotionHumanPosture["joints"],
  ): (left: number, right: number) => IAutoMovieMotionHumanPosture["joints"] {
    const abduction: number = stand.abduction(body);
    const prefix: IAutoMovieMotionHumanPosture["joints"] = {
      ...stand.relaxed(body),
      ...upright,
    };
    return (
      left: number,
      right: number,
    ): IAutoMovieMotionHumanPosture["joints"] =>
      write({ ...prefix }, abduction, left, right);
  }
}

/**
 * Fill only the original four arm entries of a caller-owned fresh table, in
 * their original order.
 */
function write(
  joints: IAutoMovieMotionHumanPosture["joints"],
  abduction: number,
  left: number,
  right: number,
): IAutoMovieMotionHumanPosture["joints"] {
  joints.leftUpperArm = [left, abduction, 0];
  joints.rightUpperArm = [right, abduction, 0];
  joints.leftLowerArm = [
    stand.ELBOW + left / jumpJoints.SHOULDER_PER_ELBOW,
    0,
    0,
  ];
  joints.rightLowerArm = [
    stand.ELBOW + right / jumpJoints.SHOULDER_PER_ELBOW,
    0,
    0,
  ];
  return joints;
}

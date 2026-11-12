import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanTrunk } from "./HumanTrunk";
import type { rest } from "./rest";

/**
 * Both crossed-arms goals on upper arms set before the goals: each hangs
 * forward by `FLEXION` or, if more, until its elbow stands the forearm's
 * radius ahead of the sternum, so the forearms clear the chest; the elbows
 * then draw in, both alike, until each palm (laid on the front of the other
 * upper arm three quarters of the way to its elbow, fingers round its
 * outside) leaves its wrist one forearm from its own elbow, found by
 * bisection since drawing in brings the wrists nearer. The elbow hint is the
 * elbow itself, which then lies on the arm's solution circle, so the solved
 * upper arms are the ones the palms were laid on. Elbows that cannot draw in
 * far enough, or need not draw in at all, keep the nearest feasible width.
 *
 * @param body The body.
 * @param posture The standing posture.
 * @returns Both goals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the upper arms are set, where each palm lies and how the elbows' width is found.
 * @evidence contracts/development/implementation.md#principled-implementation Each arm's goal lies on the other arm's surface, so both upper arms are fixed first and the one free width is solved for the forearm's length.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One elbow placement, one palm goal and one bisection of the width.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An infeasible width keeps the nearest feasible one, as stated; the least flexion is named provisional.
 * @evidence contracts/development/implementation.md#efficient-algorithms A 30-step bisection of closed-form goals after one posture solve; run once per plan.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanTrunk.region` for the sternum and `HumanHand` for the palm's place and turn.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function restCrossedArms(
  body: IHumanBody,
  posture: IHumanPosture,
): Record<HumanHand.Side, rest.IGoal> {
  const frame: HumanFrame.IFrame = { origin: posture.root, yaw: posture.yaw };
  const turn = (local: IAutoMovieVector3): IAutoMovieVector3 =>
    HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw }, local);
  const bones = poseBones(body, resolveHumanPosture(body, posture));
  const length = (
    side: HumanHand.Side,
    from: "UpperArm" | "LowerArm",
    to: "LowerArm" | "Hand",
  ): number =>
    Vector3.length(
      Vector3.subtract(
        body.rest.get(`${side}${to}`)!,
        body.rest.get(`${side}${from}`)!,
      ),
    );
  const shoulder = (side: HumanHand.Side): IAutoMovieVector3 =>
    HumanFrame.local(frame, bones.get(`${side}UpperArm`)!.worldPosition);
  const sternum: IAutoMovieVector3 = HumanFrame.local(
    frame,
    HumanTrunk.region(body, posture, "sternum").point,
  );
  const elbowAt = (side: HumanHand.Side, inward: number): IAutoMovieVector3 => {
    const s: IAutoMovieVector3 = shoulder(side);
    const upper: number = length(side, "UpperArm", "LowerArm");
    const ahead: number = Math.min(
      0.9 * upper,
      Math.max(
        upper * Math.sin((restCrossedArms.FLEXION * Math.PI) / 180),
        sternum.z + body.measure.forearmRadius - s.z,
      ),
    );
    const across: number = Math.min(
      inward,
      Math.sqrt(upper * upper - ahead * ahead),
    );
    const down: number = Math.sqrt(
      Math.max(0, upper * upper - ahead * ahead - across * across),
    );
    return HumanFrame.point(frame, {
      x: s.x - (side === "left" ? 1 : -1) * across,
      y: s.y - down,
      z: s.z + ahead,
    });
  };
  const goal = (
    side: HumanHand.Side,
    inward: number,
  ): { goal: rest.IGoal; excess: number } => {
    const other: HumanHand.Side = side === "left" ? "right" : "left";
    const from: IAutoMovieVector3 = HumanFrame.point(frame, shoulder(other));
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(elbowAt(other, inward), from),
    );
    const ahead: IAutoMovieVector3 = turn({ x: 0, y: 0, z: 1 });
    const front: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(ahead, Vector3.scale(axis, Vector3.dot(ahead, axis))),
    );
    const point: IAutoMovieVector3 = Vector3.add(
      Vector3.add(
        from,
        Vector3.scale(axis, 0.75 * length(other, "UpperArm", "LowerArm")),
      ),
      Vector3.scale(front, body.measure.upperArmRadius),
    );
    const rotation: IAutoMovieQuaternion = HumanHand.rotation(side, {
      fingers: turn({ x: other === "left" ? 1 : -1, y: 0, z: 0 }),
      palm: Vector3.scale(front, -1),
    });
    const elbow: IAutoMovieVector3 = elbowAt(side, inward);
    const wrist: IAutoMovieVector3 = HumanHand.place(
      body,
      side,
      "palm",
      point,
      rotation,
      "relaxed",
    ).point;
    return {
      goal: { surface: "palm", shape: "relaxed", point, rotation, elbow },
      excess:
        Vector3.length(Vector3.subtract(wrist, elbow)) -
        length(side, "LowerArm", "Hand"),
    };
  };
  const excess = (inward: number): number =>
    (goal("left", inward).excess + goal("right", inward).excess) / 2;
  let lo: number = 0;
  let hi: number = Math.abs(shoulder("left").x - shoulder("right").x) / 2;
  if (excess(lo) <= 0) hi = lo;
  else if (excess(hi) > 0) lo = hi;
  for (let i: number = 0; i < 30 && hi - lo > 1e-5; i++) {
    const mid: number = (lo + hi) / 2;
    if (excess(mid) > 0) lo = mid;
    else hi = mid;
  }
  return { left: goal("left", hi).goal, right: goal("right", hi).goal };
}

/**
 * Companion values of {@link restCrossedArms}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the constant's unit and that it is provisional.
 * @evidence contracts/development/design.md#principled-representation One named angle in clinical degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one value the function reads and a caller may cite.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A named constant, not a literal inside the solve.
 */
export namespace restCrossedArms {
  /** The least forward hang of each upper arm when the arms are crossed, degrees (provisional). */
  export const FLEXION: number = 20;
}

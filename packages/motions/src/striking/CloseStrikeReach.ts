import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCloseStrike,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { StrikingBody } from "./StrikingBody";
import { StrikingStance } from "./StrikingStance";

/**
 * Where a close strike's effector lands and what carries it there: the
 * elbow joint on the target with the forearm folded behind it, the back of
 * a spinning fist on the target with the arm nearly extended, or the
 * forehead on the target by the trunk's lean; and the pelvis shift along the
 * line that brings the striking shoulder or the head into range.
 *
 * An elbow is carried on a circle about the shoulder by the upper arm, so
 * the elbow joint, a forearm radius behind the struck point along the
 * travel, must lie one upper-arm length from the shoulder. The pelvis
 * shifts along the line by what closes that distance, at most half a stance
 * length (provisional), or the target is refused with the band of distances
 * the shift reaches. The forearm folds `FOLD` degrees from the upper arm,
 * within the technique's plane: across the body for a horizontal or spinning
 * elbow, up for a rising one, back for a descending one. A spinning backfist
 * lays the back of the hand on the target with the elbow bent toward its
 * travel. A headbutt leans the trunk forward until the forehead is at the
 * target's height, at most `LEAN` degrees, then shifts the pelvis along the
 * line onto it.
 *
 * @param body The body.
 * @param technique The technique.
 * @param side The striking arm.
 * @param target The struck point, world metres.
 * @param line The horizontal unit line to the target.
 * @param travel The unit direction the effector travels at contact.
 * @param at The lower-body posture at contact for a pelvis shift and a lean.
 * @returns The landing.
 * @throws {HumanRefusal} When no shift within its band brings the elbow or the head onto the target, naming that band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each effector's landing, the elbow's circle, the shift's band with its provenance and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Closed-form circle-line intersection for the elbow's shift, the shoulder and the forehead read on the displayed lower-body posture, a bisected lean for the head's height.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The shoulder or the head, the shift, then the arm's or the head's goal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A target outside the band is refused, never reached by stretching; provisional angles and shares are named.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two shoulder reads for an elbow; twenty bisected lean reads and two shift reads for a headbutt.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function CloseStrikeReach(
  body: IAutoMovieMotionHumanBody,
  technique: IAutoMovieMotionHumanCloseStrike.Technique,
  side: AutoMovieHumanSide,
  target: IAutoMovieVector3,
  line: IAutoMovieVector3,
  travel: IAutoMovieVector3,
  at: (lean: number, shift: IAutoMovieVector3) => IAutoMovieMotionHumanPosture,
): CloseStrikeReach.ILanding {
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const limit: number = CloseStrikeReach.SHIFT * StrikingStance.length(body);
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const read = (
    posture: IAutoMovieMotionHumanPosture,
    bone: AutoMovieHumanoidBone,
  ): ReturnType<typeof HumanTrunk.resolve> =>
    HumanTrunk.resolve(body, posture, undefined, undefined, new Set([bone]));

  if (technique === "headbutt") {
    const forehead = (lean: number, shift: number): IAutoMovieVector3 =>
      resolveAutoMovieHumanoidSurfaces.place(
        body.surfaces.regions.forehead,
        read(at(lean, Vector3.scale(line, shift)), "head").get("head")!,
      ).point;
    let lo: number = -CloseStrikeReach.BACK;
    let hi: number = CloseStrikeReach.LEAN;
    if (forehead(lo, 0).y < target.y || forehead(hi, 0).y > target.y)
      refuse("height", target.y, forehead(hi, 0).y, forehead(lo, 0).y);
    for (let i: number = 0; i < 20; ++i) {
      const mid: number = (lo + hi) / 2;
      if (forehead(mid, 0).y > target.y) lo = mid;
      else hi = mid;
    }
    const lean: number = (lo + hi) / 2;
    let shift: number = Vector3.dot(
      Vector3.subtract(target, forehead(lean, 0)),
      line,
    );
    shift += Vector3.dot(Vector3.subtract(target, forehead(lean, shift)), line);
    if (Math.abs(shift) > limit) refuse("reach", shift, -limit, limit);
    return { lean, shift: Vector3.scale(line, shift), arm: null };
  }

  const still: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const shoulderAt = (shift: IAutoMovieVector3): IAutoMovieVector3 =>
    read(at(0, shift), `${side}UpperArm`).get(`${side}UpperArm`)!.worldPosition;
  const outward: IAutoMovieVector3 = Vector3.subtract(
    shoulderAt(still),
    read(at(0, still), "chest").get("chest")!.worldPosition,
  );
  const across: IAutoMovieVector3 = Vector3.normalize({
    x: -outward.x,
    y: 0,
    z: -outward.z,
  });

  if (technique === "spinningBackfist") {
    // The back of the hand on the target, the elbow bent out of the way of
    // the travel, the arm's reach from the shoulder.
    const reach: number = m.upperArm + m.forearm;
    const shoulder: IAutoMovieVector3 = shoulderAt(0);
    const along: number = Vector3.dot(Vector3.subtract(target, shoulder), line);
    const shift: number = Math.max(
      -limit,
      Math.min(limit, along - 0.9 * reach),
    );
    const rotation: IAutoMovieQuaternion = StrikingBody.fist(
      body,
      side,
      line,
      Vector3.scale(travel, -1),
    );
    const from: IAutoMovieVector3 = shoulderAt(shift);
    if (Vector3.distance(target, from) > reach)
      refuse("reach", Vector3.distance(target, shoulder), 0, reach + limit);
    return {
      lean: 0,
      shift,
      arm: {
        surface: "handBack",
        point: target,
        rotation,
        bend: Vector3.add(
          Vector3.lerp(from, target, 0.5),
          Vector3.scale(
            Vector3.add(Vector3.scale(travel, -1), Vector3.scale(up, -0.5)),
            0.5 * m.forearm,
          ),
        ),
        reach,
      },
    };
  }

  // The elbow joint the elbow region's depth behind the struck point, one upper arm
  // from the shoulder the shift leaves.
  const olecranon: number = Vector3.length(
    body.surfaces.regions[side === "left" ? "elbowLeft" : "elbowRight"].point,
  );
  const elbow: IAutoMovieVector3 = Vector3.subtract(
    target,
    Vector3.scale(travel, olecranon),
  );
  // The pelvis shifts horizontally toward the elbow's place, so only the
  // height between the shoulder and the elbow is left to the upper arm's
  // circle.
  const level = (v: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: v.x,
    y: 0,
    z: v.z,
  });
  const toward: IAutoMovieVector3 = Vector3.normalize(
    level(Vector3.subtract(elbow, shoulderAt(still))),
  );
  const solve = (shoulder: IAutoMovieVector3): number => {
    const v: IAutoMovieVector3 = Vector3.subtract(elbow, shoulder);
    const along: number = Vector3.dot(v, toward);
    const perpendicular: number = Vector3.dot(v, v) - along * along;
    if (perpendicular > m.upperArm * m.upperArm)
      refuse("reach", Math.sqrt(perpendicular), 0, m.upperArm);
    return along - Math.sqrt(m.upperArm * m.upperArm - perpendicular);
  };
  let distance: number = solve(shoulderAt(still));
  distance += solve(shoulderAt(Vector3.scale(toward, distance)));
  if (Math.abs(distance) > limit)
    refuse(
      "reach",
      Vector3.distance(elbow, shoulderAt(still)),
      Math.max(0, m.upperArm - limit),
      m.upperArm + limit,
    );
  const shift: IAutoMovieVector3 = Vector3.scale(toward, distance);
  const shoulder: IAutoMovieVector3 = shoulderAt(shift);
  const u: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(elbow, shoulder),
  );
  const plane: IAutoMovieVector3 =
    technique === "risingElbow"
      ? up
      : technique === "descendingElbow"
        ? Vector3.scale(line, -1)
        : technique === "horizontalElbow"
          ? across
          : Vector3.scale(travel, -1);
  const w: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(plane, Vector3.scale(u, Vector3.dot(plane, u))),
  );
  const fold: number = (CloseStrikeReach.FOLD * Math.PI) / 180;
  const forearm: IAutoMovieVector3 = Vector3.add(
    Vector3.scale(u, Math.cos(fold)),
    Vector3.scale(w, Math.sin(fold)),
  );
  const palm: IAutoMovieVector3 =
    Math.abs(Vector3.dot(forearm, up)) > 0.9
      ? Vector3.scale(line, -1)
      : Vector3.scale(up, -1);
  return {
    lean: 0,
    shift,
    arm: {
      surface: "wrist",
      point: Vector3.add(elbow, Vector3.scale(forearm, m.forearm)),
      rotation: StrikingBody.fist(body, side, forearm, palm),
      bend: elbow,
      reach: m.upperArm,
    },
  };
}

/** Refuse a close strike's target on its axis, naming the band. */
function refuse(
  axis: string,
  value: number,
  minimum: number,
  maximum: number,
): never {
  throw new HumanRefusal({
    kind: "reach",
    axis: axis === "height" ? "at.height" : "at",
    value,
    feasible: { kind: "range", minimum, maximum, unit: "m" },
    reason:
      axis === "height"
        ? `the target stands at ${value.toFixed(3)} m, outside the heights the head reaches by its lean`
        : `the close strike reaches ${minimum.toFixed(3)} to ${maximum.toFixed(3)} m, not ${value.toFixed(3)} m: an elbow lands inside the punch's band`,
    fix: "stand closer, or throw a punch or a kick at a target that far",
  });
}

/**
 * Companion types and constants of {@link CloseStrikeReach}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each constant's meaning and provenance and the landing's members.
 * @evidence contracts/development/design.md#principled-representation Degrees, shares and world goals in metres; a headbutt's landing carries no arm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the close strike law reads of its landing.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector and quaternion.
 */
export namespace CloseStrikeReach {
  /** The elbow's flexion at contact, degrees: past the 120 the issue's band sets, provisional. */
  export const FOLD: number = 135;

  /** The headbutt's greatest trunk lean, degrees (provisional). */
  export const LEAN: number = 40;

  /** The headbutt's greatest lean back, degrees, that lifts the forehead to a target above it (provisional). */
  export const BACK: number = 10;

  /** The pelvis's greatest shift along the line, a share of the stance length (provisional). */
  export const SHIFT: number = 0.5;

  /** A close strike's landing. */
  export interface ILanding {
    /** The trunk's lean at contact, degrees. */
    lean: number;

    /** The pelvis's horizontal shift at contact, world metres. */
    shift: IAutoMovieVector3;

    /** The striking arm's goal at contact; none for a headbutt. */
    arm: IArm | null;
  }

  /** The striking arm's goal at contact. */
  export interface IArm {
    /** The hand surface the goal places. */
    surface: IAutoMovieMotionHumanHand.Surface;

    /** Where that surface goes, world metres. */
    point: IAutoMovieVector3;

    /** The hand's world rotation. */
    rotation: IAutoMovieQuaternion;

    /** The elbow's bend hint, world metres: the elbow joint itself for an elbow strike. */
    bend: IAutoMovieVector3;

    /** The distance from the shoulder the effector is carried at, metres. */
    reach: number;
  }
}

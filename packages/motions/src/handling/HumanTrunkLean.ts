import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A trunk leaned forward to bring work within the arms: a hip hinge, the
 * whole body above the legs pitched about the hip joints' axis by the least
 * angle that puts every asked wrist within its arm from the turned
 * shoulder. A kneeler beating flames on a person lying before them, or a
 * potter leaning over the wheel, flexes at the hips about their joints with
 * the thighs, knees and shins (or the seat) kept as the support, so the
 * hinge keeps the hip joints in place and the legs on their goals.
 *
 * The angle is found in closed form: a shoulder turned by `θ` about the hip
 * axis lies `|s|² + |d|² - 2 (A cos θ + B sin θ + C)` squared from a wrist,
 * where `s` and `d` run from the axis to the shoulder and to the wrist, `C`
 * is the part along the axis and `A`, `B` are `d` read along the shoulder's
 * offset across the axis and along that offset turned a right angle
 * forward. Each wrist is reached on one interval of `θ`, and the hinge is
 * the least angle in all of them, at most the hip flexion the legs leave
 * (`HumanTrunk.HIP_FLEXION`, less the thighs' flexion `HumanTrunk.pelvisLimit`
 * reads and the pelvis's own pitch).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the hinge, its pivot, the closed form, the bound and why a person moves so.
 * @evidence contracts/development/design.md#principled-representation Degrees of pitch about the hip axis and the wrists a law asks, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hinge and its angle, shared by the laws that lean into work.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Work no hinge within the hip's range reaches is refused, never clamped.
 */
export namespace HumanTrunkLean {
  /**
   * A posture hinged forward about its hip joints' axis by an angle.
   *
   * @param body The body.
   * @param posture The posture; its legs keep their goals.
   * @param degrees The forward pitch about the hip axis, degrees.
   * @param riding The arms whose goals ride the trunk: arms that hang or hold from the shoulder rather than reach a world target; none when absent, so a goal the hinge is leaning toward stays where it is.
   * @returns The hinged posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the pivot, the unit, what stays and which arms ride the trunk.
   * @evidence contracts/development/implementation.md#principled-implementation `AutoMovieMotionHumanLean.about` turns the whole body about a world point along its left axis; the point is the midpoint of the two hip joints, which lie on that axis, so both joints stay put and the world leg goals keep the knees and feet where they are. A riding arm hangs from its shoulder, which rides the trunk, so its goal (its point, its bend point and its hand's rotation) is turned by the same rotation about the same axis, and a hanging hand stays clear of the thighs; a world-target goal stays put.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One axis read, one turn of the body and one rigid turn of the riding arms' goals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Which arms ride is the caller's, who knows which goals are world targets; none ride by default.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieMotionHumanLean.about`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lean(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    degrees: number,
    riding: readonly AutoMovieHumanSide[] = [],
  ): IAutoMovieMotionHumanPosture {
    const hip: IAxis = axis(body, posture);
    const hinged: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanLean.about(
      posture,
      hip.point,
      { pitch: degrees, roll: 0 },
    );

    // A riding arm hangs from a shoulder the hinge carries: its goal turns
    // with the trunk about the same axis by the same angle.
    if (riding.length === 0) return hinged;
    const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      hip.axis,
      degrees,
    );
    const carried: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
      p: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Vector3.add(
        hip.point,
        Quaternion.rotateVector(turn, Vector3.subtract(p, hip.point)),
      );
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...hinged.limbs };
    for (const side of riding) {
      const goal: IAutoMovieHumanLimbGoal | undefined = limbs[`${side}Arm`];
      if (goal === undefined) continue;
      limbs[`${side}Arm`] = {
        ...goal,
        point: carried(goal.point),
        bend: carried(goal.bend),
        ...(goal.rotation === undefined
          ? {}
          : { rotation: Quaternion.multiply(turn, goal.rotation) }),
      };
    }
    return { ...hinged, limbs };
  }

  /**
   * A base the hinge moves: without the windows in which the base declares
   * itself still (`still`, `legsStill`) whenever a hinge is asked. Inside a
   * legs-still window the display fits the legs once and keeps their joints
   * relative to the pelvis, on the premise that the root and the trunk do
   * not move; a hinge pitches the root, so a kept window would swing the
   * planted knees and feet with the pelvis instead of holding them.
   *
   * @param base The law's base plan.
   * @param degrees The deepest hinge the law asks, degrees.
   * @returns The base, its still windows dropped when the hinge is positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is dropped, when, and why the window's premise fails.
   * @evidence contracts/development/implementation.md#principled-implementation The legs-still window (`HumanSegmentLegs`) reuses leg joints only where root and trunk are unchanged; a hinged base changes both, so it states no such window and its world leg goals hold the legs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One test and one rest spread.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A base with no hinge keeps its windows unchanged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function moving(
    base: IAutoMovieMotionHumanActionPlan,
    degrees: number,
  ): IAutoMovieMotionHumanActionPlan {
    if (!(degrees > 0)) return base;
    const { still: _still, legsStill: _legsStill, ...hinged } = base;
    return hinged;
  }

  /**
   * The least hinge that brings every asked wrist within its arm.
   *
   * @param context The action's context; its entry posture is hinged.
   * @param wrists The wrists asked, each with its arm and attitude.
   * @returns The hinge, degrees.
   * @throws {HumanRefusal} When no hinge within the hip's remaining flexion reaches every wrist.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result, its unit and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A rotation about the hip axis carries the shoulder on a circle, so its squared distance to a wrist is affine in `cos θ` and `sin θ`; the reach condition `A cos θ + B sin θ >= K` holds on the arc `|θ - atan2(B, A)| <= acos(K / hypot(A, B))`, and the least angle in every wrist's arc and the hip's range is the answer.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shoulder read per wrist, one arc per wrist, one intersection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The arm is the upper arm and the forearm, as the reach owner `pickUp.reachable` refuses by; out of range is refused with the nearest distance, never clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk read per wrist and constant arithmetic; no search over angles and no solve.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads its own entry.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function least(
    context: IAutoMovieMotionHumanActionContext<object>,
    wrists: readonly IWrist[],
  ): number {
    const body: IAutoMovieMotionHumanBody = context.body;
    const posture: IAutoMovieMotionHumanPosture = context.entry.posture;
    const hip: IAxis = axis(body, posture);
    const arm: number = body.measure.upperArm + body.measure.forearm;
    const range: number = (Math.PI / 180) * room(body, posture);
    let low: number = 0;
    let high: number = range;
    for (const w of wrists) {
      const s: IAutoMovieVector3 = Vector3.subtract(
        shoulder(body, posture, w.side),
        hip.point,
      );
      const along: IAutoMovieVector3 = Vector3.scale(
        hip.axis,
        Vector3.dot(s, hip.axis),
      );
      const across: IAutoMovieVector3 = Vector3.subtract(s, along);
      const d: IAutoMovieVector3 = Vector3.subtract(w.point, hip.point);
      const a: number = Vector3.dot(d, across);
      const b: number = Vector3.dot(d, Vector3.cross(hip.axis, across));
      const k: number =
        (Vector3.dot(s, s) + Vector3.dot(d, d) - arm * arm) / 2 -
        Vector3.dot(d, along);
      const r: number = Math.hypot(a, b);

      // Every pitch reaches when even the farthest turn does.
      if (k <= -r) continue;
      const centre: number = Math.atan2(b, a);
      const half: number = k > r ? -1 : Math.acos(k / r);
      low = Math.max(low, centre - half);
      high = Math.min(high, centre + half);
      if (!(low <= high)) {
        const nearest: number = Math.min(range, Math.max(0, centre));
        const gap: number = Math.sqrt(
          Math.max(
            0,
            Vector3.dot(s, s) +
              Vector3.dot(d, d) -
              2 * (a * Math.cos(nearest) + b * Math.sin(nearest)) -
              2 * Vector3.dot(d, along),
          ),
        );
        throw new HumanRefusal({
          kind: "reach",
          axis: "prop",
          value: gap,
          feasible: { kind: "range", minimum: 0, maximum: arm, unit: "m" },
          reason: `${context.subject}: no hinge at the hips within their range brings the ${w.side} wrist within the arm; it stays ${gap.toFixed(3)} m from the shoulder, beyond the arm's ${arm.toFixed(3)} m`,
          fix: "step or kneel closer first",
        });
      }
    }
    return (low * 180) / Math.PI;
  }

  /** The hip joints' axis of a posture: their midpoint and the unit direction from the right joint to the left. */
  function axis(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): IAxis {
    const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(posture);
    const left: IAutoMovieVector3 = body.rest.get("leftUpperLeg")!;
    const right: IAutoMovieVector3 = body.rest.get("rightUpperLeg")!;
    return {
      point: Vector3.add(
        posture.root,
        Quaternion.rotateVector(heading, Vector3.lerp(left, right, 0.5)),
      ),
      axis: Quaternion.rotateVector(
        heading,
        Vector3.normalize(Vector3.subtract(left, right)),
      ),
    };
  }

  /** The hip flexion the legs leave the hinge, degrees: `HumanTrunk.pelvisLimit` over the leg goals' ankles, less the pelvis's own pitch; the whole margin of the hip's range when the posture holds no leg goals. */
  function room(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): number {
    const left: IAutoMovieVector3 | undefined = posture.limbs.leftLeg?.point;
    const right: IAutoMovieVector3 | undefined = posture.limbs.rightLeg?.point;
    if (left === undefined || right === undefined)
      return HumanTrunk.HIP_FLEXION;

    // The root the pelvis would have level, its hips where they are.
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const level: IAutoMovieVector3 = Vector3.subtract(
      Vector3.add(
        posture.root,
        Quaternion.rotateVector(resolveHumanPosture.heading(posture), hips),
      ),
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
        hips,
      ),
    );
    return Math.max(
      0,
      HumanTrunk.pelvisLimit(body, level, posture.yaw, { left, right }) -
        posture.pitch,
    );
  }

  /** An arm's shoulder joint on a posture, world metres. */
  function shoulder(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
  ): IAutoMovieVector3 {
    const bone: AutoMovieHumanoidBone = `${side}UpperArm`;
    return HumanTrunk.resolve(
      body,
      posture,
      undefined,
      undefined,
      new Set<AutoMovieHumanoidBone>([bone]),
    ).get(bone)!.worldPosition;
  }

  /**
   * A wrist a law asks of an arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the arm, the point and the attitude.
   * @evidence contracts/development/design.md#principled-representation World metres and a world attitude.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `least` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every member is required.
   */
  export interface IWrist {
    /** The arm. */
    side: AutoMovieHumanSide;

    /** The wrist, world metres. */
    point: IAutoMovieVector3;

    /** The hand's attitude, world. */
    rotation: IAutoMovieQuaternion;
  }

  /** The hip joints' axis: a point on it and its unit direction, world. */
  interface IAxis {
    /** The joints' midpoint, metres. */
    point: IAutoMovieVector3;

    /** Unit direction from the right joint to the left. */
    axis: IAutoMovieVector3;
  }
}

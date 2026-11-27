import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLean } from "../../compose/internal/AutoMovieMotionHumanLean";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";

/*
 * A trunk leaned forward to bring work within the arms: a hip hinge, the whole
 * body above the legs pitched about the hip joints' axis by the least angle
 * that puts every asked wrist within its arm from the turned shoulder. A
 * kneeler beating flames on a person lying before them, or a potter leaning
 * over the wheel, flexes at the hips about their joints with the thighs, knees
 * and shins (or the seat) kept as the support, so the hinge keeps the hip
 * joints in place and the legs on their goals.
 *
 * The angle is found in closed form: a shoulder turned by `θ` about the hip
 * axis lies `|s|² + |d|² - 2 (A cos θ + B sin θ + C)` squared from a wrist,
 * where `s` and `d` run from the axis to the shoulder and to the wrist, `C` is
 * the part along the axis and `A`, `B` are `d` read along the shoulder's offset
 * across the axis and along that offset turned a right angle forward. Each
 * wrist is reached on one interval of `θ`, and the hinge is the least angle in
 * all of them, at most the hip flexion the legs leave
 * (`HumanTrunk.HIP_FLEXION`, less the thighs' flexion `HumanTrunk.pelvisLimit`
 * reads and the pelvis's own pitch).
 */
export namespace HumanTrunkLean {
  /*
   * A posture hinged forward about its hip joints' axis by an angle.
   * Parameter body: The body.
   * Parameter posture: The posture; its legs keep their goals.
   * Parameter degrees: The forward pitch about the hip axis, degrees.
   * Parameter hanging: The arms that hang free under gravity, as they hang before
   * the hinge (`hang`); none when absent.
   * Returns: The hinged posture.
   */
  export function lean(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    degrees: number,
    hanging: readonly HumanTrunkLean.IHanging[] = [],
  ): IAutoMovieMotionHumanPosture {
    const hip: IAxis = axis(body, posture);
    const hinged: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanLean.about(
      posture,
      hip.point,
      { pitch: degrees, roll: 0 },
    );
    if (hanging.length === 0) return hinged;

    // A free arm hangs plumb from the shoulder the hinge carries: the arm
    // moves by the shoulder's displacement and keeps its world attitude.
    const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      hip.axis,
      degrees,
    );
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...hinged.limbs };
    for (const arm of hanging) {
      const shift: IAutoMovieVector3 = Vector3.subtract(
        Vector3.add(
          hip.point,
          Quaternion.rotateVector(
            turn,
            Vector3.subtract(arm.shoulder, hip.point),
          ),
        ),
        arm.shoulder,
      );
      limbs[`${arm.side}Arm`] = {
        point: Vector3.add(arm.wrist, shift),
        bend: Vector3.add(arm.elbow, shift),
        rotation: arm.rotation,
      };
    }
    return { ...hinged, limbs };
  }

  /*
   * How a free arm hangs before a hinge: its shoulder, elbow and wrist joints
   * and its hand's attitude as the pose shows them, read once for the hinge to
   * carry (`lean`).
   * Parameter body: The body.
   * Parameter pose: The pose the arm hangs in, the act's entry.
   * Parameter side: The arm.
   * Returns: The hanging arm, world.
   */
  export function hang(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    side: AutoMovieHumanSide,
  ): HumanTrunkLean.IHanging {
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      pose,
      undefined,
      new Set<AutoMovieHumanoidBone>([
        `${side}UpperArm`,
        `${side}LowerArm`,
        `${side}Hand`,
      ]),
    );
    return {
      side,
      shoulder: bones.get(`${side}UpperArm`)!.worldPosition,
      elbow: bones.get(`${side}LowerArm`)!.worldPosition,
      wrist: bones.get(`${side}Hand`)!.worldPosition,
      rotation: bones.get(`${side}Hand`)!.worldRotation,
    };
  }

  /*
   * A base the hinge moves: without the windows in which the base declares
   * itself still (`still`, `legsStill`) whenever a hinge is asked. Inside a
   * legs-still window the display fits the legs once and keeps their joints
   * relative to the pelvis, on the premise that the root and the trunk do not
   * move; a hinge pitches the root, so a kept window would swing the planted
   * knees and feet with the pelvis instead of holding them.
   * Parameter base: The law's base plan.
   * Parameter degrees: The deepest hinge the law asks, degrees.
   * Returns: The base, its still windows dropped when the hinge is positive.
   */
  export function moving(
    base: IAutoMovieMotionHumanActionPlan,
    degrees: number,
  ): IAutoMovieMotionHumanActionPlan {
    if (!(degrees > 0)) return base;
    const { still: _still, legsStill: _legsStill, ...hinged } = base;
    return hinged;
  }

  /*
   * The least hinge that brings every asked wrist within its arm.
   * Parameter context: The action's context; its entry posture is hinged.
   * Parameter wrists: The wrists asked, each with its arm and attitude.
   * Returns: The hinge, degrees.
   * When no hinge within the hip's remaining flexion
   * reaches every wrist.
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

  /*
   * A free arm as it hangs before a hinge (`hang`), world.
   */
  export interface IHanging {
    /*
     * The arm.
     */
    side: AutoMovieHumanSide;

    /*
     * The shoulder joint.
     */
    shoulder: IAutoMovieVector3;

    /*
     * The elbow joint.
     */
    elbow: IAutoMovieVector3;

    /*
     * The wrist joint.
     */
    wrist: IAutoMovieVector3;

    /*
     * The hand's attitude.
     */
    rotation: IAutoMovieQuaternion;
  }

  /*
   * A wrist a law asks of an arm.
   */
  export interface IWrist {
    /*
     * The arm.
     */
    side: AutoMovieHumanSide;

    /*
     * The wrist, world metres.
     */
    point: IAutoMovieVector3;

    /*
     * The hand's attitude, world.
     */
    rotation: IAutoMovieQuaternion;
  }

  /*
   * The hip joints' axis of a posture: their midpoint and the unit direction
   * from the right joint to the left.
   */
  function axis(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): IAxis {
    const heading: IAutoMovieQuaternion = humanPostureHeading(posture);
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

  /*
   * The hip flexion the legs leave the hinge, degrees: `HumanTrunk.pelvisLimit`
   * over the leg goals' ankles, less the pelvis's own pitch; the whole margin
   * of the hip's range when the posture holds no leg goals.
   */
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
        Quaternion.rotateVector(humanPostureHeading(posture), hips),
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

  /*
   * An arm's shoulder joint on a posture, world metres.
   */
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

  /*
   * The hip joints' axis: a point on it and its unit direction, world.
   */
  interface IAxis {
    /*
     * The joints' midpoint, metres.
     */
    point: IAutoMovieVector3;

    /*
     * Unit direction from the right joint to the left.
     */
    axis: IAutoMovieVector3;
  }
}

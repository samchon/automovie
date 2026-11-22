import { ANKLE_DORSIFLEXION, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";

/**
 * The legs of getting onto a high seat (`HumanMountOn`) in closed form: the
 * pushing foot's heel rolling up over its ball, the knee's pole as a foot
 * swings to its rest, and the toes turned down on a foot that bears nothing.
 * Each reads the ankle's bend off the two-link leg bent in the plane of its
 * pole, the plane the limb fit bends the knee in, so the ankle the verdicts
 * read stays within what it holds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the legs are shaped for, how the ankle is read and which action reads them.
 * @evidence contracts/development/design.md#principled-representation World metres, degrees and limb goals, the units the limb fit takes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `HumanMountOn` asks of its legs, and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No object and no body is named.
 */
export namespace HumanMountPush {
  /** How far an ankle may dorsiflex off the floor before its foot turns, degrees: a weightless ankle's range less a margin, so the foot stays within it (`ANKLE_DORSIFLEXION.unloaded`, provisional margin). */
  export const DORSAL: number = ANKLE_DORSIFLEXION.unloaded - 3;

  /**
   * The pushing foot rolled over its ball at an instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit.
   * @evidence contracts/development/design.md#principled-representation The goal the limb fit takes, and the two readings that decide when the foot leaves.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `HumanMountOn` only.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The roll is the toes' extension by construction, so the two cannot disagree.
   */
  export interface IRoll {
    /** The leg's goal: the rolled ankle and foot, bearing on the ball. */
    goal: IAutoMovieHumanLimbGoal;

    /** How far the heel has rolled up about the ball, degrees, which the toes extend by. */
    roll: number;

    /** The hip's distance from the rolled ankle, metres. */
    reach: number;
  }

  /**
   * An ankle's sagittal bend in its shank's own plane, and the axis that
   * turns the foot to lessen it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit and sign.
   * @evidence contracts/development/design.md#principled-representation The verdicts' own reading, and the axis a foot turns about to change it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read in this namespace only.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The axis is signed off the foot itself, so a turn about it cannot flip as the leg swings.
   */
  export interface IBend {
    /** Dorsiflexion, degrees: the shank's lean toward the toes off the foot's normal, in the plane the knee bends in. */
    dorsiflexion: number;

    /** The knee's hinge axis, signed so a positive turn about it pitches the toes down. */
    axis: IAutoMovieVector3;
  }

  /**
   * A leg's ankle bend in closed form. The knee of the two-link leg from the
   * hip to the ankle lies in the plane of the pole: with the axis
   * `u = (ankle - hip) / d`, the pole's direction square to it `w`, the
   * thigh `a` and the shank `b`, `cos α = (a² + d² - b²) / (2 a d)` and the
   * knee is `hip + a (cos α u + sin α w)`. The shank's lean off the foot's
   * normal in that plane is the ankle's sagittal flexion, the verdicts'
   * reading.
   *
   * @param body The body, whose thigh and shank lengths are read.
   * @param hip The hip joint, world metres.
   * @param ankle The ankle, world metres.
   * @param pole The knee's pole, world metres.
   * @param rotation The foot's world rotation.
   * @returns The bend and its axis; null for a degenerate leg.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the closed form, the inputs and the degenerate case.
   * @evidence contracts/development/implementation.md#principled-implementation The pole-vector two-link solution, the same plane the limb fit bends the knee in, and the clinical sagittal angle the verdicts read.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One closed form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A leg past its reach is read straight, at its span's bound; stated here.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bend(
    body: IAutoMovieMotionHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    pole: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): IBend | null {
    const knee: IAutoMovieVector3 | null = kneeOf(body, hip, ankle, pole);
    if (knee === null) return null;
    const down: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(ankle, hip),
    );
    const out: IAutoMovieVector3 = square(Vector3.subtract(pole, hip), down)!;
    const hinge: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(down, out),
    );
    const flat = (v: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.subtract(v, Vector3.scale(hinge, Vector3.dot(hinge, v)));
    const lean: IAutoMovieVector3 = flat(Vector3.subtract(knee, ankle));
    // The foot's normal and its toes, in that plane: the dorsiflexion is the
    // lean from the normal toward the toes, and the turn that lessens it tips
    // the normal toward the toes, about their cross product, both read off
    // the foot itself so neither flips as the leg swings.
    const normal: IAutoMovieVector3 = Vector3.normalize(
      flat(Quaternion.rotateVector(rotation, { x: 0, y: 1, z: 0 })),
    );
    const forward: IAutoMovieVector3 = flat(
      Quaternion.rotateVector(rotation, { x: 0, y: 0, z: 1 }),
    );
    const toes: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        forward,
        Vector3.scale(normal, Vector3.dot(normal, forward)),
      ),
    );
    return {
      dorsiflexion:
        Math.atan2(Vector3.dot(lean, toes), Vector3.dot(lean, normal)) /
        Quaternion.DEG2RAD,
      axis: Vector3.normalize(Vector3.cross(normal, toes)),
    };
  }

  /**
   * The pushing foot as the pelvis rises over it: its heel rolls up about
   * the ball by as much as the shank, in the knee's own plane, would bend
   * the flat foot's ankle past `DORSAL`, its knee straightening.
   *
   * @param body The body.
   * @param side The pushing leg.
   * @param planted The leg's goal with the foot flat on the floor.
   * @param hip The hip joint, world metres.
   * @param heading The flat foot's heading, degrees.
   * @returns The rolled goal, the roll and the hip's reach to the ankle.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule, the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The heel rises about the ball, the joint a push-off rolls over, by the ankle's own excess in closed form.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two passes of one closed form: the rolled ankle moves the knee a little, and the second pass reads it.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the body's own measures.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `bend`, the one reading of the ankle.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function roll(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    planted: IAutoMovieHumanLimbGoal,
    hip: IAutoMovieVector3,
    heading: number,
  ): IRoll {
    const flat: IAutoMovieQuaternion =
      planted.rotation ?? HumanFrame.turn(heading);
    const ball: IAutoMovieVector3 = HumanFoot.point(body, side, "mtp", {
      ankle: planted.point,
      rotation: flat,
    });
    let rolled: number = 0;
    let ankle: IAutoMovieVector3 = planted.point;
    let rotation: IAutoMovieQuaternion = flat;
    for (let pass: number = 0; pass < 2; ++pass) {
      const bent: IBend | null = bend(body, hip, ankle, planted.bend, rotation);
      if (bent === null) break;
      const excess: number = bent.dorsiflexion - DORSAL;
      if (Math.abs(excess) < 1e-6 || (rolled === 0 && excess <= 0)) break;
      rolled = Math.max(0, rolled + excess);
      const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        bent.axis,
        rolled,
      );
      ankle = Vector3.add(
        ball,
        Quaternion.rotateVector(turn, Vector3.subtract(planted.point, ball)),
      );
      rotation = Quaternion.multiply(turn, flat);
    }
    return {
      goal: {
        ...planted,
        point: ankle,
        rotation,
        contact: HumanFoot.offset(body, side, "mtp"),
      },
      roll: rolled,
      reach: Vector3.length(Vector3.subtract(ankle, hip)),
    };
  }

  /**
   * The knee's pole for a swinging foot, a thigh off the leg's middle and
   * square to the leg: a pole carried as a point could cross the leg as the
   * hip moves over the seat, and the knee would flip. Its direction starts
   * where an unturned hip points the knee, the leg's line turned a right
   * angle forward in the body's sagittal plane (forward under a hanging
   * foot, down behind a foot swung back, up over a foot raised ahead), and
   * turns on the shortest arc to the rest's own pole as the foot swings.
   *
   * @param body The body, whose thigh length is read.
   * @param hip The hip joint, world metres.
   * @param ankle The swinging ankle, world metres.
   * @param facing The body's level facing, a unit vector.
   * @param rest The direction from the hip to the rest's own pole.
   * @param share 0 as the foot leaves to 1 as it arrives.
   * @returns The pole, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule, the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The knee points where the thigh's front faces, the sagittal right angle off the leg, so the pole never degenerates when the foot passes behind the hip.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One closed form.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the body's own measures.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pole(
    body: IAutoMovieMotionHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    facing: IAutoMovieVector3,
    rest: IAutoMovieVector3,
    share: number,
  ): IAutoMovieVector3 {
    const line: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(ankle, hip),
    );
    const natural: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(facing, -line.y),
      { x: 0, y: Vector3.dot(line, facing), z: 0 },
    );
    const from: IAutoMovieVector3 =
      Vector3.length(natural) > 1e-6 ? natural : facing;
    const aimed: IAutoMovieVector3 = Quaternion.rotateVector(
      turned(from, rest, share),
      from,
    );
    const off: IAutoMovieVector3 = square(aimed, line) ??
      square(from, line) ?? { x: 0, y: 0, z: 0 };
    return Vector3.add(
      Vector3.lerp(hip, ankle, 0.5),
      Vector3.scale(off, body.measure.thigh),
    );
  }

  /**
   * A foot that bears nothing, or is only taking weight, with its toes
   * turned down about its ball by `weight` times as much as its shank, bent
   * in the knee's own plane about the goal's pole, would bend its ankle past
   * `DORSAL`: so the ball, not the ankle, comes onto a rest, and the heel
   * lowers about that ball as the weight eases out.
   *
   * @param body The body.
   * @param side The leg.
   * @param hip The hip joint, world metres.
   * @param goal The leg's goal, its foot as placed.
   * @param weight 1 for a foot that bears nothing, easing to 0 as it takes weight.
   * @returns The goal with the foot turned down, or as it was.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule, the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The turn about the ball keeps the ball where a rest's tread takes it, and the excess is the ankle's own, in closed form.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One closed form.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the body's own measures.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `bend`, the one reading of the ankle.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function tip(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    hip: IAutoMovieVector3,
    goal: IAutoMovieHumanLimbGoal,
    weight: number,
  ): IAutoMovieHumanLimbGoal {
    if (goal.rotation === undefined) return goal;
    const bent: IBend | null = bend(
      body,
      hip,
      goal.point,
      goal.bend,
      goal.rotation,
    );
    const excess: number =
      bent === null ? 0 : weight * (bent.dorsiflexion - DORSAL);
    if (bent === null || excess <= 0) return goal;
    const ball: IAutoMovieVector3 = HumanFoot.point(body, side, "ball", {
      ankle: goal.point,
      rotation: goal.rotation,
    });
    const down: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      bent.axis,
      excess,
    );
    return {
      ...goal,
      point: Vector3.add(
        ball,
        Quaternion.rotateVector(down, Vector3.subtract(goal.point, ball)),
      ),
      rotation: Quaternion.multiply(down, goal.rotation),
    };
  }

  /**
   * How far a leg's foot is turned about its shank out of the knee's own
   * plane. The ankle has no axial twist of its own (its range leaves that
   * axis immobile), so the knee's swivel must supply this turn: at zero
   * the leg's closed-form root lies at the goal's pole. The knee is the
   * pole-vector two-link solution (`bend`), the shank runs from the ankle
   * to it, and the turn is the angle about the shank from the knee's hinge
   * to the foot's own lateral axis, the axis the ankle flexes about, both
   * square to the shank: unlike the toes, which a pointed foot lays along
   * the shank, it never runs along it.
   *
   * @param body The body, whose thigh and shank lengths are read.
   * @param hip The hip joint, world metres.
   * @param goal The leg's goal, its pole and foot rotation.
   * @returns The turn, degrees, about the shank; null for a degenerate leg or a foot's lateral axis along the shank.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the turn is, why it decides the knee and the degenerate cases.
   * @evidence contracts/development/implementation.md#principled-implementation An ankle with an immobile axial axis meets a foot rotation only at the swivel whose bend plane holds the ankle's flexion axis parallel to the knee's hinge (Tolani, Goswami and Badler 2000, section 3.2.4, a joint limit as a function of the swivel); the pole-vector knee gives that hinge in closed form.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One closed form.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the body's own measures.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The knee is `bend`'s.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function twist(
    body: IAutoMovieMotionHumanBody,
    hip: IAutoMovieVector3,
    goal: IAutoMovieHumanLimbGoal,
  ): ITwist | null {
    if (goal.rotation === undefined) return null;
    const knee: IAutoMovieVector3 | null = kneeOf(
      body,
      hip,
      goal.point,
      goal.bend,
    );
    if (knee === null) return null;
    const leg: IAutoMovieVector3 = Vector3.subtract(knee, goal.point);
    if (Vector3.length(leg) < 1e-9) return null;
    const shank: IAutoMovieVector3 = Vector3.normalize(leg);
    // The knee's hinge, signed as the foot's own lateral axis lies in a
    // straight leg whose knee points ahead.
    const down: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(goal.point, hip),
    );
    const out: IAutoMovieVector3 = square(
      Vector3.subtract(goal.bend, hip),
      down,
    )!;
    const hinge: IAutoMovieVector3 | null = square(
      Vector3.cross(out, down),
      shank,
    );
    const lateral: IAutoMovieVector3 | null = square(
      Quaternion.rotateVector(goal.rotation, { x: 1, y: 0, z: 0 }),
      shank,
    );
    if (hinge === null || lateral === null) return null;
    return {
      degrees:
        Math.atan2(
          Vector3.dot(Vector3.cross(hinge, lateral), shank),
          Vector3.dot(hinge, lateral),
        ) / Quaternion.DEG2RAD,
      shank,
    };
  }

  /**
   * A leg's goal with its foot turned about the shank to a given turn out
   * of the knee's plane (`twist`), the ankle kept where it is: a law easing
   * the turn between two feasible ends keeps the knee's closed-form root on
   * its own side all the way.
   *
   * @param body The body.
   * @param hip The hip joint, world metres.
   * @param goal The leg's goal.
   * @param degrees The turn the foot is to keep, degrees.
   * @returns The goal, its foot turned; unchanged for a degenerate leg.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the turn applied and what is kept.
   * @evidence contracts/development/implementation.md#principled-implementation One rotation about the shank through the ankle: the ankle and the pole stay, and the foot's turn out of the knee's plane becomes the asked one exactly.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One closed form.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the body's own measures.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `twist`, the one reading of the turn.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function squared(
    body: IAutoMovieMotionHumanBody,
    hip: IAutoMovieVector3,
    goal: IAutoMovieHumanLimbGoal,
    degrees: number,
  ): IAutoMovieHumanLimbGoal {
    const now: ITwist | null = twist(body, hip, goal);
    if (now === null || goal.rotation === undefined) return goal;
    return {
      ...goal,
      rotation: Quaternion.normalize(
        Quaternion.multiply(
          Quaternion.fromAxisAngle(now.shank, degrees - now.degrees),
          goal.rotation,
        ),
      ),
    };
  }

  /** A foot's turn about its shank out of the knee's plane (`twist`). */
  export interface ITwist {
    /** The turn, degrees. */
    degrees: number;

    /** The shank's unit direction, from the ankle to the knee. */
    shank: IAutoMovieVector3;
  }

  /** The pole-vector knee of the two-link leg (`bend`), or null for a degenerate leg. */
  function kneeOf(
    body: IAutoMovieMotionHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    pole: IAutoMovieVector3,
  ): IAutoMovieVector3 | null {
    const thigh: number = body.measure.thigh;
    const shank: number = body.measure.shank;
    const reach: IAutoMovieVector3 = Vector3.subtract(ankle, hip);
    const distance: number = Vector3.length(reach);
    if (distance < 1e-9) return null;
    const down: IAutoMovieVector3 = Vector3.scale(reach, 1 / distance);
    const out: IAutoMovieVector3 | null = square(
      Vector3.subtract(pole, hip),
      down,
    );
    if (out === null) return null;
    const span: number = Math.min(
      thigh + shank,
      Math.max(Math.abs(thigh - shank), distance),
    );
    const along: number =
      (thigh * thigh + span * span - shank * shank) / (2 * span);
    return Vector3.add(
      hip,
      Vector3.add(
        Vector3.scale(down, along),
        Vector3.scale(
          out,
          Math.sqrt(Math.max(0, thigh * thigh - along * along)),
        ),
      ),
    );
  }

  /** The unit part of `v` square to the unit `axis`, or null where none is left. */
  function square(
    v: IAutoMovieVector3,
    axis: IAutoMovieVector3,
  ): IAutoMovieVector3 | null {
    const across: IAutoMovieVector3 = Vector3.subtract(
      v,
      Vector3.scale(axis, Vector3.dot(axis, v)),
    );
    return Vector3.length(across) < 1e-9 ? null : Vector3.normalize(across);
  }

  /** A share of the shortest turn taking one direction onto another. */
  function turned(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    share: number,
  ): IAutoMovieQuaternion {
    const a: IAutoMovieVector3 = Vector3.normalize(from);
    const b: IAutoMovieVector3 = Vector3.normalize(to);
    const axis: IAutoMovieVector3 = Vector3.cross(a, b);
    const sine: number = Vector3.length(axis);
    if (sine < 1e-9) return Quaternion.identity();
    return Quaternion.fromAxisAngle(
      Vector3.scale(axis, 1 / sine),
      (share * Math.atan2(sine, Vector3.dot(a, b))) / Quaternion.DEG2RAD,
    );
  }
}

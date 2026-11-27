import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBoneGroups } from "../posture/HumanBoneGroups";
import { HumanFoot } from "../posture/HumanFoot";
import { assembleHumanPosture } from "../posture/internal/assembleHumanPosture";
import { poseBones } from "../posture/internal/poseBones";

/**
 * The feet of a body going down, held where they stood. A fall that pitches or
 * turns the whole body about its root also turns the feet with it, so a heel or
 * a toe the floor holds swings across it; the feet stay flat and planted at
 * their entry places and attitudes, by leg goals, until the part that lands
 * first bears, and the legs then return to the fall's own shape over `FADE`. A
 * body lifted off its feet (a wire's hoist) may raise each held heel about the
 * ball once the leg has straightened (`hold`'s heels), so the foot stays on the
 * floor instead of the leg falling short of it.
 */
export namespace ReactionFeet {
  /** The two feet's contact parts. */
  const FEET: readonly IAutoMovieMotionHumanContactWindow["part"][] = [
    "leftFoot",
    "rightFoot",
  ];

  /**
   * How long the legs take to leave their planted goals for the fall's shape,
   * seconds: authored.
   */
  export const FADE: number = 0.2;

  /**
   * A planted foot whose hip has risen past the leg's full length from its
   * entry ankle, its heel raised about the ball by the least angle that brings
   * the ankle back within the leg's reach, the toes lifting from the foot by
   * the same angle so they stay flat, as a heel rises before the foot leaves
   * the floor. Closed form: the ankle turns on a circle about the ball's
   * lateral axis, and the circle meets the sphere of the leg's length about the
   * hip where `A cos θ + B sin θ = c`. Unchanged when the leg reaches it flat;
   * the angle of greatest reach where none reaches.
   *
   * @param foot The entry foot: its ankle and rotation.
   * @param ball The ball's contact point on the floor, world metres.
   * @param hip The hip joint now, world metres.
   * @param length The thigh's and the shank's length together, metres.
   * @returns The placement and the toes' flexion, degrees.
   */
  function heeled(
    foot: IAutoMovieMotionHumanEntryState.IFoot,
    ball: IAutoMovieVector3,
    hip: IAutoMovieVector3,
    length: number,
  ): IHeeled {
    if (Vector3.distance(hip, foot.ankle) <= length)
      return { ankle: foot.ankle, rotation: foot.rotation, toes: 0 };
    const k: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(foot.rotation, { x: 1, y: 0, z: 0 }),
    );
    const r: IAutoMovieVector3 = Vector3.subtract(foot.ankle, ball);
    const along: IAutoMovieVector3 = Vector3.scale(k, Vector3.dot(r, k));
    const across: IAutoMovieVector3 = Vector3.subtract(r, along);
    const turned: IAutoMovieVector3 = Vector3.cross(k, across);
    const d: IAutoMovieVector3 = Vector3.subtract(hip, ball);
    const A: number = Vector3.dot(d, across);
    const B: number = Vector3.dot(d, turned);
    const c: number =
      (Vector3.dot(d, d) + Vector3.dot(r, r) - length * length) / 2 -
      Vector3.dot(d, along);
    const rho: number = Math.hypot(A, B);
    const phi: number = Math.atan2(B, A);
    const spread: number = Math.acos(Math.max(-1, Math.min(1, c / rho)));
    const ankle = (theta: number): IAutoMovieVector3 =>
      Vector3.add(
        ball,
        Vector3.add(
          along,
          Vector3.add(
            Vector3.scale(across, Math.cos(theta)),
            Vector3.scale(turned, Math.sin(theta)),
          ),
        ),
      );
    // Of the two crossings, the smaller turn that raises the ankle.
    const candidates: number[] = [phi - spread, phi + spread]
      .map((theta: number): number =>
        Math.atan2(Math.sin(theta), Math.cos(theta)),
      )
      .filter((theta: number): boolean => ankle(theta).y > foot.ankle.y);
    const theta: number =
      candidates.length === 0
        ? 0
        : candidates.reduce((a: number, b: number): number =>
            Math.abs(b) < Math.abs(a) ? b : a,
          );
    return {
      ankle: ankle(theta),
      rotation: Quaternion.multiply(
        Quaternion.fromAxisAngle(k, (theta * 180) / Math.PI),
        foot.rotation,
      ),
      toes: (Math.abs(theta) * 180) / Math.PI,
    };
  }

  /**
   * What a held foot's heel rise reads from the entry: its ball on the floor,
   * world metres, and its leg's full length, metres.
   */
  interface IRaise {
    /** The ball's contact point, world metres. */
    ball: IAutoMovieVector3;
    /** The thigh's and the shank's length together, metres. */
    length: number;
  }

  /**
   * A planted foot's placement under a heel rise and its toes' flexion,
   * degrees.
   */
  interface IHeeled {
    /** The ankle, world metres. */
    ankle: IAutoMovieVector3;
    /** The foot's world rotation. */
    rotation: IAutoMovieQuaternion;
    /** The toes' flexion from the foot, degrees, positive lifting them. */
    toes: number;
  }

  /** Both heels' placements and toe bends at an authored posture. */
  type FeetRaised = Readonly<Record<AutoMovieHumanSide, IHeeled>>;

  /** A direct read of both heel placements from the authored hip positions. */
  type HeelReader = (posture: IAutoMovieMotionHumanPosture) => FeetRaised;

  /**
   * A plan whose feet stay planted until a second: its posture with both legs'
   * goals at the entry feet; after it, over `FADE`, each goal travels to where
   * the plan's own legs put the foot, so the legs return to the fall's shape
   * without a jump. Written over the composed posture, so the fall's own leg
   * joints stay one movement.
   *
   * @param plan The fall's authored root and joint track, with no limb or digit
   *   goals before the planted feet are added.
   * @param entry The entry state, its feet.
   * @param body The body, for the released feet's displayed frames.
   * @param until Seconds since the action's start the feet stay planted until.
   * @param knee How high above the ankle the knee's hint lies, metres; it leans
   *   ahead along the heading by four tenths of that.
   * @param heels Whether a held foot whose hip rises past its leg's reach
   *   raises its heel about the ball (`heeled`), as a body lifted off its feet
   *   does, instead of leaving the leg short of its foot; false when absent.
   * @returns The plan with its feet held.
   */
  export function hold(
    plan: IAutoMovieMotionHumanActionPlan,
    entry: IAutoMovieMotionHumanEntryState,
    body: IAutoMovieMotionHumanBody,
    until: number,
    knee: number,
    heels: boolean = false,
  ): IAutoMovieMotionHumanActionPlan {
    // Each held foot's ball on the floor and its leg's full length, read
    // once from the entry, with the plan, for a heel rise.
    const raise = (): Record<AutoMovieHumanSide, IRaise> => {
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, entry.pose);
      const of = (side: AutoMovieHumanSide): IRaise => ({
        ball: HumanFoot.sockets(body, bones, side).find(
          (s: IAutoMovieMotionHumanFoot.ISocket): boolean =>
            s.socket === "ball",
        )!.point,
        length:
          Vector3.distance(
            body.rest.get(`${side}UpperLeg`)!,
            body.rest.get(`${side}LowerLeg`)!,
          ) +
          Vector3.distance(
            body.rest.get(`${side}LowerLeg`)!,
            body.rest.get(`${side}Foot`)!,
          ),
      });
      return { left: of("left"), right: of("right") };
    };
    const raising: Record<AutoMovieHumanSide, IRaise> | undefined = heels
      ? raise()
      : undefined;
    const yaw: number = (entry.posture.yaw * Math.PI) / 180;
    const ahead: IAutoMovieVector3 = {
      x: 0.4 * knee * Math.sin(yaw),
      y: knee,
      z: 0.4 * knee * Math.cos(yaw),
    };
    // The feet's world rotations at rest, so a displayed foot's rotation can
    // be stated from its rest as a goal states it.
    const readFeet: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      HumanBoneGroups.FEET,
    );
    const rest: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = readFeet(
      assembleHumanPosture(body, {
        root: { x: 0, y: 0, z: 0 },
        yaw: 0,
        pitch: 0,
        roll: 0,
        joints: {},
        limbs: {},
      }).pose,
    );
    const lift: HeelReader | undefined =
      raising === undefined ? undefined : prepareHeelRise(raising);
    const released: FeetRaised | undefined =
      lift === undefined ? undefined : lift(plan.posture(until));

    function prepareHeelRise(
      measurements: Record<AutoMovieHumanSide, IRaise>,
    ): HeelReader {
      const readHips: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
        body,
        HumanBoneGroups.THIGHS,
      );
      return (posture: IAutoMovieMotionHumanPosture): FeetRaised => {
        const hips: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          readHips(assembleHumanPosture(body, posture).pose);
        const foot = (side: AutoMovieHumanSide): IHeeled =>
          heeled(
            entry.feet[side],
            measurements[side].ball,
            hips.get(`${side}UpperLeg`)!.worldPosition,
            measurements[side].length,
          );
        return { left: foot("left"), right: foot("right") };
      };
    }

    return {
      ...plan,
      posture: (
        seconds: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const posture: IAutoMovieMotionHumanPosture = plan.posture(
          seconds,
          channels,
          resolution,
          projection,
        );
        if (seconds >= until + FADE) return posture;
        const s: number =
          seconds <= until ? 0 : minimumJerk.share((seconds - until) / FADE);
        // The released foot follows the clamped authored shape through the
        // fade. Its bones are direct FK of that shape.
        const shown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> | undefined =
          s > 0 ? readFeet(assembleHumanPosture(body, posture).pose) : undefined;
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...posture.limbs,
        };
        const joints: IAutoMovieMotionHumanPosture["joints"] = {
          ...posture.joints,
        };
        const raised: FeetRaised | undefined =
          seconds >= until ? released : lift?.(posture);
        for (const side of ["left", "right"] as const) {
          const entered: IAutoMovieMotionHumanEntryState.IFoot =
            entry.feet[side];
          const lifted: IHeeled | undefined = raised?.[side];
          const foot: IAutoMovieMotionHumanEntryState.IFoot =
            lifted === undefined
              ? entered
              : { ...entered, ankle: lifted.ankle, rotation: lifted.rotation };
          if (lifted !== undefined)
            joints[`${side}Toes`] = [
              lifted.toes * (1 - s) +
                (posture.joints[`${side}Toes`]?.[0] ?? 0) * s,
              0,
              0,
            ];
          const bone: AutoMovieHumanoidBone = `${side}Foot`;
          const point: IAutoMovieVector3 =
            shown === undefined
              ? foot.ankle
              : Vector3.lerp(foot.ankle, shown.get(bone)!.worldPosition, s);
          const rotation: IAutoMovieQuaternion =
            shown === undefined
              ? foot.rotation
              : Quaternion.slerp(
                  foot.rotation,
                  Quaternion.multiply(
                    shown.get(bone)!.worldRotation,
                    Quaternion.inverse(rest.get(bone)!.worldRotation),
                  ),
                  s,
                );
          limbs[`${side}Leg`] = {
            point,
            rotation,
            bend: Vector3.add(point, ahead),
            planted: s === 0,
          } satisfies IAutoMovieHumanLimbGoal;
        }
        return { ...posture, joints, limbs };
      },
    };
  }

  /**
   * The feet's plant windows until a share of the action.
   *
   * @param until The share the feet stay planted until.
   * @returns Both feet's plant windows.
   */
  export function plants(until: number): IAutoMovieMotionHumanContactWindow[] {
    return FEET.map(
      (
        part: IAutoMovieMotionHumanContactWindow["part"],
      ): IAutoMovieMotionHumanContactWindow => ({
        part,
        kind: "plant",
        from: 0,
        to: until,
        support: { kind: "ground" },
      }),
    );
  }
}

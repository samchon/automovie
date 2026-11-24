import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieBodyMeasure,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBendLower,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { HumanTrunk } from "./HumanTrunk";

/** The body proportions fixed by the selected lowering strategy. */
interface IStrategyGeometry {
  readonly drop: number;
  readonly retreat: number;
  readonly deepest: number;
}

/** A current-pose root adjustment with the caller's synchronous FK source. */
type Lower = ReturnType<typeof lowerHumanPosture.prepare>;

/**
 * A standing body lowered toward a low target by a strategy, and the trunk
 * pitch that brings the shoulder within reach: the posture transforms the bend
 * law solves its reach and balance on, split from the law so each file holds
 * one responsibility.
 */
export namespace bendLower {
  /** Wrist placement on the actual lowered bones from this trial. */
  export type WristAt = (
    posture: IAutoMovieMotionHumanPosture,
    read: ReturnType<typeof prepareHumanPoseResolution>,
  ) => IAutoMovieVector3;

  /** A named bend strategy after resolving the automatic choice. */
  type Strategy = IAutoMovieMotionHumanBendLower.ISolved["strategy"];

  /**
   * The knee flexion each strategy lifts at, degrees: a semi-squat's 90 and a
   * squat's 135, the knee angles that tell the lifting postures apart
   * (Washmuth, McAfee and Bickel 2022, Int J Sports Phys Ther 17:104), and a
   * stoop's 30, inside that classification's stoop, knees flexed under 45
   * degrees (the class is bounded, not measured at a value: 30 is provisional
   * within it).
   */
  export const KNEE: Readonly<Record<Strategy, number>> = {
    stoop: 30,
    semiSquat: 90,
    squat: 135,
  };

  /**
   * The ankle's dorsiflexion in a crouch, degrees: the most measured while
   * crouching, 28 +- 10 at a knee flexion of 149 +- 6 (Hyodo, Masuda, Aizawa,
   * Jinno and Morita 2017, Braz J Phys Ther 21:159, electromagnetic tracking of
   * 26 adults), within the range table's loaded maximum
   * (`ANKLE_DORSIFLEXION.loaded`).
   */
  export const ANKLE: number = 28;

  /**
   * Stoop's posterior hip key as a share of stature. Kim and Yoo (2018,
   * doi:10.1589/jpts.30.534) measured 7.6 cm at the greater trochanter in
   * adults of 1.57 m mean stature and 17.4° mean thoracolumbar flexion. The
   * rig's lumbopelvic rhythm converts that local flexion to trunk inclination.
   * The ratio below scales the key on the existing sine course.
   */
  export const STOOP_BACK: number =
    0.076 /
    1.57 /
    Math.sin(
      (17.4 * Math.PI) /
        (180 * (HumanTrunk.RHYTHM.lumbar + HumanTrunk.RHYTHM.thorax)),
    );

  /**
   * The share of the standing hip height a strategy keeps, from the body's own
   * leg: the knee flexed by the strategy's `KNEE`, split between the shank's
   * forward tilt and the thigh's, half each so the hip stays over the ankle on
   * a thigh and shank of nearly equal length (Winter, Biomechanics and Motor
   * Control of Human Movement, fig. 4.1: 0.245 and 0.246 of stature), the
   * shank's tilt no more than the crouching ankle's `ANKLE` and the heel lift
   * `HEEL` allow.
   *
   * @param body The body, for its ankle height, shank and thigh.
   * @param strategy The strategy.
   * @returns The share, in (0, 1].
   */
  export function hipShare(
    body: {
      measure: Pick<IAutoMovieBodyMeasure, "ankleHeight" | "shank" | "thigh">;
    },
    strategy: Strategy,
  ): number {
    const m: Pick<IAutoMovieBodyMeasure, "ankleHeight" | "shank" | "thigh"> =
      body.measure;
    const knee: number = KNEE[strategy];
    const shank: number = Math.min(knee / 2, ANKLE + HEEL[strategy]);
    const rad: number = Math.PI / 180;
    return (
      (m.ankleHeight +
        m.shank * Math.cos(shank * rad) +
        m.thigh * Math.cos((knee - shank) * rad)) /
      (m.ankleHeight + m.shank + m.thigh)
    );
  }

  /**
   * A standing posture lowered by a strategy: the hips dropped by a share of
   * the strategy's drop and moved back along its key, the trunk pitched, the
   * planted legs re-solved by their unchanged goals.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param strategy The strategy.
   * @param pitch Trunk inclination, degrees, shared by the lumbopelvic rhythm.
   * @param share How far down, 0 to 1.
   * @param back How far the hips move back, metres.
   * @param resolution Optional exact FK source borrowed only by this call's
   *   actual raw-pelvis hip observation; this lowering operation performs no
   *   ROM projection.
   * @returns The lowered posture.
   */
  export function lower(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    strategy: Strategy,
    pitch: number,
    share: number,
    back: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    lateral: number = 0,
  ): IAutoMovieMotionHumanPosture {
    return current(
      body,
      posture,
      strategy,
      pitch,
      share,
      back,
      resolution,
      lateral,
    );
  }

  /**
   * Bind a fixed body's strategy at selection. Each descent or return sample
   * still reads its standing pose, actual heel contact and hip FK.
   *
   * @param body The unchanged body supporting the lowering.
   * @param strategy The selected lowering strategy.
   * @returns A reader taking current standing posture, trunk degrees, movement
   *   share, posterior metres and optional FK and lateral degrees.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    strategy: Strategy,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    pitch: number,
    share: number,
    back: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    lateral?: number,
  ) => IAutoMovieMotionHumanPosture {
    const geometry: IStrategyGeometry = {
      drop: hipDrop(body, strategy),
      retreat: retreat(body, strategy),
      deepest: strategy === "stoop" ? stoopReach(body) : 0,
    };
    const lowerPlanted: Lower = lowerHumanPosture.prepare(body);
    return (posture, pitch, share, back, resolution, lateral = 0) =>
      current(
        body,
        posture,
        strategy,
        pitch,
        share,
        back,
        resolution,
        lateral,
        geometry,
        lowerPlanted,
      );
  }

  /** Vertical movement at full depth, metres. */
  function hipDrop(
    body: IAutoMovieMotionHumanBody,
    strategy: Strategy,
  ): number {
    return (1 - hipShare(body, strategy)) * body.measure.hipHeight;
  }

  /** Sagittal movement at full depth with the strategy's shank tilt, metres. */
  function retreat(
    body: IAutoMovieMotionHumanBody,
    strategy: Strategy,
  ): number {
    const knee: number = KNEE[strategy];
    const shank: number =
      (Math.min(knee / 2, ANKLE + HEEL[strategy]) * Math.PI) / 180;
    return strategy === "stoop"
      ? 0
      : body.measure.thigh * Math.sin((knee * Math.PI) / 180 - shank) -
          body.measure.shank * Math.sin(shank);
  }

  /** The squared hip-to-ankle distance of the deepest stoop, square metres. */
  function stoopReach(body: IAutoMovieMotionHumanBody): number {
    const { thigh, shank }: IAutoMovieMotionHumanBody["measure"] = body.measure;
    return (
      thigh * thigh +
      shank * shank +
      2 * thigh * shank * Math.cos((KNEE.stoop * Math.PI) / 180)
    );
  }

  /** Evaluate the current pivots and trunk against that second's actual stance. */
  function current(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    strategy: Strategy,
    pitch: number,
    share: number,
    back: number,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    lateral: number,
    fixed?: IStrategyGeometry,
    lowerPlanted?: Lower,
  ): IAutoMovieMotionHumanPosture {
    if (share <= 0 && pitch === 0 && back === 0) return posture;
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const drop: number = (fixed?.drop ?? hipDrop(body, strategy)) * share;
    // The same two links that set the hip height also set its sagittal
    // position over the planted ankle. Without the horizontal component
    // a squat asks its shank to tip farther forward than its ankle allows.
    const backAtDepth: number = fixed?.retreat ?? retreat(body, strategy);
    const frame: IAutoMovieMotionHumanFrame = {
      origin: posture.root,
      yaw: posture.yaw,
    };
    const goal: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: hips.x,
      y: hips.y - drop,
      z: hips.z - back - share * backAtDepth,
    });
    const level: IAutoMovieVector3 = Vector3.subtract(
      goal,
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
        hips,
      ),
    );
    // A squat deeper than the ankles' 20 degree dorsiflexion range lets the
    // heels rise, each foot turning about its toes' joint, the contact its
    // goal names (provisional heel lift).
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    const heel: number = HEEL[strategy] * share;
    if (heel > 0)
      for (const leg of ["leftLeg", "rightLeg"] as const) {
        const goal0: IAutoMovieHumanLimbGoal | undefined = posture.limbs[leg];
        if (goal0 === undefined || goal0.rotation === undefined) continue;
        const side: AutoMovieHumanSide = leg === "leftLeg" ? "left" : "right";
        const flat: IAutoMovieMotionHumanFoot.IPlacement = {
          ankle: goal0.point,
          rotation: goal0.rotation,
        };
        const lifted: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
          body,
          side,
          "mtp",
          HumanFoot.point(body, side, "mtp", flat),
          HumanFoot.heading(goal0.rotation),
          -heel,
        );
        limbs[leg] = {
          ...goal0,
          point: lifted.ankle,
          rotation: lifted.rotation,
          contact: HumanFoot.offset(body, side, "mtp"),
        };
      }

    // The pelvis tilts by what the hips leave it over the ankles as the legs
    // will hold them: a lifted heel raises its ankle and folds the thigh
    // further, so the limit is read after the lift.
    const tilt: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      posture.joints,
      pitch,
      HumanTrunk.pelvisLimit(body, level, posture.yaw, {
        left: limbs.leftLeg!.point,
        right: limbs.rightLeg!.point,
      }),
    );
    const tipped: IAutoMovieMotionHumanPosture = {
      ...posture,
      pitch: posture.pitch + tilt.pitch,
    };
    const joints: IAutoMovieMotionHumanPosture["joints"] =
      lateral === 0 ? tilt.joints : { ...tilt.joints };
    if (lateral !== 0) {
      // The lumbar and thoracic sections share the frontal inclination as
      // in a unilateral carry. Preserve each section's flexion and twist.
      for (const bone of ["spine", "chest"] as const) {
        const angles: NonNullable<typeof joints.spine> = joints[bone] ?? [
          0, 0, 0,
        ];
        joints[bone] = [
          angles[0],
          angles[1] + (lateral * share) / 2,
          angles[2],
        ];
      }
    }

    // With the heels up the toes bend at their joints and stay flat on the floor.
    const toes: IAutoMovieMotionHumanPosture["joints"] =
      heel > 0 ? { leftToes: [heel, 0, 0], rightToes: [heel, 0, 0] } : {};
    let placed: IAutoMovieMotionHumanPosture = {
      ...tipped,
      joints: { ...joints, ...toes },
      limbs,
      root: Vector3.subtract(
        goal,
        Quaternion.rotateVector(humanPostureHeading(tipped), hips),
      ),
    };
    if (strategy === "stoop" && share > 0) {
      // The horizontal retreat also changes hip-to-ankle length. Recover
      // the key's knee height from the actual planted ankle. The length
      // between these keys starts at the standing leg's displayed length.
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      const standing: ReturnType<typeof hipJoints> = hipJoints(
        body,
        posture.root,
        humanPostureHeading(posture),
        posture.joints.hips,
        read(),
      );
      const lowered: ReturnType<typeof hipJoints> = hipJoints(
        body,
        placed.root,
        humanPostureHeading(placed),
        placed.joints.hips,
        read(),
      );
      const deepest: number = fixed?.deepest ?? stoopReach(body);
      const drop: number = Math.min(
        ...(["left", "right"] as const).map(
          (side: AutoMovieHumanSide): number => {
            const ankle: IAutoMovieVector3 = limbs[`${side}Leg`]!.point;
            const from: IAutoMovieVector3 = Vector3.subtract(
              standing[side],
              ankle,
            );
            const current: IAutoMovieVector3 = Vector3.subtract(
              lowered[side],
              ankle,
            );
            const initial: number = Vector3.dot(from, from);
            const height: number =
              initial +
              (deepest - initial) * share -
              current.x * current.x -
              current.z * current.z;
            return height < 0 ? -Infinity : current.y - Math.sqrt(height);
          },
        ),
      );
      if (drop > -Infinity)
        placed = {
          ...placed,
          root: { ...placed.root, y: placed.root.y - drop },
        };
    }
    return lowerPlanted === undefined
      ? lowerHumanPosture(body, placed, undefined, resolution)
      : lowerPlanted(placed, resolution);
  }

  /**
   * Heel lift by strategy at full depth, degrees (provisional: only the squat
   * outruns the ankle's dorsiflexion).
   */
  export const HEEL: Readonly<Record<Strategy, number>> = {
    stoop: 0,
    semiSquat: 0,
    squat: 30,
  };

  /**
   * The frontal inclination that directs the upper trunk toward a target beside
   * the body: the target's lateral displacement from the hips over the
   * pelvis-to-shoulder lever, as the lowering's `lateral` takes it.
   *
   * @param body The body.
   * @param upright The standing posture the target is read from.
   * @param target The target, world metres.
   * @param side The reaching hand.
   * @returns Degrees, toward the target's side.
   */
  export function lateralTilt(
    body: IAutoMovieMotionHumanBody,
    upright: IAutoMovieMotionHumanPosture,
    target: IAutoMovieVector3,
    side: AutoMovieHumanSide,
  ): number {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const shoulder: IAutoMovieVector3 = body.rest.get(`${side}UpperArm`)!;
    const local: IAutoMovieVector3 = HumanFrame.local(
      { origin: upright.root, yaw: upright.yaw },
      target,
    );
    return (Math.atan2(hips.x - local.x, shoulder.y - hips.y) * 180) / Math.PI;
  }

  /**
   * The share of the arm (upper arm and forearm) a lowered or leaned body
   * brings the shoulder within of its target, so the arm reaches near, not at,
   * full extension: where people reaching as they like stop reaching with the
   * arm alone and lean the trunk in, the preferred critical boundary, 0.89 of
   * full-arm extension, the centre of the measured 0.83 to 0.95 (Petrovic 2012,
   * Miami University dissertation, Experiment 1, Table 1 and Fig. 3, 10 seated
   * adults: 0.92, 0.88 and 0.83 holding 300, 650 and 1000 g, SD 0.06 to 0.07;
   * Mark et al. 1997, J Exp Psychol Hum Percept Perform 23:1365, and Stasik and
   * Mark 2005: 0.95, as Petrovic reports them). The studies reach seated; no
   * standing measure was found. `pitch` reads it, and a pick up's lift closes
   * on it too.
   */
  export const REACH: number = 0.89;
}

import { Vector3, AutoMovieEngineMotionSampling, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walk } from "../../gait/internal/walk";
import { walkReach } from "../../actions/internal/walkReach";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { bendLower } from "../../everyday/internal/bendLower";
import { pickUpAdjust } from "./pickUpAdjust";
import { pickUpAdjustShoulder } from "./pickUpAdjustShoulder";
import { pickUpAdjustTimed } from "./pickUpAdjustTimed";
import type { pickUpPosture } from "./pickUpPosture";
import { pickUpStepReach } from "./pickUpStepReach";

/**
 * A stance that takes one adjustment step toward a grip its arm still misses, a
 * foot stepping toward the wrist's place: the least step whose half, the pelvis
 * riding midway between the feet, brings the shoulder within the arm, up to
 * `STEP`. The foot leaves and lands at `STEPPING` of the reach's time on a
 * minimum-jerk path lifted by the walk's mid-swing clearance; the other foot
 * stays planted. A target `LATERAL` or more from the facing is stepped toward
 * with the foot on its side; nearer the midline, where people choose either
 * foot, with the foot whose step reaches shorter, the one that leaves the most
 * of `STEP` unused, and the reaching side's where both reach alike. A grip one
 * step does not bring within reach is none of a reach's: the person steps
 * closer first.
 *
 * @param context The action's body.
 * @param side The reaching arm.
 * @param wrist Where the wrist must go on the grip, world metres.
 * @param stance The stance to step from.
 * @param lifted Where the wrist must also come by the lift's end, world metres:
 *   the step then brings the shoulder within `bendLower.REACH` of the arm of
 *   it, the arm near and not at full extension, or else within the arm
 *   (`pickUpStance`). The grip alone when absent.
 * @param reach How near the shoulder must come to the wrist, metres. The arm's
 *   length when absent.
 * @param accept Optional admission of the actual stepped base, including
 *   another reach adjustment. If the direct step fails, success must stay
 *   monotone up to the permitted maximum.
 * @returns The stepped stance, or null when one step does not reach or the
 *   stance places no foot.
 */
export function pickUpAdjustStepped(
  context: Pick<IAutoMovieMotionHumanActionContext<object>, "body">,
  side: AutoMovieHumanSide,
  wrist: IAutoMovieVector3,
  stance: pickUpPosture.IStance,
  lifted?: IAutoMovieVector3,
  reach?: number,
  accept?: Accept,
): pickUpPosture.IStance | null {
  const readShoulder: ReturnType<typeof HumanTrunk.prepareResolve> =
    HumanTrunk.prepareResolve(
      context.body,
      new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]),
    );
  const readHips: ReturnType<typeof HumanTrunk.prepareResolve> =
    HumanTrunk.prepareResolve(
      context.body,
      new Set<AutoMovieHumanoidBone>(["leftUpperLeg", "rightUpperLeg"]),
    );
  const from: IAutoMovieVector3 = pickUpAdjustShoulder(
    side,
    stance.posture,
    readShoulder,
  );
  const flat: IAutoMovieVector3 = {
    x: wrist.x - from.x,
    y: 0,
    z: wrist.z - from.z,
  };
  if (Vector3.length(flat) < 1e-9) return null;
  const toward: IAutoMovieVector3 = Vector3.normalize(flat);
  const arm: number =
    context.body.measure.upperArm + context.body.measure.forearm;
  const longest: number =
    (pickUpAdjust.STEP * context.body.measure.stature) / pickUpAdjust.STATURE;
  const clearance: number =
    walk.walking(walk.FROUDE.normal).lift * context.body.measure.hipHeight;

  // A target to the side is stepped toward with the foot on its side;
  // nearer the midline either foot is tried, the reaching side's first.
  const yaw: number = (stance.posture.yaw * Math.PI) / 180;
  const across: number = Vector3.dot(toward, {
    x: Math.cos(yaw),
    y: 0,
    z: -Math.sin(yaw),
  });
  const feet: readonly AutoMovieHumanSide[] =
    Math.abs(across) >= Math.sin((pickUpAdjust.LATERAL * Math.PI) / 180)
      ? [across > 0 ? "left" : "right"]
      : [side, side === "left" ? "right" : "left"];

  // The places the step must bring within reach, each with its reach:
  // the grip within the arm, and the lifted place near full extension or
  // else within the arm.
  const wristReach: pickUpStepReach.IReach = [wrist, reach ?? arm];
  const reaches: readonly (readonly pickUpStepReach.IReach[])[] =
    lifted === undefined
      ? [[wristReach]]
      : [
          [wristReach, [lifted, bendLower.REACH * arm]],
          [wristReach, [lifted, arm]],
        ];
  const hips: ReturnType<typeof HumanTrunk.resolve> = readHips(stance.posture);
  const short: ReturnType<typeof walkReach.prepareShort> =
    walkReach.prepareShort(context.body);
  let best: Step = null;
  for (const foot of feet) {
    const taken: Step = take(foot);
    if (taken !== null && (best === null || taken.length < best.length))
      best = taken;
  }
  return best === null ? null : best.stance;

  /**
   * The least step of a foot that reaches, and its stance; null when one step
   * does not.
   */
  function take(foot: AutoMovieHumanSide): Step {
    const leg: Leg = `${foot}Leg`;
    if (stance.posture.limbs[leg] === undefined) return null;
    const fixed: AutoMovieHumanSide = foot === "left" ? "right" : "left";
    const fixedLeg: Leg = `${fixed}Leg`;

    // The body with its foot moved `length` along the floor, a share of it.
    const step: (
      posture: IAutoMovieMotionHumanPosture,
      length: number,
      share: number,
      resolution?: IFK,
    ) => IAutoMovieMotionHumanPosture = (
      posture: IAutoMovieMotionHumanPosture,
      length: number,
      share: number,
      resolution?: IFK,
    ): IAutoMovieMotionHumanPosture => {
      if (length <= 0 || share <= 0) return posture;
      const goal: IAutoMovieHumanLimbGoal | undefined = posture.limbs[leg];
      if (goal === undefined) return posture;

      // The foot's own progress, by the reach's time at this share of the
      // way.
      const u: number = Math.min(
        1,
        Math.max(
          0,
          (pickUpAdjustTimed(share) - pickUpAdjust.STEPPING[0]) /
            (pickUpAdjust.STEPPING[1] - pickUpAdjust.STEPPING[0]),
        ),
      );
      const moved: number = length * AutoMovieEngineMotionSampling.minimumJerkShare(u);
      const shifted: IAutoMovieVector3 = Vector3.add(
        posture.root,
        Vector3.scale(toward, (length * share) / 2),
      );

      // The pelvis comes down as far as either planted leg asks to reach
      // its foot, as a walk's does (`walkReach.short`).
      const ankle: Ankle = posture.limbs[fixedLeg];
      const drop: number =
        ankle === undefined
          ? 0
          : Math.max(
              0,
              short(
                readHips({ ...posture, root: shifted }, resolution).get(
                  `${fixed}UpperLeg`,
                )!.worldPosition,
                ankle.point,
              ),
            );
      return {
        ...posture,
        root: { ...shifted, y: shifted.y - drop },
        limbs: {
          ...posture.limbs,
          [leg]: {
            ...goal,
            point: {
              x: goal.point.x + toward.x * moved,
              y: goal.point.y + clearance * Math.sin(Math.PI * u),
              z: goal.point.z + toward.z * moved,
            },
          },
        },
      };
    };

    // How far past its reach the furthest place lies, metres.
    const ankle: Ankle = stance.posture.limbs[fixedLeg];
    const hip: IAutoMovieVector3 = hips.get(`${fixed}UpperLeg`)!.worldPosition;
    const dropAt: (length: number) => number = (length: number): number =>
      ankle === undefined || length <= 0
        ? 0
        : Math.max(
            0,
            short(Vector3.addScaled(hip, toward, length / 2), ankle.point),
          );
    const gap: (
      places: readonly pickUpStepReach.IReach[],
      length: number,
    ) => number = (
      places: readonly pickUpStepReach.IReach[],
      length: number,
    ): number => {
      const at: IAutoMovieVector3 = Vector3.addScaled(from, toward, length / 2);
      at.y -= dropAt(length);
      return Math.max(
        ...places.map(
          ([place, limit]: pickUpStepReach.IReach): number =>
            Vector3.length(Vector3.subtract(place, at)) - limit,
        ),
      );
    };
    let length: Travel = null;
    for (const places of reaches) {
      const direct: Travel = pickUpStepReach(from, toward, places, longest);
      if (direct !== null && dropAt(direct) === 0) {
        length = direct;
        break;
      }
      if (gap(places, longest) <= 0) {
        // The planted leg bends the shoulder path away from the horizontal
        // solution. Refine the feasible length to a tenth of a millimetre.
        length = AutoMovieEngineMath.bracketedBisection(
          (tried: number): boolean => gap(places, tried) > 0,
          0,
          longest,
          1e-4,
        );
        break;
      }
    }
    if (
      accept !== undefined &&
      length !== null &&
      !accept(step(stance.posture, length, 1))
    )
      length = null;
    if (
      length === null &&
      accept !== undefined &&
      accept(step(stance.posture, longest, 1))
    )
      length = AutoMovieEngineMath.bracketedBisection(
        (tried: number): boolean => !accept(step(stance.posture, tried, 1)),
        0,
        longest,
        1e-4,
      );
    if (length === null) return null;
    const travel: number = length;
    return {
      length: travel,
      stance: {
        posture: step(stance.posture, travel, 1),
        at: (
          s: number,
          resolution?: IFK,
          projection?: IROM,
        ): IAutoMovieMotionHumanPosture =>
          step(stance.at(s, resolution, projection), travel, s, resolution),
        lower: (
          posture: IAutoMovieMotionHumanPosture,
          s: number,
          resolution?: IFK,
          projection?: IROM,
        ): IAutoMovieMotionHumanPosture =>
          step(
            stance.lower(posture, s, resolution, projection),
            travel,
            s,
            resolution,
          ),
        step: {
          side: foot,
          off: pickUpAdjust.STEPPING[0],
          on: pickUpAdjust.STEPPING[1],
        },
      },
    };
  }
}

/** A ready stance and the distance its adjustment foot travels, metres. */
interface IStep {
  /** Foot travel along the floor, metres. */
  length: number;

  /** The body and its retained step schedule. */
  stance: pickUpPosture.IStance;
}

/** The requested adjustment may lie beyond a single step. */
type Step = IStep | null;

/** The least foot travel, if its reach intersects the permitted course. */
type Travel = pickUpStepReach.Distance;

/** The opposite ankle is absent when the entry has no placement for it. */
type Ankle = IAutoMovieHumanLimbGoal | undefined;

/** Whether another admitted reach adjustment can use the stepped base. */
type Accept = (posture: IAutoMovieMotionHumanPosture) => boolean;

/** A leg goal addressed by the side of its support. */
type Leg = `${AutoMovieHumanSide}Leg`;

/** Same-person exact FK loan borrowed by an actual adjusted stance invocation. */
type IFK = Parameters<pickUpPosture.IStance["at"]>[1];

type IROM = Parameters<pickUpPosture.IStance["at"]>[2];

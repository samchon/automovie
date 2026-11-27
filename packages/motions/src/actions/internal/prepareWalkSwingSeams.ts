import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { WALK_TICK } from "./WALK_TICK";
import type { walkLocomoteSwings } from "./walkLocomoteSwings";
import { walkReach } from "./walkReach";

/*
 * The plant fitter can re-aim an ankle and tip its toes to hold the ground.
 * Carry its actual pose into the adjacent swing before fading the correction
 * over the existing reach band (Kovar, Schreiner and Gleicher, 2002, §4.5).
 * Prepare only the endpoints where the foot changes which solver it uses.
 */
export function prepareWalkSwingSeams(
  body: IAutoMovieMotionHumanBody,
  swings: readonly walkLocomoteSwings.ISwing[],
  posture: (
    side: AutoMovieHumanSide,
    seconds: number,
  ) => IAutoMovieMotionHumanPosture,
): (
  side: AutoMovieHumanSide,
  swing: Flight,
  goal: IAutoMovieHumanLimbGoal,
  joints: IAutoMovieMotionHumanPosture["joints"],
) => void {
  const correction: Record<AutoMovieHumanSide, Map<number, ISeams>> = {
    left: new Map(),
    right: new Map(),
  };
  for (const { side, off, on } of swings) {
    const planted = (t: number): IFoot => {
      const source: IAutoMovieMotionHumanPosture = posture(side, t);
      const foot: AutoMovieHumanoidBone = `${side}Foot`;
      const knee: AutoMovieHumanoidBone = `${side}LowerLeg`;
      const toe: AutoMovieHumanoidBone = `${side}Toes`;
      const demand: ReadonlySet<AutoMovieHumanoidBone> = new Set([foot]);
      const { pose }: ReturnType<typeof resolveHumanPosture.seeded> =
        resolveHumanPosture.seeded(
          body,
          source,
          undefined,
          {},
          undefined,
          demand,
        );
      const bones: ReturnType<typeof poseBones> = poseBones(
        body,
        pose,
        undefined,
        new Set([foot, knee]),
      );
      return {
        ankle: bones.get(foot)!.worldPosition,
        knee: bones.get(knee)!.worldPosition,
        rotation: bones.get(foot)!.worldRotation,
        toes: pose.joints.find((joint) => joint.bone === toe)?.flexion ?? 0,
      };
    };
    const flying = (t: number): IFoot => {
      const raw: IAutoMovieMotionHumanPosture = posture(side, t);
      const goal: IAutoMovieHumanLimbGoal = raw.limbs[`${side}Leg`]!;
      return {
        ankle: goal.point,
        knee: goal.bend,
        rotation: goal.rotation!,
        toes: raw.joints[`${side}Toes`]![0],
      };
    };
    const departTick: number = Math.min(WALK_TICK, off / 2);
    const landTick: number = Math.min(WALK_TICK, (on - off) / 2);
    correction[side].set(off, {
      departure:
        off === 0
          ? undefined
          : difference(
              extrapolate(
                planted(off - departTick),
                planted(off - 2 * departTick),
              ),
              flying(off),
            ),
      landing: difference(
        planted(on),
        extrapolate(flying(on - landTick), flying(on - 2 * landTick)),
      ),
    });
  }
  return (side, swing, goal, joints): void => {
    const u: number = swing.u;
    const edge: number = u < walkReach.FADE ? u : 1 - u;
    if (edge >= walkReach.FADE) return;
    const seams: ISeams | undefined = correction[side].get(swing.off);
    const adjustment: IAdjustment | undefined =
      u < walkReach.FADE ? seams?.departure : seams?.landing;
    if (adjustment === undefined) return;
    const weight: number = 1 - AutoMovieEngineMotionSampling.minimumJerkShare(edge / walkReach.FADE);
    goal.point = Vector3.add(
      goal.point,
      Vector3.scale(adjustment.ankle, weight),
    );
    goal.bend = Vector3.add(goal.bend, Vector3.scale(adjustment.knee, weight));
    goal.rotation = Quaternion.multiply(
      adjustment.turn(weight),
      goal.rotation!,
    );
    const toe: AutoMovieHumanoidBone = `${side}Toes`;
    joints[toe] = [joints[toe]![0] + weight * adjustment.toes, 0, 0];
  };
}

interface IFoot {
  ankle: IAutoMovieVector3;
  knee: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
  toes: number;
}

interface IAdjustment {
  ankle: IAutoMovieVector3;
  knee: IAutoMovieVector3;
  turn: ReturnType<typeof Quaternion.prepareSlerp>;
  toes: number;
}

interface ISeams {
  departure: IAdjustment | undefined;
  landing: IAdjustment;
}

type Flight = NonNullable<IAutoMovieMotionHumanWalkFoot.IScheduled["swing"]>;

/*
 * One tick along the owning phase's existing backward endpoint estimate.
 */
function extrapolate(last: IFoot, previous: IFoot): IFoot {
  return {
    ankle: Vector3.add(
      last.ankle,
      Vector3.subtract(last.ankle, previous.ankle),
    ),
    knee: Vector3.add(last.knee, Vector3.subtract(last.knee, previous.knee)),
    rotation: Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.multiply(
          last.rotation,
          Quaternion.inverse(previous.rotation),
        ),
        last.rotation,
      ),
    ),
    toes: 2 * last.toes - previous.toes,
  };
}

/*
 * The unconstrained goal's correction at the change of solver.
 */
function difference(held: IFoot, free: IFoot): IAdjustment {
  return {
    ankle: Vector3.subtract(held.ankle, free.ankle),
    knee: Vector3.subtract(held.knee, free.knee),
    turn: Quaternion.prepareSlerp(
      { x: 0, y: 0, z: 0, w: 1 },
      Quaternion.multiply(held.rotation, Quaternion.inverse(free.rotation)),
    ),
    toes: held.toes - free.toes,
  };
}

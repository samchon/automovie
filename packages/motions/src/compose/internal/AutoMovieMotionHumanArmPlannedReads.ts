import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMoviePose,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { HumanArmClearance } from "../../posture/internal/HumanArmClearance";
import type { HumanArmTrajectory } from "../../posture/internal/HumanArmTrajectory";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import type { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { AutoMovieMotionHumanArmAimed } from "./AutoMovieMotionHumanArmAimed";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";
import { AutoMovieMotionHumanArmCourse } from "./AutoMovieMotionHumanArmCourse";
import { AutoMovieMotionHumanArmObservation } from "./AutoMovieMotionHumanArmObservation";
import { AutoMovieMotionHumanArmPlayed } from "./AutoMovieMotionHumanArmPlayed";

/*
 * The readings of an arms' plan (`AutoMovieMotionHumanArmPlanned.planned`),
 * each made once per exact instant however often the plan and its refinement
 * ask: the posture so far with the planned arms left out and its pose, each
 * arm's goal as the plan perceives it, each arm's own fit there, the reach's
 * and the return's longest probe arc, and the base each arm is read against
 * with the finger state of each planned hand, read from the plan's body, span,
 * arms, prefix posture and borrowed readers.
 * Parameter scope: What the plan builds its readings from.
 * Returns: The readings.
 */
export function AutoMovieMotionHumanArmPlannedReads(
  scope: AutoMovieMotionHumanArmPlannedReads.IScope,
): AutoMovieMotionHumanArmPlannedReads.IReads {
  const {
    body,
    span,
    carries,
    before,
    resolution,
    projection,
  }: AutoMovieMotionHumanArmPlannedReads.IScope = scope;
  // A posture with the planned arms left out.
  const without = (
    p: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture => {
    if (
      carries.every(
        (carry: IAutoMovieMotionHumanArmPlanned.IPlanned): boolean =>
          p.limbs[`${carry.side}Arm`] === undefined,
      )
    )
      return p;
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...p.limbs };
    for (const c of carries) delete limbs[`${c.side}Arm`];
    return { ...p, limbs };
  };

  // Each instant's posture so far and its pose with the planned arms left
  // out, the base each arm is read against, and each arm's goal there as
  // the plan perceives it, each read once however often the plan and its
  // refinement ask (each arm's goal by AutoMovieMotionHumanArmAimed).
  const read: Map<number, IPlannedReadEntry> = new Map();
  // The instant resolved last and its limbs' seeds: an instant within a
  // frame of it continues those fits instead of sweeping every swivel
  // again, the frame-to-frame coherence an animation system's IK keeps
  // (Aristidou et al. 2018, "Inverse kinematics techniques in computer
  // graphics: a survey", Comput. Graph. Forum 37:35, section 7; the
  // feasible swivel nearest the previous one, Tolani, Goswami and Badler
  // 2000, section 3.2.4). An instant farther from it is solved cold.
  let latest: ILatest | undefined;
  const at = (t: number): IPlannedAtResult => {
    let found: IPlannedAtFound | undefined = read.get(t);
    if (found === undefined) {
      const posture: IAutoMovieMotionHumanPosture = before(
        t,
        undefined,
        resolution,
        projection,
      );
      const near: IAutoMovieMotionHumanResolveHumanPosture.INear =
        latest !== undefined && Math.abs(t - latest.seconds) <= CONTINUED
          ? continuing(latest.seeds)
          : {};
      const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
        resolveHumanPosture.seeded(
          body,
          without(posture),
          undefined,
          near,
          resolution,
          undefined,
          projection,
        );
      found = { posture, pose: solved.pose };
      latest = { seconds: t, seeds: solved.seeds };
      read.set(t, found);
    }
    return found;
  };
  const aimed: (a: number, t: number) => IAutoMovieHumanLimbGoal =
    AutoMovieMotionHumanArmAimed(carries, at, resolution, projection);
  const fits: Map<number, IAutoMovieMotionHumanArmAngles.IAngles>[] =
    carries.map(
      (): Map<number, IAutoMovieMotionHumanArmAngles.IAngles> => new Map(),
    );

  /*
   * Travel and the initial guess share only completed fits of the same cached
   * endpoint inputs.
   */
  const fitted = (
    a: number,
    t: number,
  ): IAutoMovieMotionHumanArmAngles.IAngles => {
    let found: IAutoMovieMotionHumanArmAngles.IAngles | undefined =
      fits[a]!.get(t);
    if (found === undefined) {
      const p: IAutoMovieMotionHumanPosture = at(t).posture;
      const c: IAutoMovieMotionHumanArmPlanned.IPlanned = carries[a]!;
      // One planned arm stands alone on the base already resolved without
      // it: the rest of the body is that base's, so only the arm is fitted
      // (the limbs fit in order and nothing reads an arm fitted last).
      // Two planned arms neither of which rides the other are each the
      // same: the posture solve of one arm's goal, where the posture so
      // far gives the other planned arm no goal, fits that one arm on the
      // very base with the other arm as placed (`refitHumanPosture`). A
      // riding pair, or a posture that already aims the other arm, keeps
      // the posture solve.
      const apart: boolean =
        carries.length === 2 &&
        carries.every(
          (o: IAutoMovieMotionHumanArmPlanned.IPlanned): boolean =>
            o.on === undefined,
        ) &&
        carries.every(
          (o: IAutoMovieMotionHumanArmPlanned.IPlanned): boolean =>
            o === c || p.limbs[`${o.side}Arm`] === undefined,
        );
      found = AutoMovieMotionHumanArmAngles.angles(
        carries.length === 1
          ? HumanLimbFit.fit(
              body,
              at(t).pose,
              `${c.side}Arm`,
              aimed(a, t),
              ["left", "right"],
              undefined,
              undefined,
              resolution,
            ).pose
          : apart
            ? HumanLimbFit.fit(
                body,
                at(t).pose,
                `${c.side}Arm`,
                aimed(a, t),
                [c.side === "left" ? "right" : "left"],
                undefined,
                undefined,
                resolution,
              ).pose
            : resolveHumanPosture.seeded(
                body,
                {
                  ...p,
                  limbs: { ...p.limbs, [`${c.side}Arm`]: aimed(a, t) },
                },
                undefined,
                undefined,
                resolution,
                undefined,
                projection,
              ).pose,
        c.side,
      );
      fits[a]!.set(t, found);
    }
    return found;
  };
  const travel = (t: number, sign: PlannedTravelSign): number => {
    let longest: number = 0;
    const p: IAutoMovieMotionHumanPosture = at(t).posture;
    carries.forEach(
      (c: IAutoMovieMotionHumanArmPlanned.IPlanned, a: number): void => {
        const fit: IAutoMovieMotionHumanArmAngles.IAngles = fitted(a, t);
        const rest: IAutoMovieMotionHumanArmAngles.IAngles =
          sign === 1 ? c.rest : (c.back ?? c.rest);
        // The longest probe arc of the blend, read on the base without this
        // arm: the planner's own where it plans one arm, solved here for two.
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...p.limbs };
        delete limbs[`${c.side}Arm`];
        const base: IAutoMoviePose =
          carries.length === 1
            ? at(t).pose
            : resolveHumanPosture.seeded(
                body,
                { ...p, limbs },
                undefined,
                undefined,
                resolution,
                undefined,
                projection,
              ).pose;
        longest = Math.max(
          longest,
          AutoMovieMotionHumanArmObservation.longest(
            body,
            base,
            c.side,
            rest,
            fit,
            resolution,
          ),
        );
      },
    );
    return longest;
  };

  // Each instant's base, one record however often the refinement reads it,
  // so the frames built on it are built once (`HumanArmFrame.of`).
  const bases: Map<number, HumanArmTrajectory.IProblem["bases"][number]> =
    new Map();
  // Each instant's finger state of each planned hand, set as its base is
  // built: the hand is read by it there and shown with it
  // (`AutoMovieMotionHumanArmPlayed`).
  const fingers: Map<number, IAutoMovieMotionHumanPosture["joints"][]> =
    new Map();
  const base = (t: number): HumanArmTrajectory.IProblem["bases"][number] => {
    let found: HumanArmTrajectory.IProblem["bases"][number] | undefined =
      bases.get(t);
    if (found === undefined) {
      const goals: IAutoMovieHumanLimbGoal[] = carries.map(
        (
          _: IAutoMovieMotionHumanArmPlanned.IPlanned,
          a: number,
        ): IAutoMovieHumanLimbGoal => aimed(a, t),
      );
      const states: IAutoMovieMotionHumanPosture["joints"][] = carries.map(
        (
          c: IAutoMovieMotionHumanArmPlanned.IPlanned,
          a: number,
        ): IAutoMovieMotionHumanPosture["joints"] =>
          AutoMovieMotionHumanArmPlayed.grasp(
            body,
            at(t).pose,
            at(t).posture,
            c.side,
            (): IAutoMovieMotionHumanArmAngles.IAngles => fitted(a, t),
          ),
      );
      fingers.set(t, states);
      // On the hold the hand lies on what its goal lays it on: those
      // segments are its contact there, and obstacles on the way. What no
      // human body carries (a prop, an animal) is kept clear of too.
      found = AutoMovieMotionHumanArmObservation.based(
        carries.reduce(
          (
            pose: IAutoMoviePose,
            c: IAutoMovieMotionHumanArmPlanned.IPlanned,
            a: number,
          ): IAutoMoviePose =>
            HumanArmClearance.fingered(pose, c.side, states[a]!),
          at(t).pose,
        ),
        goals,
        carries.map((c: IAutoMovieMotionHumanArmPlanned.IPlanned): boolean =>
          holding(c, t),
        ),
      );
      bases.set(t, found);
    }
    return found;
  };
  // Each arm holds over its own span where it states one (a hold handed
  // from one hand to the other), the group's otherwise.
  const holding = (
    c: IAutoMovieMotionHumanArmPlanned.IPlanned,
    t: number,
  ): boolean => {
    const own: IAutoMovieMotionHumanArmPlanned.ISpan = c.span ?? span;
    return t >= own.ready - 1e-9 && t <= own.relax + 1e-9;
  };
  return {
    without,
    read,
    at,
    aimed,
    fitted,
    travel,
    bases,
    fingers,
    base,
    holding,
  };
}

/*
 * What the readings of an arms' plan read and what they are.
 */
export namespace AutoMovieMotionHumanArmPlannedReads {
  /*
   * What an arms' plan builds its readings from.
   */
  export interface IScope {
    /*
     * The body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The span's instants.
     */
    span: IAutoMovieMotionHumanArmPlanned.ISpan;

    /*
     * The arms.
     */
    carries: readonly IAutoMovieMotionHumanArmPlanned.IPlanned[];

    /*
     * The prefix posture at any second.
     */
    before: IAutoMovieMotionHumanActionPlan["posture"];

    /*
     * The plan's exact forward-kinematics preparation.
     */
    resolution: ReturnType<typeof prepareHumanPoseResolution>;

    /*
     * The plan's range-of-motion projector.
     */
    projection: ReturnType<typeof prepareHumanPostureProjection>;
  }

  /*
   * The readings.
   */
  export interface IReads {
    /*
     * A posture with the planned arms left out.
     * Parameter p: The posture.
     * Returns: The posture without the planned arms.
     */
    without: (p: IAutoMovieMotionHumanPosture) => IAutoMovieMotionHumanPosture;

    /*
     * Each instant's posture so far and its pose, by second.
     */
    read: Map<number, IPlannedReadEntry>;

    /*
     * An instant's posture so far and its pose with the planned arms left out.
     * Parameter t: The second.
     * Returns: The posture and the pose.
     */
    at: (t: number) => IPlannedAtResult;

    /*
     * An arm's goal at a second, as the plan perceives it.
     * Parameter a: The arm's index.
     * Parameter t: The second.
     * Returns: The goal.
     */
    aimed: (a: number, t: number) => IAutoMovieHumanLimbGoal;

    /*
     * An arm's own fit of its goal at a second.
     * Parameter a: The arm's index.
     * Parameter t: The second.
     * Returns: The arm's angles.
     */
    fitted: (a: number, t: number) => IAutoMovieMotionHumanArmAngles.IAngles;

    /*
     * The longest probe arc of the reach (1) or the return (-1) to a second.
     * Parameter t: The second.
     * Parameter sign: The reach or the return.
     * Returns: The arc, metres.
     */
    travel: (t: number, sign: PlannedTravelSign) => number;

    /*
     * Each instant's base, by second.
     */
    bases: Map<number, HumanArmTrajectory.IProblem["bases"][number]>;

    /*
     * Each instant's finger state of each planned hand, by second.
     */
    fingers: Map<number, IAutoMovieMotionHumanPosture["joints"][]>;

    /*
     * An instant's base, each arm read against it.
     * Parameter t: The second.
     * Returns: The base.
     */
    base: (t: number) => HumanArmTrajectory.IProblem["bases"][number];

    /*
     * Whether an arm holds at a second, over its own span or the group's.
     * Parameter c: The arm.
     * Parameter t: The second.
     * Returns: Whether it holds.
     */
    holding: (
      c: IAutoMovieMotionHumanArmPlanned.IPlanned,
      t: number,
    ) => boolean;
  }
}
/*
 * The alternatives of `PlannedTravelSign`'s site.
 */
type PlannedTravelSign = -1 | 1;

/*
 * The record of `IPlannedAtFound`'s site.
 */
type IPlannedAtFound = {
  posture: IAutoMovieMotionHumanPosture;
  pose: IAutoMoviePose;
};

/*
 * The record of `IPlannedAtResult`'s site.
 */
type IPlannedAtResult = {
  posture: IAutoMovieMotionHumanPosture;
  pose: IAutoMoviePose;
};

/*
 * The record of `IPlannedReadEntry`'s site.
 */
type IPlannedReadEntry = {
  posture: IAutoMovieMotionHumanPosture;
  pose: IAutoMoviePose;
};

/*
 * The spacing of the trajectory's waypoints, seconds at most: the frame grid
 * (`AutoMovieMotionHumanArmCourse.STEP`).
 */
const STEP: number = AutoMovieMotionHumanArmCourse.STEP;
/*
 * How far from the instant resolved last an instant's base continues its fits,
 * seconds: a frame of the grid and a half, so the next frame does and a
 * refinement's far instant does not.
 */
const CONTINUED: number = 1.5 * STEP;

/*
 * The instant whose base was resolved last and the seed each of its limbs' fits
 * chose.
 */
interface ILatest {
  /*
   * Its second.
   */
  seconds: number;

  /*
   * Each fitted limb's seed there.
   */
  seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"];
}

/*
 * Each limb's fit a frame away continued from its seed, refined to the cold
 * sweep's own resolution; a limb with no seed is solved cold.
 */
function continuing(
  seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"],
): IAutoMovieMotionHumanResolveHumanPosture.INear {
  const out: Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelNear>> = {};
  for (const [limb, seed] of Object.entries(seeds) as [
    AutoMovieHumanLimb,
    IAutoMovieSwivelSeed | null | undefined,
  ][])
    if (seed !== null && seed !== undefined)
      out[limb] = { ...seed, tolerance: hingedArmSwivel.RESOLUTION };
  return out;
}

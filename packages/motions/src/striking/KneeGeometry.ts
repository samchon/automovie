import { Vector3, wrapDegrees } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanKnee,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { KickCarriage } from "./KickCarriage";
import { KickThrust } from "./KickThrust";
import { KneeForm } from "./KneeForm";
import { KneeReach } from "./KneeReach";
import { StrikingBody } from "./StrikingBody";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";

/** The original knee's contact key, separated from its phase/contact law. */
export namespace KneeGeometry {
  /**
   * The place tolerance the carriage's hip settles to, metres: the limb
   * solver's own (`HumanArmTrajectoryTerms.TOLERANCE`, a millimetre).
   */
  export const TOLERANCE: number = HumanArmTrajectoryTerms.TOLERANCE / 1000;

  /** The original thigh and shank directions in the world frame. */
  export interface ILeg {
    /** From the hip to the knee. */
    thigh: IAutoMovieVector3;

    /** From the knee to the ankle. */
    shank: IAutoMovieVector3;
  }

  /** The original solved knee key and the course it is reached on. */
  export interface IGeometry extends KneeReach.ISolution {
    /** The target point, world metres. */
    target: IAutoMovieVector3;

    /** The hips' turn to the thigh's heading, degrees. */
    turn: number;

    /** The leg as the stance has it. */
    from: ILeg;

    /** The leg at the contact. */
    to: ILeg;

    /**
     * What the stance's planted ankle lies from the ankle `from` puts under the
     * stance's hip, world metres: zero unless the stance stretches the leg past
     * its length.
     */
    slack: IAutoMovieVector3;

    /** The driven foot's world rotation at the contact. */
    foot: IAutoMovieQuaternion;
  }

  /**
   * Build the knee law's original target/carriage/contact interpolation key.
   *
   * @param context The actual knee action's unchanged planning context.
   * @param side The kicking side already selected by the law.
   * @param feet The actual entry foot placements.
   * @param carriage The law's original lowered/pivoted carriage producer.
   * @param before The key this plan built before, when it has one: returned as
   *   it is when the launch reads the same target point, so a plan solves its
   *   key once and again only when a settle shows the target elsewhere at the
   *   launch's reading.
   * @returns The same measured reach/key used by the free and displayed
   *   courses.
   * @throws {HumanRefusal} A `reach` refusal when solving the knee again from
   *   the hip its carriage leaves stops shrinking that hip's move before it is
   *   within `TOLERANCE`.
   */
  export function solve(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKnee.IParams>,
    side: AutoMovieHumanSide,
    feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    carriage: (
      thrust: IAutoMovieVector3,
      turn: number,
      whole: number,
      drive: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ) => IAutoMovieMotionHumanPosture,
    before?: IGeometry,
  ): IGeometry {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const p: IAutoMovieMotionHumanKnee.IParams = context.params;
    const t0: number = context.start;
    const target: IAutoMovieVector3 = StrikingTarget.aim(
      context,
      p.at,
      t0 - StrikingTarget.LOOK,
      (): number => 0.8 * m.thigh,
    );

    // The key follows the one reading the launch makes of its target, on a
    // body, an entry and feet that are the plan's own: a key made before on
    // the same point is this one, and its carriage rounds are not run again.
    if (
      before !== undefined &&
      before.target.x === target.x &&
      before.target.y === target.y &&
      before.target.z === target.z
    )
      return before;
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    let projector: ReturnType<typeof prepareHumanPostureProjection> | undefined;
    const projection: () => ReturnType<
      typeof prepareHumanPostureProjection
    > = (): ReturnType<typeof prepareHumanPostureProjection> =>
      (projector ??= prepareHumanPostureProjection(body));
    const line: IAutoMovieVector3 = StrikingTarget.line(
      entry.root,
      target,
      entry.yaw,
    );
    const patella: number = Vector3.length(
      body.surfaces.regions[side === "left" ? "kneeLeft" : "kneeRight"].point,
    );
    const travel: number =
      KneeForm.TRAVEL[p.leg ?? "rear"] * StrikingStance.length(body);
    const reach = (hip: IAutoMovieVector3): KneeReach.ISolution =>
      KneeReach.solve(hip, target, m.thigh, patella, m.shank, travel, line);
    const start: IAutoMovieVector3 = KickCarriage.hip(
      body,
      carriage({ x: 0, y: 0, z: 0 }, 0, 0, 0, resolution),
      side,
      resolution,
      projection(),
    );
    let hip: IAutoMovieVector3 = start;
    let solved: KneeReach.ISolution = reach(hip);
    const turn: number = wrapDegrees(
      StrikingTarget.heading(solved.heading) - entry.yaw,
    );
    // The hip is the fixed point of the carriage under the solve it carries:
    // each pass solves the knee again from the hip the last carriage left,
    // until that hip moves within the limb solver's place tolerance. A pass
    // that does not shrink the move cannot converge, and the knee is refused
    // rather than solved from a hip the figure does not show.
    let moved: number = Infinity;
    for (;;) {
      const next: IAutoMovieVector3 = Vector3.subtract(
        KickCarriage.hip(
          body,
          carriage(solved.thrust, turn, 1, 1, resolution),
          side,
          resolution,
          projection(),
        ),
        solved.thrust,
      );
      const change: number = Vector3.distance(next, hip);
      hip = next;
      solved = reach(hip);
      if (change <= TOLERANCE) break;
      if (!(change < moved))
        throw new HumanRefusal({
          kind: "reach",
          axis: "target",
          value: `${(Vector3.distance(start, target) * 1000).toFixed(0)} mm`,
          feasible: {
            kind: "alternatives",
            values: ["a target the hip's drive settles on"],
          },
          reason: `the knee's carriage does not settle: solving the knee again from the hip the carriage leaves still moves that hip ${(change * 1000).toFixed(1)} mm`,
          fix: "aim the knee at a nearer or lower target, or stand nearer it",
        });
      moved = change;
    }

    // The stance's leg under the stance's hip, its knee bent toward the line
    // (no knee is read, so the plant's triangle takes the line's side), and
    // the contact's.
    const rest: IAutoMovieVector3 = feet[side].ankle;
    const stood: KickThrust.ILeg = KickThrust.planted(
      start,
      rest,
      start,
      [m.thigh, m.shank],
      line,
    );
    const from: ILeg = {
      thigh: Vector3.normalize(stood.thigh),
      shank: Vector3.normalize(stood.shank),
    };
    const to: ILeg = {
      thigh: Vector3.normalize(
        Vector3.subtract(solved.knee, Vector3.add(hip, solved.thrust)),
      ),
      shank: Vector3.normalize(Vector3.subtract(solved.ankle, solved.knee)),
    };
    const axes: ReturnType<typeof KneeReach.foot> = KneeReach.foot(
      to.shank,
      solved.heading,
    );
    return {
      ...solved,
      target,
      turn,
      from,
      to,
      slack: Vector3.subtract(
        rest,
        Vector3.add(
          start,
          Vector3.add(
            Vector3.scale(from.thigh, m.thigh),
            Vector3.scale(from.shank, m.shank),
          ),
        ),
      ),
      foot: StrikingBody.foot(axes.toes, axes.instep),
    };
  }
}

import { Vector3, wrapDegrees } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { KickCarriage } from "./KickCarriage";
import { KneeForm } from "./KneeForm";
import { KneeReach } from "./KneeReach";
import { StrikingBody } from "./StrikingBody";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import type { knee } from "./knee";

/**
 * The original knee's contact key, separated from its phase/contact law.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the lazy knee plan consumer and original carriage/target/leg-key responsibility.
 * @evidence contracts/development/design.md#principled-representation The same physical KneeReach result and entry/contact segment directions describe the law's key; the law retains its original lazy ownership and invalidation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One synchronous solve and the two former key records keep numeric key construction separate from the knee law's clocks, contacts and stop lifecycle.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No authored behavior, solver, sampled pose cache, outcome or physical bound is added; the original numeric body is moved without changing its operations.
 */
export namespace KneeGeometry {
  /**
   * The original thigh and shank directions in the world frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names hip-to-knee and knee-to-ankle directions, used by the unchanged knee swing.
   * @evidence contracts/development/design.md#principled-representation Two normalized canonical vectors describe the two original segment directions without another joint or limb solver.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The knee law interpolates these two directions between entry and contact.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses interface vectors; no fitted target, success flag or altered segment length is represented.
   */
  export interface ILeg {
    /** From the hip to the knee. */
    thigh: IAutoMovieVector3;

    /** From the knee to the ankle. */
    shank: IAutoMovieVector3;
  }

  /**
   * The original solved knee key and the course it is reached on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines target/turn, original entry/contact directions, stance slack and foot rotation in world metres/degrees.
   * @evidence contracts/development/design.md#principled-representation Extends the existing KneeReach solution with the actual carriage/key inputs the knee law already consumes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contains only the former lazy knee key's fields, including its original short/jammed status and interpolation endpoints.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the physical reach status and canonical vectors/quaternion, with no alternate outcome, resolved flag or relaxed support goal.
   */
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
     * What the stance's planted ankle lies from the ankle `from` puts under
     * the stance's hip, world metres: zero unless the stance stretches the
     * leg past its length.
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
   * @returns The same measured reach/key used by the free and displayed courses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines canonical planning inputs, exact original look-back target read, actual carriage callback and world-frame key fields.
   * @evidence contracts/development/implementation.md#principled-implementation Preserves original target aiming, patella radius, travel bound, heading wrap, initial stance hip and every KneeForm.ROUNDS carriage/hip update, then derives entry/contact directions, stance slack and foot axes from the same geometry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One synchronous numeric key owner serves the knee law's existing lazy geometry callback; the law alone retains/reset the completed original key.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Target time, lookup order, complete carriage lowering, original solve rounds/limits, vector expression grouping and short/jammed status remain unchanged. No supported candidate or physical goal is omitted or predeclared solved.
   * @evidence contracts/development/implementation.md#efficient-algorithms Retains the original fixed number of actual knee/carriage evaluations. One local exact workspace shares only unchanged scalar FK prerequisites across those real reads; separation adds no numerical algorithm or measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Within this one unchanged body/context calculation the explicit carriage and hip reads borrow the same exact workspace; changed postures still execute normally. The caller's original lazy settled-plan key is the only retained numeric result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local workspace and temporary posture/maps end on return or throw. Only the original key's numeric points/directions/status escape to the law, which clears it on settle and retains no reader or new time history.
   */
  export function solve(
    context: IHumanActionContext<knee.IParams>,
    side: "left" | "right",
    feet: Record<"left" | "right", HumanFoot.IPlacement>,
    carriage: (thrust: IAutoMovieVector3, turn: number, whole: number, drive: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]) => IHumanPosture,
  ): IGeometry {
    const body: IHumanBody = context.body;
    const m: IHumanBody["measure"] = body.measure;
    const entry: IHumanPosture = context.entry.posture;
    const p: knee.IParams = context.params;
    const t0: number = context.start;
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const target: IAutoMovieVector3 = StrikingTarget.aim(
      context,
      p.at,
      t0 - StrikingTarget.LOOK,
      (): number => 0.8 * m.thigh,
    );
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
      side, resolution,
    );
    let hip: IAutoMovieVector3 = start;
    let solved: KneeReach.ISolution = reach(hip);
    const turn: number = wrapDegrees(
      StrikingTarget.heading(solved.heading) - entry.yaw,
    );
    for (let round: number = 0; round < KneeForm.ROUNDS; round++) {
      hip = Vector3.subtract(
        KickCarriage.hip(body, carriage(solved.thrust, turn, 1, 1, resolution), side, resolution),
        solved.thrust,
      );
      solved = reach(hip);
    }

    // The stance's leg under the stance's hip, and the contact's.
    const rest: IAutoMovieVector3 = feet[side].ankle;
    const bent: IAutoMovieVector3 = KneeReach.bent(
      start,
      rest,
      m.thigh,
      m.shank,
      line,
    );
    const from: ILeg = {
      thigh: Vector3.normalize(Vector3.subtract(bent, start)),
      shank: Vector3.normalize(Vector3.subtract(rest, bent)),
    };
    const to: ILeg = {
      thigh: Vector3.normalize(
        Vector3.subtract(solved.knee, Vector3.add(hip, solved.thrust)),
      ),
      shank: Vector3.normalize(Vector3.subtract(solved.ankle, solved.knee)),
    };
    const axes: ReturnType<typeof KneeReach.foot> = KneeReach.foot(to.shank, solved.heading);
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

import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingHeld } from "./StrikingHeld";

/**
 * Whether the arm can hold a held tool in a pose, and the turn of the tool
 * about its own line where the action leaves it free.
 *
 * The hand holds the tool as it took it, so a pose of the tool asks the
 * hand for one rotation, and the arm gives it only inside the ranges of the
 * shoulder, the forearm's twist and the wrist. What the arm gives is found
 * the only way that counts the ranges: the arm is fitted to the pose on the
 * body as it stands at the decisive instant, and the tool is read back from
 * the fitted hand. A pose the fitted hand misses is never played: it is
 * refused when the plan is built.
 *
 * A thrust states where the point goes and about which way the blade runs,
 * a levelled muzzle where the bore points, and neither states which way the
 * edge or the sights face; `hand` chooses that turn, and a lean of the line
 * inside a cone, by the same fit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what limits a held tool's pose, how a pose is judged and what is refused.
 * @evidence contracts/development/design.md#principled-representation A pose is judged by fitting it and reading the result, the motion skill's rule that a search measures each trial after the joint limits are applied.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The miss of a pose, the chosen frame and the refusal, read by the blade and firearm lexicons.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No tool kind is named and no wrist range is restated: the fit owns the ranges.
 */
export namespace StrikingRoll {
  /** How far the fitted hand may leave a tool's point of its decisive pose before the pose is refused, metres: under the campaign's 15 mm contact bound, so a planned pose that passes also passes on screen. */
  export const MISS: number = 0.01;

  /** How many of the candidate frames, the nearest by the arm's two-segment reach, are fitted before one is chosen. */
  export const TRIED: number = 16;

  /**
   * How far the arm, fitted to a tool's pose, leaves the tool from where the
   * pose asks it.
   *
   * @param context The action's context.
   * @param tool The tool.
   * @param frame The hand frame asked.
   * @param back The point of the tool the pose keeps, metres behind its working point.
   * @param posture The body as it stands at the decisive instant.
   * @returns The greater of the kept point's and the working point's displacement, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is fitted, on which body and what is measured.
   * @evidence contracts/development/implementation.md#principled-implementation The plan's own goal for the pose is resolved by the posture resolver, the fitted hand's grip frame is read by forward kinematics, and the tool's two points are carried by it: the displacement a viewer would see.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal, one resolution, one read-back.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both the kept point and the working point are read, so a tool that keeps its point and points elsewhere is counted.
   * @evidence contracts/development/implementation.md#efficient-algorithms One elbow search and one posture resolution.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each pose is fitted once.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function miss(
    context: Pick<IHumanActionContext, "body">,
    tool: StrikingHeld.ITool,
    frame: StrikingHeld.IHandFrame,
    back: number,
    posture: IHumanPosture,
  ): number {
    const goal: IHumanPosture.IGoal = StrikingHeld.goal(
      context,
      tool,
      frame,
      back,
      { x: 0, y: 0, z: 0 },
    );
    const bones: ReturnType<typeof poseBones> = poseBones(
      context.body,
      resolveHumanPosture(context.body, {
        ...posture,
        limbs: {
          ...posture.limbs,
          [`${tool.side}Arm`]: {
            ...goal,
            bend: AutoMovieMotionHumanBend.solve({
              body: context.body,
              posture,
              side: tool.side,
              point: goal.point,
              ...(goal.rotation === undefined
                ? {}
                : { rotation: goal.rotation }),
              fallback: "hang",
            }),
          },
        },
      }),
    );
    const fitted: StrikingHeld.IHandFrame = {
      point: HumanHand.frame(context.body, bones, tool.side, "grip").point,
      rotation: bones.get(`${tool.side}Hand`)!.worldRotation,
    };
    const off = (behind: number): number =>
      Vector3.length(
        Vector3.subtract(
          StrikingHeld.point(tool, fitted, behind),
          StrikingHeld.point(tool, frame, behind),
        ),
      );
    return Math.max(off(back), off(0));
  }

  /**
   * The hand frame that puts a point of the tool on a world point with the
   * tool about along an axis, turned about its line and leaned inside a cone
   * the way the arm holds it best.
   *
   * @param context The action's context.
   * @param tool The tool.
   * @param back How far behind the working point the placed point lies, metres.
   * @param at Where that point goes, world metres.
   * @param axis The world direction the tool is asked to run.
   * @param cone How far the tool's line may leave that axis, degrees; 0 keeps it.
   * @param posture The body as it stands at the decisive instant.
   * @returns The hand's grip frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is fixed, what is chosen, by which rule, and each input.
   * @evidence contracts/development/implementation.md#principled-implementation Candidates are the turns about the tool's line and the lines of the cone. A straight wrist puts the elbow one forearm back from the wrist along the hand, and the arm can only hold the frame when that elbow lies one upper arm from the shoulder, so the residual of that distance ranks the candidates cheaply; the `TRIED` best are then fitted and the one the fitted hand misses least is taken, a line nearer the asked axis winning a tie.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Enumerate, rank by the closed-form residual, fit the best few.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The steps (10 degrees of cone, 45 of azimuth, 30 of turn) are a search resolution; the placed point is on its place for every candidate; the choice is made by the fit, never by the residual alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most 12 turns times 33 lines of closed-form geometry and `TRIED` fits, once per plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function hand(
    context: Pick<IHumanActionContext, "body">,
    tool: StrikingHeld.ITool,
    back: number,
    at: IAutoMovieVector3,
    axis: IAutoMovieVector3,
    cone: number,
    posture: IHumanPosture,
  ): StrikingHeld.IHandFrame {
    const along: IAutoMovieVector3 = Vector3.normalize(axis);
    const from: IAutoMovieVector3 = shoulder(context, tool.side, posture);
    const grip: IAutoMovieVector3 = HumanHand.offset(
      context.body,
      tool.side,
      "grip",
    ).point;

    // The wrist to the knuckles in the hand's own frame, the forearm's line
    // through a straight wrist.
    const fingers: IAutoMovieVector3 = {
      x: tool.side === "left" ? 1 : -1,
      y: 0,
      z: 0,
    };
    const aside: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(
        along,
        Math.abs(along.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 },
      ),
    );
    const candidates: { frame: StrikingHeld.IHandFrame; rank: number }[] = [];
    for (let tilt: number = 0; tilt <= cone + 1e-9; tilt += 10)
      for (let around: number = 0; around < 360; around += 45) {
        const run: IAutoMovieVector3 = Quaternion.rotateVector(
          Quaternion.fromAxisAngle(along, around),
          Quaternion.rotateVector(Quaternion.fromAxisAngle(aside, tilt), along),
        );
        for (let turn: number = 0; turn < 360; turn += 30) {
          const frame: StrikingHeld.IHandFrame = StrikingHeld.hand(
            tool,
            back,
            at,
            run,
            Quaternion.rotateVector(
              Quaternion.fromAxisAngle(run, turn),
              Vector3.cross(run, aside),
            ),
          );
          const elbow: IAutoMovieVector3 = Vector3.subtract(
            Vector3.subtract(
              frame.point,
              Quaternion.rotateVector(frame.rotation, grip),
            ),
            Vector3.scale(
              Quaternion.rotateVector(frame.rotation, fingers),
              context.body.measure.forearm,
            ),
          );
          candidates.push({
            frame,
            rank:
              Math.abs(
                Vector3.length(Vector3.subtract(elbow, from)) -
                  context.body.measure.upperArm,
              ) +
              (0.1 * tilt * Math.PI) / 180,
          });
        }
        if (tilt === 0) break;
      }
    candidates.sort(
      (
        a: { frame: StrikingHeld.IHandFrame; rank: number },
        b: { frame: StrikingHeld.IHandFrame; rank: number },
      ): number => a.rank - b.rank,
    );
    let best: StrikingHeld.IHandFrame = candidates[0]!.frame;
    let least: number = Infinity;
    for (const candidate of candidates.slice(0, TRIED)) {
      const missed: number = miss(
        context,
        tool,
        candidate.frame,
        back,
        posture,
      );
      if (missed < least - 1e-4) {
        least = missed;
        best = candidate.frame;
      }
    }
    return best;
  }

  /**
   * Refuse a tool pose the arm cannot hold: its wrist beyond the straight
   * arm, or a pose the fitted hand leaves the tool off.
   *
   * @param context The action's context.
   * @param tool The tool.
   * @param frame The hand frame asked.
   * @param back The point of the tool the pose keeps, metres behind its working point.
   * @param posture The body as it stands at the decisive instant.
   * @param fix What the author can change about the reach.
   * @throws {HumanRefusal} On `target` when the wrist is farther from the shoulder than the upper arm and the forearm together; on `grasp` when the arm fitted to the pose leaves the tool more than `MISS` from where the pose asks it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is measured and both refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist follows rigidly from the grip frame, and a wrist farther from the shoulder than the two arm segments has no solution; inside the reach the pose is fitted and read back (`miss`), so the shoulder's, the forearm's and the wrist's ranges all count.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One distance, then one fit.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clamp: a pose that is out of reach or that the hand cannot turn to is refused with the measured miss and what to change.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution and one fit per plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A check made once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function reachable(
    context: Pick<IHumanActionContext, "body">,
    tool: StrikingHeld.ITool,
    frame: StrikingHeld.IHandFrame,
    back: number,
    posture: IHumanPosture,
    fix: string,
  ): void {
    const wrist: IAutoMovieVector3 = Vector3.subtract(
      frame.point,
      Quaternion.rotateVector(
        frame.rotation,
        HumanHand.offset(context.body, tool.side, "grip").point,
      ),
    );
    const distance: number = Vector3.length(
      Vector3.subtract(wrist, shoulder(context, tool.side, posture)),
    );
    const limit: number =
      context.body.measure.upperArm + context.body.measure.forearm;
    if (distance > limit)
      throw new HumanRefusal({
        kind: "reach",
        axis: "target",
        value: distance,
        feasible: { kind: "range", minimum: 0, maximum: limit, unit: "m" },
        reason: `the ${tool.side} wrist would be ${distance.toFixed(3)} m from its shoulder, beyond the arm's ${limit.toFixed(3)} m`,
        fix,
      });
    const missed: number = miss(context, tool, frame, back, posture);
    if (missed > MISS)
      throw new HumanRefusal({
        kind: "reach",
        axis: "grasp",
        value: missed,
        feasible: { kind: "range", minimum: 0, maximum: MISS, unit: "m" },
        reason: `as the ${tool.side} hand holds ${tool.prop ?? "nothing"}, the arm cannot turn it to this pose: fitted, it leaves the tool ${(missed * 1000).toFixed(0)} mm from where the pose asks it, with the wrist at ${((100 * distance) / limit).toFixed(0)} percent of the arm's length from the shoulder`,
        fix: "take the tool by a grasp made for this use (pickUp's `use`), stand so the stroke runs nearer the arm's own line, or choose another stroke",
      });
  }

  /** The holding arm's shoulder joint on a posture, world metres. */
  const shoulder = (
    context: Pick<IHumanActionContext, "body">,
    side: HumanHand.Side,
    posture: IHumanPosture,
  ): IAutoMovieVector3 =>
    HumanTrunk.resolve(context.body, posture).get(`${side}UpperArm`)!
      .worldPosition;
}

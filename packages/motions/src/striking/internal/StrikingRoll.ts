import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanStrikingRoll,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFreedomChoice } from "../../posture/internal/HumanFreedomChoice";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { StrikingHeld } from "./StrikingHeld";
import { StrikingStrain } from "./StrikingStrain";

/*
 * Whether the arm can hold a held tool in a pose, and the turn of the tool
 * about its own line where the action leaves it free.
 *
 * The hand holds the tool as it took it, so a pose of the tool asks the hand
 * for one rotation, and the arm gives it only inside the ranges of the
 * shoulder, the forearm's twist and the wrist. What the arm gives is found the
 * only way that counts the ranges: the arm is fitted to the pose on the body as
 * it stands at the decisive instant, and the tool is read back from the fitted
 * hand. A pose the fitted hand misses is never played: it is refused when the
 * plan is built.
 *
 * A thrust states where the point goes and about which way the blade runs, a
 * levelled muzzle where the bore points, and neither states which way the edge
 * or the sights face; `hand` chooses that turn, and a lean of the line inside a
 * cone, by the same fit.
 */
export namespace StrikingRoll {
  /*
   * How far the fitted hand may leave a tool's point of its decisive pose
   * before the pose is refused, metres: under the campaign's 15 mm contact
   * bound, so a planned pose that passes also passes on screen.
   */
  export const MISS: number = 0.01;

  /*
   * How many of the candidate frames, the nearest by the arm's two-segment
   * reach, are fitted before one is chosen.
   */
  export const TRIED: number = 16;

  /*
   * How far the arm, fitted to a tool's pose, leaves the tool from where the
   * pose asks it.
   * Parameter context: The action's context.
   * Parameter tool: The tool.
   * Parameter frame: The hand frame asked.
   * Parameter back: The point of the tool the pose keeps, metres behind its working
   * point.
   * Parameter posture: The body as it stands at the decisive instant.
   * Parameter resolution: Optional exact FK workspace borrowed from this
   * synchronous tool-pose search.
   * Returns: The greater of the kept point's and the working point's
   * displacement, metres; a pose that keeps the working point itself reads
   * the line at the tool's own length in place of the kept point.
   */
  export function miss(
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    back: number,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: ReturnType<typeof prepareHumanPoseResolution>,
  ): number {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      resolution ?? prepareHumanPoseResolution();
    const bend: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const goal: IAutoMovieHumanLimbGoal = StrikingHeld.goal(
      context,
      tool,
      frame,
      back,
      bend,
    );
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
      ...posture.limbs,
      [`${tool.side}Arm`]: {
        ...goal,
        // The hanging arm remains the named fallback for an unconstrained elbow.
        bend: AutoMovieMotionHumanBend.hang(context.body, posture, tool.side),
      },
    };
    const fittedPose: ReturnType<typeof resolveHumanPosture.seeded> =
      resolveHumanPosture.seeded(
        context.body,
        { ...posture, limbs },
        undefined,
        {},
        read,
      );
    const bones: ReturnType<typeof poseBones> = poseBones(
      context.body,
      fittedPose.pose,
      read(),
      HANDS[tool.side],
    );
    const fitted: IAutoMovieMotionHumanStrikingHeld.IHandFrame = {
      point: HumanHand.frame(context.body, bones, tool.side, "grip").point,
      rotation: bones.get(`${tool.side}Hand`)!.worldRotation,
    };
    return StrikingHeld.strayed(tool, fitted, frame, back);
  }

  /*
   * The hand frame that puts a point of the tool on a world point with the tool
   * about along an axis, turned about its line and leaned inside a cone the way
   * the arm holds it best.
   * Parameter context: The action's context.
   * Parameter tool: The tool.
   * Parameter back: How far behind the working point the placed point lies, metres.
   * Parameter at: Where that point goes, world metres.
   * Parameter axis: The world direction the tool is asked to run.
   * Parameter cone: How far the tool's line may leave that axis, degrees; 0 keeps
   * it.
   * Parameter posture: The body as it stands at the decisive instant.
   * Returns: The hand's grip frame.
   */
  export function hand(
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    back: number,
    at: IAutoMovieVector3,
    axis: IAutoMovieVector3,
    cone: number,
    posture: HandPosture,
  ): IAutoMovieMotionHumanStrikingHeld.IHandFrame {
    const along: IAutoMovieVector3 = Vector3.normalize(axis);
    const from: IAutoMovieVector3 | undefined =
      typeof posture === "function"
        ? undefined
        : shoulder(context, tool.side, posture);
    const aside: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(
        along,
        Math.abs(along.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 },
      ),
    );
    const frame: IAutoMovieMotionHumanStrikingRoll.IChoice["frame"] = (
      values: readonly number[],
    ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => {
      const [tilt, around, turn] = values as readonly [number, number, number];
      const run: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.fromAxisAngle(along, around),
        Quaternion.rotateVector(Quaternion.fromAxisAngle(aside, tilt), along),
      );
      return StrikingHeld.hand(
        tool,
        back,
        at,
        run,
        Quaternion.rotateVector(
          Quaternion.fromAxisAngle(run, turn),
          Vector3.cross(run, aside),
        ),
      );
    };
    const rank: (values: readonly number[]) => number = (
      values: readonly number[],
    ): number => {
      const posed: IAutoMovieMotionHumanStrikingHeld.IHandFrame = frame(values);
      try {
        const actual: IAutoMovieVector3 =
          from ??
          shoulder(
            context,
            tool.side,
            typeof posture === "function" ? posture(posed) : posture,
          );
        const measure: ReturnType<typeof StrikingStrain> = StrikingStrain(
          context.body,
          tool.side,
        );
        return measure(posed, actual);
      } catch (error) {
        if (error instanceof AutoMovieMotionHumanRefusal) return Infinity;
        throw error;
      }
    };
    const candidates: IHandCandidatesItem[] = [];
    for (let tilt: number = 0; tilt <= cone + 1e-9; tilt += 10)
      for (let around: number = 0; around < 360; around += 45) {
        for (let turn: number = 0; turn < 360; turn += 30) {
          const values: number[] = [tilt, around, turn];
          candidates.push({
            values,
            rank: rank(values) + (0.1 * tilt * Math.PI) / 180,
          });
        }
        if (tilt === 0) break;
      }
    candidates.sort((a: IHandA, b: IHandB): number => a.rank - b.rank);
    return chosen(context, tool, {
      frame,
      tried: candidates
        .slice(0, TRIED)
        .map((candidate: IHandCandidate): number[] => candidate.values),
      freedoms: [
        { kind: "bounded", step: cone > 0 ? 5 : 0, least: 0, greatest: cone },
        { kind: "wrapped", step: 22.5, period: 360 },
        { kind: "wrapped", step: 15, period: 360 },
      ],
      back,
      posture,
    });
  }

  /*
   * How far a tool pose is from one the arm holds with a straight wrist,
   * metres: a straight wrist puts the elbow one forearm back from the wrist
   * along the hand, and the arm holds the pose when that elbow lies one upper
   * arm from the shoulder, so the residual of that distance ranks poses before
   * any is fitted.
   * Parameter context: The action's context.
   * Parameter tool: The tool.
   * Parameter frame: The hand frame asked.
   * Parameter posture: The body as it stands at the decisive instant.
   * Returns: Metres, not negative.
   */
  export function strain(
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    posture: IAutoMovieMotionHumanPosture,
  ): number {
    const from: IAutoMovieVector3 = shoulder(context, tool.side, posture);
    return StrikingStrain(context.body, tool.side)(frame, from);
  }

  /*
   * The tool pose the arm holds, chosen from the freedoms a law leaves it.
   *
   * A law states a pose by values (a roll about the tool's line, a lean of the
   * line inside a cone, an offset of the placed point inside a region) and the
   * frame those values give; the shared chooser (`HumanFreedomChoice.chosen`)
   * tries them in the law's order and refines the least missed, each judged at
   * the decisive instant by `miss`. `reachable` then judges the result, so a
   * pose no freedom lets the arm hold is still refused.
   * Parameter context: The action's context.
   * Parameter tool: The tool.
   * Parameter props: The pose's frame by its values, the tried values in order of
   * preference, each freedom, the point of the tool the pose keeps and the
   * body at the decisive instant.
   * Returns: The chosen hand frame.
   * When no values are tried.
   */
  export function chosen(
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    props: IAutoMovieMotionHumanStrikingRoll.IChoice,
  ): IAutoMovieMotionHumanStrikingHeld.IHandFrame {
    const {
      frame,
      tried,
      freedoms,
      back,
      posture,
    }: IAutoMovieMotionHumanStrikingRoll.IChoice = props;
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    return frame(
      HumanFreedomChoice.chosen({
        tried,
        freedoms,
        judge: (values: readonly number[]): number[] => {
          const posed: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
            frame(values);
          try {
            const current: IAutoMovieMotionHumanPosture =
              typeof posture === "function" ? posture(posed) : posture;
            return [miss(context, tool, posed, back, current, resolution)];
          } catch (error) {
            if (error instanceof AutoMovieMotionHumanRefusal) return [Infinity];
            throw error;
          }
        },
      }).values,
    );
  }
  /*
   * Of a law's candidate tool poses, in its order of preference, the first the
   * arm holds exactly, else the one the fitted hand misses least: what a law
   * that leaves a pose's freedom to the arm chooses by.
   * Parameter context: The action's context.
   * Parameter tool: The tool.
   * Parameter candidates: The poses, each built only when it is tried, preferred
   * first.
   * Parameter back: The point of the tool the pose keeps, metres behind its working
   * point.
   * Parameter posture: The body as it stands at the decisive instant.
   * Returns: The chosen hand frame.
   * When there is no candidate.
   */
  export function best(
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    candidates: readonly (() => IAutoMovieMotionHumanStrikingHeld.IHandFrame)[],
    back: number,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanStrikingHeld.IHandFrame {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    let chosen: IAutoMovieMotionHumanStrikingHeld.IHandFrame | undefined;
    let least: number = Infinity;
    for (const candidate of candidates) {
      if (least <= HumanFreedomChoice.EXACT) break;
      const frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame = candidate();
      const missed: number = miss(
        context,
        tool,
        frame,
        back,
        posture,
        resolution,
      );
      if (missed < least - HumanFreedomChoice.EXACT) {
        least = missed;
        chosen = frame;
      }
    }
    if (chosen === undefined) throw new Error("A tool pose has no candidate");
    return chosen;
  }

  /*
   * Refuse a tool pose the arm cannot hold: its wrist beyond the straight arm,
   * or a pose the fitted hand leaves the tool off.
   * Parameter context: The action's context.
   * Parameter tool: The tool.
   * Parameter frame: The hand frame asked.
   * Parameter back: The point of the tool the pose keeps, metres behind its working
   * point.
   * Parameter posture: The body as it stands at the decisive instant.
   * Parameter fix: What the author can change about the reach.
   * On `target` when the wrist is farther from the
   * shoulder than the upper arm and the forearm together; on `grasp` when the
   * arm fitted to the pose leaves the tool more than `MISS` from where the
   * pose asks it.
   */
  export function reachable(
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    back: number,
    posture: IAutoMovieMotionHumanPosture,
    fix: string,
  ): void {
    const wrist: IAutoMovieVector3 = Vector3.subtract(
      frame.point,
      Quaternion.rotateVector(
        frame.rotation,
        HumanHand.offset(context.body, tool.side, "grip").point,
      ),
    );
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const distance: number = Vector3.distance(
      wrist,
      shoulder(context, tool.side, posture, resolution),
    );
    const limit: number =
      context.body.measure.upperArm + context.body.measure.forearm;
    if (distance > limit)
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis: "target",
        value: distance,
        feasible: { kind: "range", minimum: 0, maximum: limit, unit: "m" },
        reason: `the ${tool.side} wrist would be ${distance.toFixed(3)} m from its shoulder, beyond the arm's ${limit.toFixed(3)} m`,
        fix,
      });
    const missed: number = miss(
      context,
      tool,
      frame,
      back,
      posture,
      resolution,
    );
    if (missed > MISS)
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis: "grasp",
        value: missed,
        feasible: { kind: "range", minimum: 0, maximum: MISS, unit: "m" },
        reason: `as the ${tool.side} hand holds ${tool.prop ?? "nothing"}, the arm cannot turn it to this pose: fitted, it leaves the tool ${(missed * 1000).toFixed(0)} mm from where the pose asks it, with the wrist at ${((100 * distance) / limit).toFixed(0)} percent of the arm's length from the shoulder`,
        fix: "take the tool by a grasp made for this use (pickUp's `use`), stand so the stroke runs nearer the arm's own line, or choose another stroke",
      });
  }

  /*
   * The holding arm's shoulder joint on a posture, world metres.
   */
  const shoulder: (
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    side: AutoMovieHumanSide,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ) => IAutoMovieVector3 = (
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    side: AutoMovieHumanSide,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieVector3 =>
    HumanTrunk.resolve(
      context.body,
      posture,
      undefined,
      resolution,
      SHOULDERS[side],
    ).get(`${side}UpperArm`)!.worldPosition;
}

/*
 * The record of `IHandCandidate`'s site.
 */
type IHandCandidate = { values: number[] };

/*
 * The record of `IHandB`'s site.
 */
type IHandB = { rank: number };

/*
 * The record of `IHandA`'s site.
 */
type IHandA = { rank: number };

/*
 * The record of `IHandCandidatesItem`'s site.
 */
type IHandCandidatesItem = { values: number[]; rank: number };

/*
 * The body at the decisive instant, or its reader per candidate frame: the
 * union the interface declares (`IAutoMovieMotionHumanStrikingRoll.IChoice`).
 */
type HandPosture = IAutoMovieMotionHumanStrikingRoll.IChoice["posture"];

/*
 * The two actual output branches consumed by tool-pose judging.
 */
const HANDS: Readonly<
  Record<AutoMovieHumanSide, ReadonlySet<AutoMovieHumanoidBone>>
> = {
  left: new Set<AutoMovieHumanoidBone>(["leftHand"]),
  right: new Set<AutoMovieHumanoidBone>(["rightHand"]),
};

/*
 * Ranking needs only the holding shoulder and its FK ancestry.
 */
const SHOULDERS: Readonly<
  Record<AutoMovieHumanSide, ReadonlySet<AutoMovieHumanoidBone>>
> = {
  left: new Set<AutoMovieHumanoidBone>(["leftUpperArm"]),
  right: new Set<AutoMovieHumanoidBone>(["rightUpperArm"]),
};

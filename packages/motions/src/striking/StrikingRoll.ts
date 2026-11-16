import { Quaternion, Vector3 } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanFreedomChoice } from "../posture/HumanFreedomChoice";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingHeld } from "./StrikingHeld";
import { StrikingRollHand } from "./StrikingRollHand";
import { StrikingStrain } from "./StrikingStrain";

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
   * @param resolution Optional exact FK workspace borrowed from this synchronous tool-pose search.
   * @param prepared Optional lazy direct-pose preparation owned by a search whose body, root, joints and digits stay fixed; every complete candidate goal still resolves.
   * @param goalFor Optional producer prepared from this exact unchanged body/tool/back, returning fresh original task geometry for each actual frame/bend.
   * @param projection Optional genuine same-body ROM projector borrowed only from this synchronous candidate operation; unknown provenance keeps ordinary cold projection.
   * @returns The greater of the kept point's and the working point's displacement, metres; a pose that keeps the working point itself reads the line at the tool's own length in place of the kept point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is fitted, on which body and what is measured.
   * @evidence contracts/development/implementation.md#principled-implementation The plan's own goal for the pose is resolved by the posture resolver, the fitted hand's grip frame is read by forward kinematics, and the tool's two points are carried by it: the displacement a viewer would see.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal, one resolution, one read-back.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both the kept point and the working point are read, so a tool that keeps its point and points elsewhere is counted; when the kept point is the working point, the line is read at the tool's length, so the count holds there too.
   * @evidence contracts/development/implementation.md#efficient-algorithms One original elbow search and whole-posture fit followed by demanded hand FK. Fixed-posture search preparation admits/clamps direct joints once across K actual candidates, retaining fresh pose copies, all limb/digit fits and scalar FK dependencies; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit parent FK supplier shares exact prerequisites only within this synchronous search. One fixed body/tool/back goal producer prepares local contact/limit offsets and returns fresh task geometry for every actual frame. A prepared base is admitted only for one unchanged body/root/direct-joint/digit source; each complete varying limb-goal set, rival clearance and physical fit still executes, while callback-varying postures still use ordinary seeded resolution with a genuine same-body ROM metadata loan. Every actual joint projection remains and the posture owner checks provenance, falling back cold for unknown/changed domains.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows optional reader/direct-pose preparation only until return or throw; the enclosing synchronous search releases fixed snapshots and each independent pose/map, while only the scalar miss escapes.
   */
  export function miss(
    context: Pick<IHumanActionContext, "body">,
    tool: StrikingHeld.ITool,
    frame: StrikingHeld.IHandFrame,
    back: number,
    posture: IHumanPosture,
    resolution?: ReturnType<typeof prepareHumanPoseResolution>,
    prepared?: () => ReturnType<typeof resolveHumanPosture.prepareBase>,
    goalFor?: ReturnType<typeof StrikingHeld.prepareGoal>,
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): number {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      resolution ?? prepareHumanPoseResolution();
    const bend: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const goal: IHumanPosture.IGoal = goalFor === undefined
      ? StrikingHeld.goal(context, tool, frame, back, bend)
      : goalFor(frame, bend);
    const limbs: IHumanPosture["limbs"] = {
      ...posture.limbs,
      [`${tool.side}Arm`]: {
        ...goal,
        // The hanging arm remains the named fallback for an unconstrained elbow.
        bend: AutoMovieMotionHumanBend.hang(context.body, posture, tool.side),
      },
    };
    const fittedPose: ReturnType<typeof resolveHumanPosture.seeded> = prepared === undefined
      ? resolveHumanPosture.seeded(context.body, { ...posture, limbs }, undefined, {}, read, undefined, projection)
      : prepared().seeded(limbs, {}, read);
    const bones: ReturnType<typeof poseBones> = poseBones(
      context.body, fittedPose.pose, read(), HANDS[tool.side],
    );
    const fitted: StrikingHeld.IHandFrame = {
      point: HumanHand.frame(context.body, bones, tool.side, "grip").point,
      rotation: bones.get(`${tool.side}Hand`)!.worldRotation,
    };
    return StrikingHeld.strayed(tool, fitted, frame, back);
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure StrikingRollHand owns the fixed angle grid and rigid geometry; each placement ranks the actual posture and delegates the original preferred candidates to chosen.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The steps (10 degrees of cone, 45 of azimuth, 30 of turn) are a search resolution; the placed point is on its place for every candidate; the choice is made by the fit, never by the residual alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each invocation ranks up to 12 turns times the cone's line count and fits/refines the original TRIED candidates. The fixed body/side grip and arm geometry is prepared once per search; insertion may invoke this search for multiple postures.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The one-shot facade borrows fixed angle-grid alignment/offset and canonical strain geometry for this invocation; every candidate point, dependent shoulder, rank and actual physical fit is still evaluated normally.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Angle records, fixed rigid readers, candidate ranks and the actual chooser workspaces end with this synchronous search; only the independent chosen hand frame escapes.
   */
  export function hand(
    context: Pick<IHumanActionContext, "body">,
    tool: StrikingHeld.ITool,
    back: number,
    at: IAutoMovieVector3,
    axis: IAutoMovieVector3,
    cone: number,
    posture:
      | IHumanPosture
      | ((frame: StrikingHeld.IHandFrame) => IHumanPosture),
  ): StrikingHeld.IHandFrame {
    return StrikingRollHand(context, tool, back, axis, cone)(at, posture);
  }

  /**
   * How far a tool pose is from one the arm holds with a straight wrist,
   * metres: a straight wrist puts the elbow one forearm back from the wrist
   * along the hand, and the arm holds the pose when that elbow lies one upper
   * arm from the shoulder, so the residual of that distance ranks poses
   * before any is fitted.
   *
   * @param context The action's context.
   * @param tool The tool.
   * @param frame The hand frame asked.
   * @param posture The body as it stands at the decisive instant.
   * @returns Metres, not negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is measured, why it ranks and each input.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist follows rigidly from the grip frame and the elbow from a straight wrist; the arm holds the pose only with the elbow one upper arm from the shoulder.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shoulder read and one closed form, the one `hand` ranks its candidates by.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A ranking only: no pose is accepted by it, `best` and `reachable` fit.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One trunk resolution and constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function strain(
    context: Pick<IHumanActionContext, "body">,
    tool: StrikingHeld.ITool,
    frame: StrikingHeld.IHandFrame,
    posture: IHumanPosture,
  ): number {
    return StrikingStrain(context.body, tool.side)(
      frame,
      shoulder(context, tool.side, posture),
    );
  }

  /**
   * The tool pose the arm holds, chosen from the freedoms a law leaves it.
   *
   * A law states a pose by values (a roll about the tool's line, a lean of
   * the line inside a cone, an offset of the placed point inside a region)
   * and the frame those values give; the shared chooser
   * (`HumanFreedomChoice.chosen`) tries them in the law's order and refines
   * the least missed, each judged at the decisive instant by `miss`.
   * `reachable` then judges the result, so a pose no freedom lets the arm
   * hold is still refused.
   *
   * @param context The action's context.
   * @param tool The tool.
   * @param props The pose's frame by its values, the tried values in order of preference, each freedom, the point of the tool the pose keeps and the body at the decisive instant.
   * @returns The chosen hand frame.
   * @throws {Error} When no values are tried.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States who chooses, by which judge, and who judges the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each pose is judged by `miss`, the fit that counts the shoulder's, the forearm's and the wrist's ranges, so the angle chosen is one the wrist can make.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation with a one-instant judge, then the frame of the chosen values.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The freedoms are the law's; the result is still judged by `reachable`.
   * @evidence contracts/development/implementation.md#efficient-algorithms The chooser's original lazy fits/refinement budget remain; fixed-posture trials share one direct assembly/clamp, while callback-varying trials keep their own admission and all candidates retain actual fits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One exact FK reader belongs to this synchronous search. Only an explicitly fixed posture object lends its direct-pose preparation across complete candidate goals; a candidate posture callback stays ordinary seeded, and every actual fit remains.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The lazy reader, fixed-tool goal producer, optional genuine ROM projector and fixed direct-pose snapshots end on search return or failure; the chosen hand frame retains no reader, prepared workspace or candidate history.
   */
  export function chosen(
    context: Pick<IHumanActionContext, "body">,
    tool: StrikingHeld.ITool,
    props: IChoice,
  ): StrikingHeld.IHandFrame {
    const { frame, tried, freedoms, back, posture } = props;
    let projection: ReturnType<typeof prepareHumanPostureProjection> | undefined;
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const goalFor: ReturnType<typeof StrikingHeld.prepareGoal> = goals(context, tool, back);
    let fixed: ReturnType<typeof resolveHumanPosture.prepareBase> | undefined;
    const prepared: (() => ReturnType<typeof resolveHumanPosture.prepareBase>) | undefined =
      typeof posture === "function" ? undefined : (): ReturnType<typeof resolveHumanPosture.prepareBase> =>
        (fixed ??= resolveHumanPosture.prepareBase(context.body, posture));
    return frame(
      HumanFreedomChoice.chosen({
        tried,
        freedoms,
        judge: (values: readonly number[]): number[] => {
          const posed: StrikingHeld.IHandFrame = frame(values);
          try {
            const current: IHumanPosture = typeof posture === "function" ? posture(posed) : posture;
            if (typeof posture === "function" && projection === undefined)
              projection = prepareHumanPostureProjection(context.body);
            return [
              miss(
                context,
                tool,
                posed,
                back,
                current,
                resolution,
                prepared,
                goalFor,
                projection,
              ),
            ];
          } catch (error) {
            if (error instanceof HumanRefusal) return [Infinity];
            throw error;
          }
        },
      }).values,
    );
  }

  /** A tool pose's freedoms as a law states them for `chosen`. */
  export interface IChoice {
    /** The hand frame the freedoms' values give. */
    frame: (values: readonly number[]) => StrikingHeld.IHandFrame;

    /** The values to fit first, in the law's order of preference, nearest the asked pose first. */
    tried: readonly (readonly number[])[];

    /** Each value's freedom: its bounds or period and its refinement step. */
    freedoms: readonly HumanFreedomChoice.Freedom[];

    /** The point of the tool the pose keeps, metres behind its working point. */
    back: number;

    /** The unchanged body/root/direct-joint/digit posture for this synchronous search, or an actual posture callback for each candidate frame when another hand supports that frame's tool. */
    posture:
      | IHumanPosture
      | ((frame: StrikingHeld.IHandFrame) => IHumanPosture);
  }

  /**
   * Of a law's candidate tool poses, in its order of preference, the first
   * the arm holds exactly, else the one the fitted hand misses least: what a
   * law that leaves a pose's freedom to the arm chooses by.
   *
   * @param context The action's context.
   * @param tool The tool.
   * @param candidates The poses, each built only when it is tried, preferred first.
   * @param back The point of the tool the pose keeps, metres behind its working point.
   * @param posture The body as it stands at the decisive instant.
   * @returns The chosen hand frame.
   * @throws {Error} When there is no candidate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order, the rule and each input.
   * @evidence contracts/development/implementation.md#principled-implementation Each candidate is judged by `miss`, the fit that counts the shoulder's, the forearm's and the wrist's ranges; an exact hold (under 0.1 mm) cannot be beaten, so the search ends there, and a later candidate wins only by more than that.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop with one early end.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The choice is the fit's; the caller's refusal (`reachable`) still judges the chosen pose.
   * @evidence contracts/development/implementation.md#efficient-algorithms Candidates are built and fitted lazily, so a law whose first pose holds pays one fit.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One fixed-posture direct assembly/clamp and one local exact FK reader serve this synchronous candidate loop; every candidate still supplies complete goals and runs actual arm/rival/digit fits on independent pose copies.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader, fixed-tool goal producer and fixed direct-pose preparation are local to the synchronous candidate loop and end on return or throw; only the chosen frame escapes.
   */
  export function best(
    context: Pick<IHumanActionContext, "body">,
    tool: StrikingHeld.ITool,
    candidates: readonly (() => StrikingHeld.IHandFrame)[],
    back: number,
    posture: IHumanPosture,
  ): StrikingHeld.IHandFrame {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const goalFor: ReturnType<typeof StrikingHeld.prepareGoal> = goals(context, tool, back);
    let fixed: ReturnType<typeof resolveHumanPosture.prepareBase> | undefined;
    const prepared = (): ReturnType<typeof resolveHumanPosture.prepareBase> =>
      (fixed ??= resolveHumanPosture.prepareBase(context.body, posture));
    let chosen: StrikingHeld.IHandFrame | undefined;
    let least: number = Infinity;
    for (const candidate of candidates) {
      if (least <= HumanFreedomChoice.EXACT) break;
      const frame: StrikingHeld.IHandFrame = candidate();
      const missed: number = miss(context, tool, frame, back, posture, resolution, prepared, goalFor);
      if (missed < least - HumanFreedomChoice.EXACT) {
        least = missed;
        chosen = frame;
      }
    }
    if (chosen === undefined) throw new Error("A tool pose has no candidate");
    return chosen;
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
    const distance: number = Vector3.distance(wrist, shoulder(context, tool.side, posture));
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

  /** One lazy fixed-tool goal producer shared only by this synchronous candidate search. */
  function goals(context: Pick<IHumanActionContext, "body">, tool: StrikingHeld.ITool, back: number): ReturnType<typeof StrikingHeld.prepareGoal> {
    let prepared: ReturnType<typeof StrikingHeld.prepareGoal> | undefined;
    return (frame: StrikingHeld.IHandFrame, bend: IAutoMovieVector3): IHumanPosture.IGoal => {
      if (prepared === undefined) prepared = StrikingHeld.prepareGoal(context, tool, back);
      return prepared(frame, bend);
    };
  }
  /** The holding arm's shoulder joint on a posture, world metres. */
  const shoulder = (
    context: Pick<IHumanActionContext, "body">,
    side: HumanHand.Side,
    posture: IHumanPosture,
  ): IAutoMovieVector3 =>
    HumanTrunk.resolve(context.body, posture, undefined, undefined, SHOULDERS[side]).get(`${side}UpperArm`)!
      .worldPosition;
}

/** The two actual output branches consumed by tool-pose judging. */
const HANDS: Readonly<Record<HumanHand.Side, ReadonlySet<AutoMovieHumanoidBone>>> = {
  left: new Set<AutoMovieHumanoidBone>(["leftHand"]),
  right: new Set<AutoMovieHumanoidBone>(["rightHand"]),
};

/** Ranking needs only the holding shoulder and its FK ancestry. */
const SHOULDERS: Readonly<Record<HumanHand.Side, ReadonlySet<AutoMovieHumanoidBone>>> = {
  left: new Set<AutoMovieHumanoidBone>(["leftUpperArm"]),
  right: new Set<AutoMovieHumanoidBone>(["rightUpperArm"]),
};

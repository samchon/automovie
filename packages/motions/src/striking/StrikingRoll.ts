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
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingHeld } from "./StrikingHeld";
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Actual pose misses, geometric ranks, chosen frames and physical refusals serve the existing blade/firearm consumers; fixed-axis rigid sampling stays with StrikingRollHand.
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
   * @returns The greater of the kept point's and the working point's displacement, metres; a pose that keeps the working point itself reads the line at the tool's own length in place of the kept point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is fitted, on which body and what is measured.
   * @evidence contracts/development/implementation.md#principled-implementation The plan's own goal for the pose is resolved by the posture resolver, the fitted hand's grip frame is read by forward kinematics, and the tool's two points are carried by it: the displacement a viewer would see.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One goal, one resolution, one read-back.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both the kept point and the working point are read, so a tool that keeps its point and points elsewhere is counted; when the kept point is the working point, the line is read at the tool's length, so the count holds there too.
   * @evidence contracts/development/implementation.md#efficient-algorithms One original elbow search and complete posture fit precede demanded hand FK. Every candidate keeps current direct admission, ROM projection and limb/digit/rival solving; a genuine local exact reader can share only equal FK prerequisites, with speedup unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit parent FK supplier checks exact scalar dependencies only within this synchronous search. Current tool goal, raw posture fields and native direct/ROM admission are read afresh, including mutable fields or getters; no posture identity certifies fixed authoring and no fitted answer is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The optional exact reader is borrowed through synchronous return or throw; each candidate releases its independent pose/map and temporary goal, while only the scalar miss escapes. No direct-pose snapshot or ROM mapper enters retained state.
   */
  export function miss(
    context: Pick<IHumanActionContext, "body">,
    tool: StrikingHeld.ITool,
    frame: StrikingHeld.IHandFrame,
    back: number,
    posture: IHumanPosture,
    resolution?: ReturnType<typeof prepareHumanPoseResolution>,
  ): number {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      resolution ?? prepareHumanPoseResolution();
    const bend: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const goal: IHumanPosture.IGoal = StrikingHeld.goal(context, tool, frame, back, bend);
    const limbs: IHumanPosture["limbs"] = {
      ...posture.limbs,
      [`${tool.side}Arm`]: {
        ...goal,
        // The hanging arm remains the named fallback for an unconstrained elbow.
        bend: AutoMovieMotionHumanBend.hang(context.body, posture, tool.side),
      },
    };
    const fittedPose: ReturnType<typeof resolveHumanPosture.seeded> =
      resolveHumanPosture.seeded(context.body, { ...posture, limbs }, undefined, {}, read);
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The one-shot path normalizes its axis, reads the fixed shoulder when present, constructs each actual frame and ranks the original grid before chosen; the separate StrikingRollHand factory requires explicitly unchanged tool geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The steps (10 degrees of cone, 45 of azimuth, 30 of turn) are a search resolution; the placed point is on its place for every candidate; the choice is made by the fit, never by the residual alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each invocation retains the original 12 turns times cone lines and TRIED fits/refinements. Canonical body/side anatomical metadata is weakly shared by StrikingStrain, while every frame, callback, raw direct/ROM admission and actual fit remains current; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A plain posture is not proof of immutable direct fields or getters. All hand candidates retain original current tool/frame and raw direct admission, with the original axis-to-shoulder-to-frame-to-callback/shoulder-to-strain observation order. Only canonical immutable body anatomy is shared; no posture, tool geometry or ROM answer is inferred from object identity.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Candidate ranks and actual chooser workspaces end with this synchronous search; only the independent chosen hand frame escapes. No future callback's tool geometry or pose is retained as an answer.
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
    const along: IAutoMovieVector3 = Vector3.normalize(axis);
    const from: IAutoMovieVector3 | undefined = typeof posture === "function" ? undefined : shoulder(context, tool.side, posture);
    const aside: IAutoMovieVector3 = Vector3.normalize(Vector3.cross(along, Math.abs(along.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 }));
    const frame: IChoice["frame"] = (values: readonly number[]): StrikingHeld.IHandFrame => {
      const [tilt, around, turn] = values as readonly [number, number, number];
      const run: IAutoMovieVector3 = Quaternion.rotateVector(Quaternion.fromAxisAngle(along, around), Quaternion.rotateVector(Quaternion.fromAxisAngle(aside, tilt), along));
      return StrikingHeld.hand(tool, back, at, run, Quaternion.rotateVector(Quaternion.fromAxisAngle(run, turn), Vector3.cross(run, aside)));
    };
    const rank: (values: readonly number[]) => number = (values: readonly number[]): number => {
      const posed: StrikingHeld.IHandFrame = frame(values);
      try {
        const actual: IAutoMovieVector3 = from ?? shoulder(context, tool.side, typeof posture === "function" ? posture(posed) : posture);
        const measure: ReturnType<typeof StrikingStrain> = StrikingStrain(context.body, tool.side);
        return measure(posed, actual);
      } catch (error) {
        if (error instanceof HumanRefusal) return Infinity;
        throw error;
      }
    };
    const candidates: { values: number[]; rank: number }[] = [];
    for (let tilt: number = 0; tilt <= cone + 1e-9; tilt += 10)
      for (let around: number = 0; around < 360; around += 45) {
        for (let turn: number = 0; turn < 360; turn += 30) {
          const values: number[] = [tilt, around, turn];
          candidates.push({ values, rank: rank(values) + (0.1 * tilt * Math.PI) / 180 });
        }
        if (tilt === 0) break;
      }
    candidates.sort((a: { rank: number }, b: { rank: number }): number => a.rank - b.rank);
    return chosen(context, tool, {
      frame,
      tried: candidates.slice(0, TRIED).map((candidate: { values: number[] }): number[] => candidate.values),
      freedoms: [
        { kind: "bounded", step: cone > 0 ? 5 : 0, least: 0, greatest: cone },
        { kind: "wrapped", step: 22.5, period: 360 },
        { kind: "wrapped", step: 15, period: 360 },
      ],
      back, posture,
    });
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
   * @evidence contracts/development/implementation.md#efficient-algorithms One raw trunk query admits all current authored joints and evaluates only shoulder ancestry, then fixed anatomical vector work returns the residual; no limb fit is performed and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares only the canonical StrikingStrain body/side anatomical metadata with hand. Each call first reads its current raw shoulder, then obtains the current side's anatomical rank reader; no shoulder, raw posture or rank answer is reused.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The anatomical closure and fresh raw-trunk map end on return or throw. Only the scalar rank escapes, with no pose, FK workspace, hand frame or numerical history retained.
   */
  export function strain(
    context: Pick<IHumanActionContext, "body">,
    tool: StrikingHeld.ITool,
    frame: StrikingHeld.IHandFrame,
    posture: IHumanPosture,
  ): number {
    const from: IAutoMovieVector3 = shoulder(context, tool.side, posture);
    return StrikingStrain(context.body, tool.side)(frame, from);
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
   * @evidence contracts/development/implementation.md#efficient-algorithms The original lazy fit/refinement budget remains. Every callback candidate rebuilds its actual tool goal and re-admits direct posture/ROM inputs before the complete original limb/digit/rival fits; exact FK prerequisites alone may share a native workspace, with no measured speedup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One exact FK reader checks actual scalar dependencies within this synchronous search. Frame callbacks and raw field getters may change current authoring, so every candidate retains cold seeded admission; neither object identity nor a pure frame producer certifies borrowed posture immutability.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local exact reader and each independent current goal/fit/map end on search return or failure. No direct snapshot, tool geometry, ROM mapper or candidate answer is retained by the chosen fresh hand frame.
   */
  export function chosen(
    context: Pick<IHumanActionContext, "body">,
    tool: StrikingHeld.ITool,
    props: IChoice,
  ): StrikingHeld.IHandFrame {
    const { frame, tried, freedoms, back, posture }: IChoice = props;
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    return frame(
      HumanFreedomChoice.chosen({
        tried,
        freedoms,
        judge: (values: readonly number[]): number[] => {
          const posed: StrikingHeld.IHandFrame = frame(values);
          try {
            const current: IHumanPosture = typeof posture === "function" ? posture(posed) : posture;
            return [
              miss(
                context,
                tool,
                posed,
                back,
                current,
                resolution,
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

  /**
   * A tool pose's freedoms as a law states them for chosen.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members state actual candidate frame construction, ordered preferred values, bounded/wrapped freedoms, kept-point metres and actual posture inputs, whose object fields may change inside a frame callback.
   * @evidence contracts/development/design.md#principled-representation Existing hand/posture types and HumanFreedomChoice freedoms encode actual geometric candidates and complete body demands without storing a solved pose or success flag.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The chooser consumes exactly the frame producer, original trial ordering/refinement freedoms, kept tool point and actual candidate posture source.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A posture object is read after each actual frame callback and is never assumed immutable by identity; every current raw field is re-admitted cold, and all candidates retain original limb/digit/rival fits and limits.
   */
  export interface IChoice {
    /** The hand frame the freedoms' values give. */
    frame: (values: readonly number[]) => StrikingHeld.IHandFrame;

    /** The values to fit first, in the law's order of preference, nearest the asked pose first. */
    tried: readonly (readonly number[])[];

    /** Each value's freedom: its bounds or period and its refinement step. */
    freedoms: readonly HumanFreedomChoice.Freedom[];

    /** The point of the tool the pose keeps, metres behind its working point. */
    back: number;

    /** The current body posture, read after each actual frame callback, or a posture callback for each candidate frame when another hand supports that frame's tool. */
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One local exact FK reader checks actual scalar dependencies; each arbitrary candidate callback is followed by a fresh current tool goal, direct-joint admission and ROM projection, retaining in-place posture/tool/table changes and all arm/rival/digit fitting.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The exact reader and each independent fitted pose/map end with the synchronous loop on return or throw. No posture snapshot, fixed tool geometry, ROM projector or candidate history is retained, and only the chosen frame escapes.
   */
  export function best(
    context: Pick<IHumanActionContext, "body">,
    tool: StrikingHeld.ITool,
    candidates: readonly (() => StrikingHeld.IHandFrame)[],
    back: number,
    posture: IHumanPosture,
  ): StrikingHeld.IHandFrame {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    let chosen: StrikingHeld.IHandFrame | undefined;
    let least: number = Infinity;
    for (const candidate of candidates) {
      if (least <= HumanFreedomChoice.EXACT) break;
      const frame: StrikingHeld.IHandFrame = candidate();
      const missed: number = miss(context, tool, frame, back, posture, resolution);
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses canonical grip/shoulder geometry and the original miss owner. The actual shoulder reach test and subsequent full fit borrow one exact same-body FK workspace within this synchronous check; distinct postures and calls remain independent.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One lazy exact workspace and temporary raw/fitted maps end on normal return or either refusal; no query result, reader, goal or new history is retained by a returned plan.
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
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const distance: number = Vector3.distance(wrist, shoulder(context, tool.side, posture, resolution));
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
    const missed: number = miss(context, tool, frame, back, posture, resolution);
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
  const shoulder: (
    context: Pick<IHumanActionContext, "body">,
    side: HumanHand.Side,
    posture: IHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ) => IAutoMovieVector3 = (
    context: Pick<IHumanActionContext, "body">,
    side: HumanHand.Side,
    posture: IHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieVector3 =>
    HumanTrunk.resolve(context.body, posture, undefined, resolution, SHOULDERS[side]).get(`${side}UpperArm`)!
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

import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanStrikingRoll,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanRefusal } from "../../law/HumanRefusal";
import { StrikingHeld } from "./StrikingHeld";
import { StrikingRoll } from "./StrikingRoll";
import { StrikingStrain } from "./StrikingStrain";

/**
 * Prepare the unchanged tool and world-axis geometry of a roll search. Every
 * placement still ranks the original grid against its actual posture, then
 * physically fits/refines the same preferred candidates.
 *
 * @param context The unchanged canonical body used by every search.
 * @param tool The unchanged held tool and hand side.
 * @param back Metres behind the working point of the point being placed.
 * @param axis The unchanged world line, normalized by the original rule.
 * @param cone The unchanged allowed lean, degrees.
 * @returns A reader of the chosen hand at a changing world point and posture.
 */
export function StrikingRollHand(
  context: Pick<IAutoMovieMotionHumanActionContext, "body">,
  tool: IAutoMovieMotionHumanStrikingHeld.ITool,
  back: number,
  axis: IAutoMovieVector3,
  cone: number,
): (
  at: IAutoMovieVector3,
  posture: IAutoMovieMotionHumanStrikingRoll.IChoice["posture"],
) => IAutoMovieMotionHumanStrikingHeld.IHandFrame {
  const strain: ReturnType<typeof StrikingStrain> = StrikingStrain(
    context.body,
    tool.side,
  );
  const along: IAutoMovieVector3 = Vector3.normalize(axis);
  const aside: IAutoMovieVector3 = StrikingRollHand.aside(along);
  const shoulderBones: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([`${tool.side}UpperArm`]);
  const shoulderAt: ReturnType<typeof HumanTrunk.prepareResolve> =
    HumanTrunk.prepareResolve(context.body, shoulderBones);
  const shoulder = (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
    shoulderAt(posture).get(`${tool.side}UpperArm`)!.worldPosition;
  const rigid = (
    values: readonly number[],
  ): ReturnType<typeof StrikingHeld.prepareHand> => {
    const [tilt, around, turn] = values as readonly [number, number, number];
    const run: IAutoMovieVector3 = StrikingRollHand.run(
      along,
      aside,
      tilt,
      around,
    );
    return StrikingHeld.prepareHand(
      tool,
      back,
      run,
      Quaternion.rotateVector(
        Quaternion.fromAxisAngle(run, turn),
        Vector3.cross(run, aside),
      ),
    );
  };
  const fixed: Map<
    string,
    ReturnType<typeof StrikingHeld.prepareHand>
  > = new Map();
  const grid: number[][] = StrikingRollHand.grid(cone);
  for (const values of grid) fixed.set(key(values), rigid(values));
  return (
    at: IAutoMovieVector3,
    posture: IAutoMovieMotionHumanStrikingRoll.IChoice["posture"],
  ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => {
    const from: IAutoMovieVector3 | undefined =
      typeof posture === "function" ? undefined : shoulder(posture);
    const frame = (
      values: readonly number[],
    ): IAutoMovieMotionHumanStrikingHeld.IHandFrame =>
      (fixed.get(key(values)) ?? rigid(values))(at);
    const rank = (values: readonly number[]): number => {
      const posed: IAutoMovieMotionHumanStrikingHeld.IHandFrame = frame(values);
      try {
        return strain(
          posed,
          from ??
            shoulder(typeof posture === "function" ? posture(posed) : posture),
        );
      } catch (error) {
        if (error instanceof HumanRefusal) return Infinity;
        throw error;
      }
    };
    const candidates: IStrikingRollHandCandidatesItem[] = grid.map(
      (values: number[]): IStrikingRollHandCandidatesResult => ({
        values: [...values],
        rank: rank(values) + (0.1 * values[0]! * Math.PI) / 180,
      }),
    );
    candidates.sort(
      (a: IStrikingRollHandA, b: IStrikingRollHandB): number => a.rank - b.rank,
    );
    return StrikingRoll.chosen(context, tool, {
      frame,
      tried: candidates
        .slice(0, StrikingRoll.TRIED)
        .map(
          (candidate: IStrikingRollHandCandidate): number[] => candidate.values,
        ),
      freedoms: [
        { kind: "bounded", step: cone > 0 ? 5 : 0, least: 0, greatest: cone },
        { kind: "wrapped", step: 22.5, period: 360 },
        { kind: "wrapped", step: 15, period: 360 },
      ],
      back,
      posture,
    });
  };
}

/** The hand frames a roll searches. */
export namespace StrikingRollHand {
  /**
   * A unit perpendicular to an axis: across it from the vertical, or from +Z
   * when the axis is near vertical.
   *
   * @param along The unit axis.
   * @returns The unit perpendicular.
   */
  export function aside(along: IAutoMovieVector3): IAutoMovieVector3 {
    return Vector3.normalize(
      Vector3.cross(
        along,
        Math.abs(along.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 },
      ),
    );
  }

  /**
   * The tool's run tilted off its axis: tilted about the perpendicular, then
   * turned about the axis.
   *
   * @param along The unit axis.
   * @param aside The unit perpendicular.
   * @param tilt The tilt, degrees.
   * @param around The turn about the axis, degrees.
   * @returns The unit run.
   */
  export function run(
    along: IAutoMovieVector3,
    aside: IAutoMovieVector3,
    tilt: number,
    around: number,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      Quaternion.fromAxisAngle(along, around),
      Quaternion.rotateVector(Quaternion.fromAxisAngle(aside, tilt), along),
    );
  }

  /**
   * The search grid of tilt, turn about the axis and roll about the run,
   * degrees: the untilted run rolled every 30 degrees, and each tilt every 10
   * degrees within the cone turned every 45 degrees and rolled every 30.
   *
   * @param cone The greatest tilt, degrees.
   * @returns The [tilt, around, turn] triples.
   */
  export function grid(cone: number): number[][] {
    const grid: number[][] = [];
    for (let tilt: number = 0; tilt <= cone + 1e-9; tilt += 10)
      for (let around: number = 0; around < 360; around += 45) {
        for (let turn: number = 0; turn < 360; turn += 30)
          grid.push([tilt, around, turn]);
        if (tilt === 0) break;
      }
    return grid;
  }
}

/** Exact finite angle identity; do not conflate negative and positive zero. */
function key(values: readonly number[]): string {
  return values
    .map((value: number): string =>
      Object.is(value, -0) ? "-0" : String(value),
    )
    .join("/");
}

/** The record of `IStrikingRollHandCandidate`'s site. */
type IStrikingRollHandCandidate = { values: number[] };

/** The record of `IStrikingRollHandB`'s site. */
type IStrikingRollHandB = { rank: number };

/** The record of `IStrikingRollHandA`'s site. */
type IStrikingRollHandA = { rank: number };

/** The record of `IStrikingRollHandCandidatesResult`'s site. */
type IStrikingRollHandCandidatesResult = { values: number[]; rank: number };

/** The record of `IStrikingRollHandCandidatesItem`'s site. */
type IStrikingRollHandCandidatesItem = { values: number[]; rank: number };

import { Quaternion, Vector3 } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingHeld } from "./StrikingHeld";
import { StrikingRoll } from "./StrikingRoll";
import { StrikingStrain } from "./StrikingStrain";

/**
 * Prepare the unchanged tool and world-axis geometry of a roll search.
 * Every placement still ranks the original grid against its actual posture,
 * then physically fits/refines the same preferred candidates.
 *
 * @param context The unchanged canonical body used by every search.
 * @param tool The unchanged held tool and hand side.
 * @param back Metres behind the working point of the point being placed.
 * @param axis The unchanged world line, normalized by the original rule.
 * @param cone The unchanged allowed lean, degrees.
 * @returns A reader of the chosen hand at a changing world point and posture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines fixed tool/body/axis/cone inputs, changing world-metre placement/posture and actual per-call physical selection.
 * @evidence contracts/development/implementation.md#principled-implementation Retains the original 10-degree lean, 45-degree azimuth and 30-degree roll grid and straight-wrist residual rank, then delegates the original TRIED candidates and freedoms to StrikingRoll.chosen. Only rigid alignment/kept-point offsets independent of position and posture are prepared.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed candidate-grid producer owns tool/axis geometry; each returned invocation owns its actual shoulder, ranks, stable sort and physical chooser. StrikingRoll.hand is the one-shot facade and fixed-axis insertion can retain the same producer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All original grid entries, rank penalty, strict ordering, refusal handling, TRIED count and refinement freedoms remain. No pose, rank, shoulder, fitted result or chosen angle is reused; frame outputs are fresh and a changing posture callback is evaluated for every original candidate.
 * @evidence contracts/development/implementation.md#efficient-algorithms G fixed grid entries prepare O(G) rigid alignment/offset readers once. Each query retains O(G) actual ranking and sorting plus the original numerical fit/refinement cost; grid frame placement is constant subtraction and fresh copying, while nongrid refinement geometry is computed normally. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Explicitly fixed body/tool/back/axis/cone scalar geometry determines grid orientations and offsets. A genuine fixed raw-shoulder demand also shares only its canonical name/rig preparation, recomputing every actual posture's authored admission and FK. Exact angle keys reuse only these fixed readers; signed zero has a separate key, and no changing point/posture/time or contact answer is retained.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The enclosing one-shot search or fixed-axis action owns G angle records and G rigid readers, bounded by its original cone grid; nongrid refinements are not retained. Each query releases ranks, temporary frames and FK/direct-pose workspaces on return or failure, and the output retains no reader or history.
 */
export function StrikingRollHand(
  context: Pick<IHumanActionContext, "body">,
  tool: StrikingHeld.ITool,
  back: number,
  axis: IAutoMovieVector3,
  cone: number,
): (at: IAutoMovieVector3, posture: StrikingRoll.IChoice["posture"]) => StrikingHeld.IHandFrame {
  const strain: ReturnType<typeof StrikingStrain> = StrikingStrain(context.body, tool.side);
  const along: IAutoMovieVector3 = Vector3.normalize(axis);
  const aside: IAutoMovieVector3 = Vector3.normalize(Vector3.cross(
    along, Math.abs(along.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 },
  ));
  const shoulderBones: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([`${tool.side}UpperArm`]);
  const shoulderAt: ReturnType<typeof HumanTrunk.prepareResolve> = HumanTrunk.prepareResolve(context.body, shoulderBones);
  const shoulder = (posture: IHumanPosture): IAutoMovieVector3 =>
    shoulderAt(posture).get(`${tool.side}UpperArm`)!.worldPosition;
  const rigid = (values: readonly number[]): ReturnType<typeof StrikingHeld.prepareHand> => {
    const [tilt, around, turn] = values as readonly [number, number, number];
    const run: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.fromAxisAngle(along, around),
      Quaternion.rotateVector(Quaternion.fromAxisAngle(aside, tilt), along),
    );
    return StrikingHeld.prepareHand(tool, back, run, Quaternion.rotateVector(
      Quaternion.fromAxisAngle(run, turn), Vector3.cross(run, aside),
    ));
  };
  const fixed: Map<string, ReturnType<typeof StrikingHeld.prepareHand>> = new Map();
  const grid: number[][] = [];
  for (let tilt: number = 0; tilt <= cone + 1e-9; tilt += 10)
    for (let around: number = 0; around < 360; around += 45) {
      for (let turn: number = 0; turn < 360; turn += 30) {
        const values: number[] = [tilt, around, turn];
        grid.push(values);
        fixed.set(key(values), rigid(values));
      }
      if (tilt === 0) break;
    }
  return (at: IAutoMovieVector3, posture: StrikingRoll.IChoice["posture"]): StrikingHeld.IHandFrame => {
    const from: IAutoMovieVector3 | undefined = typeof posture === "function" ? undefined : shoulder(posture);
    const frame = (values: readonly number[]): StrikingHeld.IHandFrame =>
      (fixed.get(key(values)) ?? rigid(values))(at);
    const rank = (values: readonly number[]): number => {
      const posed: StrikingHeld.IHandFrame = frame(values);
      try {
        return strain(posed, from ?? shoulder(typeof posture === "function" ? posture(posed) : posture));
      } catch (error) {
        if (error instanceof HumanRefusal) return Infinity;
        throw error;
      }
    };
    const candidates: { values: number[]; rank: number }[] = grid.map(
      (values: number[]): { values: number[]; rank: number } => ({
        values: [...values], rank: rank(values) + (0.1 * values[0]! * Math.PI) / 180,
      }),
    );
    candidates.sort((a: { rank: number }, b: { rank: number }): number => a.rank - b.rank);
    return StrikingRoll.chosen(context, tool, {
      frame,
      tried: candidates.slice(0, StrikingRoll.TRIED).map((candidate: { values: number[] }): number[] => candidate.values),
      freedoms: [
        { kind: "bounded", step: cone > 0 ? 5 : 0, least: 0, greatest: cone },
        { kind: "wrapped", step: 22.5, period: 360 },
        { kind: "wrapped", step: 15, period: 360 },
      ],
      back, posture,
    });
  };
}

/** Exact finite angle identity; do not conflate negative and positive zero. */
function key(values: readonly number[]): string {
  return values.map((value: number): string => Object.is(value, -0) ? "-0" : String(value)).join("/");
}

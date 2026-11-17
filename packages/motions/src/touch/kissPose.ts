import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRise } from "../compose/AutoMovieMotionHumanRise";
import type { kiss } from "./kiss";

/**
 * Build each actual kiss-search candidate from the current raw entry.
 * Only the primitive fixed cervical twist is prepared; every candidate
 * re-reads heading, standing rise, pivot and authored joint additions.
 *
 * @param body The unchanged canonical body for this synchronous search.
 * @param entry The borrowed raw entry, whose fields/getters remain current.
 * @param stance The standing placements read by every original rise.
 * @param twist The fixed primitive head twist, degrees.
 * @param behind The backward displacement along current entry heading, metres.
 * @returns A fresh complete candidate posture for actual pitch/roll/flexion/raise.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States raw entry/stance observation, primitive angular/displacement units and fresh current candidate ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the original standing-foot rise, trunk pivot, cervical sharing and ordered root/joint additions for every actual candidate.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed scalar twist supplies shared cervical constants; the returned reader independently computes current heading/rise/pivot/flexion and fresh authored fields.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No entry identity certifies fixed raw authoring. Every candidate re-reads its original entry heading, foot rise, pivot and joint fields without a supplied cached displacement, changed angle or omitted physical fit.
 * @evidence contracts/development/implementation.md#efficient-algorithms The primitive fixed twist's constant head-share record prepares once, while all original candidate rise, heading, pivot, current authored assembly and downstream FK work remains. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the immutable primitive twist and head-share formula establish reusable constants. Raw entry/stance fields and changing candidate angles are evaluated independently, with no pose, shoulder, rise or solved-answer memo.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous search owns this reader and fixed cervical constants until return or throw. It stores no candidate pose, derived raw offset, FK workspace, time, displacement or history; only selected scalar angles/miss escape the enclosing solve.
 */
export function kissPose(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  stance: IAutoMovieMotionHumanRise.Stance,
  twist: number,
  behind: number,
): (s: Pick<kiss.ISolved, "pitch" | "roll" | "flexion" | "raise">) => IAutoMovieMotionHumanPosture {
  const turn: ReturnType<typeof AutoMovieMotionHumanHead.share> = AutoMovieMotionHumanHead.share(2, twist);
  return (s: Pick<kiss.ISolved, "pitch" | "roll" | "flexion" | "raise">): IAutoMovieMotionHumanPosture => {
    const yaw: number = (entry.yaw * Math.PI) / 180;
    const offset: IAutoMovieVector3 = { x: -Math.sin(yaw) * behind, y: 0, z: -Math.cos(yaw) * behind };
    const leaned: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanLean.pivot(
      body,
      {
        ...entry,
        root: Vector3.add(
          Vector3.add(entry.root, AutoMovieMotionHumanRise.lift(body, stance, s.raise)),
          offset,
        ),
      },
      { pitch: s.pitch, roll: s.roll },
    );
    const head: ReturnType<typeof AutoMovieMotionHumanHead.share> = AutoMovieMotionHumanHead.share(0, s.flexion);
    const held: (bone: "neck" | "head") => readonly [number, number, number] = (bone: "neck" | "head"): readonly [number, number, number] =>
      leaned.joints[bone] ?? [0, 0, 0];
    return {
      ...leaned,
      joints: {
        ...leaned.joints,
        neck: [
          held("neck")[0] + head.neck![0],
          held("neck")[1],
          held("neck")[2] + turn.neck![2],
        ],
        head: [
          held("head")[0] + head.head![0],
          held("head")[1],
          held("head")[2] + turn.head![2],
        ],
      },
    };
  };
}

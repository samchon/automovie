import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRise } from "../compose/AutoMovieMotionHumanRise";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { kiss } from "./kiss";

/**
 * Prepare a kiss search's fixed heading offset and shared cervical twist.
 * Every candidate still rises, pivots and adds its actual head flexion to
 * the entry's authored joints in the original arithmetic order.
 *
 * @param body The unchanged canonical body for this synchronous search.
 * @param entry The unchanged entry posture.
 * @param stance Its unchanged standing foot placements.
 * @param twist The fixed head twist, degrees.
 * @param behind The fixed backward displacement along entry heading, metres.
 * @returns A fresh candidate posture reader, optionally borrowing the exact
 * foot-rise displacement already computed for that candidate's raise.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed body/entry/stance, angular and displacement units, fresh changing candidates and the exact optional rise premise.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the original foot-rise, trunk-pivot and cervical-sharing owners and the same ordered root additions and existing-joint angle additions for every candidate.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Heading offset and fixed twist are prepared once; the returned reader owns only the current candidate's rise, pivot and flexion assembly.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No candidate, authored joint, rise, lean or target is approximated or skipped. A supplied rise must be the original lift for the exact same body/stance/raise; omitted rise runs the ordinary lift owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed heading trigonometry and head-twist sharing run once per search. A least group can explicitly share its single actual raise displacement; each candidate still pays its own pivot, flexion, complete authored assembly and downstream FK, with no measured speedup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The synchronous caller fixes body, entry, stance, twist and backward offset. Only those invariant values and an explicitly identical raise displacement are reused; changed candidate angles always create a fresh actual posture.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The search owns this closure and its fixed vectors until return or throw. No candidate posture, FK workspace, time, solved answer or history is stored; only the search's selected scalar angles and miss escape.
 */
export function kissPose(
  body: IHumanBody,
  entry: IHumanPosture,
  stance: AutoMovieMotionHumanRise.Stance,
  twist: number,
  behind: number,
): (s: Pick<kiss.ISolved, "pitch" | "roll" | "flexion" | "raise">, raised?: IAutoMovieVector3) => IHumanPosture {
  const yaw: number = (entry.yaw * Math.PI) / 180;
  const offset: IAutoMovieVector3 = { x: -Math.sin(yaw) * behind, y: 0, z: -Math.cos(yaw) * behind };
  const turn: ReturnType<typeof AutoMovieMotionHumanHead.share> = AutoMovieMotionHumanHead.share(2, twist);
  return (s: Pick<kiss.ISolved, "pitch" | "roll" | "flexion" | "raise">, raised?: IAutoMovieVector3): IHumanPosture => {
    const leaned: IHumanPosture = AutoMovieMotionHumanLean.pivot(
      body,
      {
        ...entry,
        root: Vector3.add(
          Vector3.add(entry.root, raised ?? AutoMovieMotionHumanRise.lift(body, stance, s.raise)),
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

import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanLanceCouchCarriage } from "./HumanLanceCouchCarriage";
import { HumanLanceCouchClear } from "./HumanLanceCouchClear";
import { HumanLanceCouchPick } from "./HumanLanceCouchPick";
import * as HumanLanceCouchHangingData from "./HumanLanceCouchHangingData";

/*
 * The carry from the arm's own line: the upper arm out and down from the
 * shoulder (`UPPER`), the forearm at the grasp's angle to the shaft, clear of
 * the horse, turned about the shaft to the place whose hand turns least from
 * the hand the rider enters with, so the forearm twists no further than it
 * must; the grip at the forearm's end.
 * Parameter arm: The rider's lance arm.
 * Parameter shoulder: The right shoulder, seat-frame metres.
 * Parameter tool: The held lance in the hand's frame.
 * Parameter along: The direction the shaft runs, seat frame.
 * Parameter entered: The entry hand's rotation, seat frame.
 * Parameter horse: The horse's body, which the carriage keeps clear of.
 * Parameter reaches: Whether the arm's own fit holds a carriage.
 * Returns: The hand's frame and the elbow.
 * On `target` when no forearm about the shaft lays the
 * carry.
 */
export function HumanLanceCouchHanging(
  arm: HumanLanceCouchCarriage.IArm,
  shoulder: IAutoMovieVector3,
  tool: IAutoMovieMotionHumanStrikingHeld.ITool,
  along: IAutoMovieVector3,
  entered: IAutoMovieQuaternion,
  horse: HumanLanceCouchClear.IHorseBody,
  reaches: (laid: HumanLanceCouchCarriage.ICarriage) => number,
): HumanLanceCouchCarriage.ICarriage {
  const d: IAutoMovieVector3 = Vector3.normalize(along);
  const alpha: number = Math.acos(
    Math.max(
      -1,
      Math.min(1, Vector3.dot(arm.line, Vector3.normalize(tool.axis))),
    ),
  );
  const seed: IAutoMovieVector3 =
    Math.abs(d.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const p: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(seed, Vector3.scale(d, Vector3.dot(seed, d))),
  );
  const q: IAutoMovieVector3 = Vector3.cross(d, p);
  const elbow: IAutoMovieVector3 = Vector3.add(
    shoulder,
    Vector3.scale(Vector3.normalize(HumanLanceCouchHangingData.UPPER), arm.upperArm),
  );
  const options: HumanLanceCouchPick.IOption[] = [];
  let laidCount: number = 0;
  for (
    let around: number = 0;
    around < 360;
    around += HumanLanceCouchHanging.AROUND
  ) {
    const phi: number = (around * Math.PI) / 180;
    const u: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(p, Math.cos(phi)),
      Vector3.scale(q, Math.sin(phi)),
    );
    const f: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(d, Math.cos(alpha)),
      Vector3.scale(u, Math.sin(alpha)),
    );
    const grip: IAutoMovieVector3 = Vector3.add(
      elbow,
      Vector3.scale(f, arm.fore),
    );
    try {
      const laid: HumanLanceCouchCarriage.ICarriage = HumanLanceCouchCarriage(
        arm,
        shoulder,
        tool,
        grip,
        d,
      );
      ++laidCount;
      if (!HumanLanceCouchClear(horse, laid)) continue;
      options.push({
        laid,
        turn: Quaternion.angle(laid.hand.rotation, entered),
      });
    } catch (error: unknown) {
      if (!(error instanceof AutoMovieMotionHumanRefusal)) throw error;
    }
  }
  const picked: HumanLanceCouchPick.IPick = HumanLanceCouchPick(
    options,
    reaches,
  );
  if (picked.laid === undefined)
    throw new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "target",
      value: (alpha * 180) / Math.PI,
      feasible: null,
      reason: `no forearm at the grasp's ${((alpha * 180) / Math.PI).toFixed(0)} degrees to the lance lays its carry from the upper arm out and down: ${laidCount} of ${360 / HumanLanceCouchHanging.AROUND} turns about the shaft lay an arm, ${options.length} of them clear the horse, and the arm's own fit holds none of the ${Math.min(HumanLanceCouchPick.TRIES, options.length)} turning least, the nearest leaving the lance ${(picked.miss * 1000).toFixed(0)} mm off`,
      fix: "take the lance by a grasp nearer its own line",
    });
  return picked.laid;
}

/*
 * The bound `HumanLanceCouchHanging` and the strike's search share.
 */
export namespace HumanLanceCouchHanging {
  /*
   * The directions a strike's grip is sought from the target in: around the
   * target's vertical, in degrees.
   */
  export const AROUND: number = 15;
}

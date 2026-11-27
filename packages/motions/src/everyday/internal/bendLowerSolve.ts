import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBendLower,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPhysics } from "../../law/internal/HumanPhysics";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanBalance } from "./HumanBalance";
import { bendLower } from "./bendLower";
import { bendLowerPitch } from "./bendLowerPitch";

/*
 * Find the least inclination whose moving shoulder reaches the wrist. A
 * low-level query describes one key; a caller observing it as part of a longer
 * action supplies the action's clock and local second. A free key follows the
 * measured stoop retreat or the squat's anchored leg geometry.
 * Parameter balance: Optional sagittal hip shift. Its weight scales only the
 * missing support displacement at the selected posture.
 * Parameter instant: Action clock for the queried key. The standalone key's start
 * and end coincide at zero when absent.
 */
export function bendLowerSolve(
  body: IAutoMovieMotionHumanBody,
  upright: IAutoMovieMotionHumanPosture,
  target: IAutoMovieVector3,
  side: AutoMovieHumanSide,
  strategy: IAutoMovieMotionHumanBendLower.ISolved["strategy"],
  reach?: number,
  balance?: IAutoMovieMotionHumanBalance,
  wristAt?: bendLower.WristAt,
  lateral: number = 0,
  instant?: bendLowerSolve.IInstant,
): IAutoMovieMotionHumanBendLower.ISolved {
  let lean: number =
    strategy === "stoop" ? bendLower.STOOP_BACK * body.measure.stature : 0;
  let deg: number = bendLowerPitch(
    body,
    upright,
    target,
    side,
    strategy,
    lean,
    reach,
    wristAt,
    lateral,
  );
  if (balance === undefined) return { strategy, lean, pitch: deg };
  const window: HumanPhysics.Window = HumanPhysics.prepare(
    { balance },
    {},
    instant?.start ?? 0,
    instant?.timing ?? { duration: 0, events: [] },
    instant?.instant,
  );
  const weight: number = HumanPhysics.weightAt(window, instant?.seconds ?? 0);
  if (window === null || weight === 0) return { strategy, lean, pitch: deg };
  if (window.by !== "hips")
    throw new HumanRefusal({
      kind: "parameter",
      axis: "balance.by",
      value: window.by,
      reason:
        "a lowering key represents the hips' retreat along the standing heading",
      fix: "give hips for balance.by",
    });
  const sine: number = Math.sin((deg * Math.PI) / 180);
  const key: IAutoMovieMotionHumanPosture = bendLower.lower(
    body,
    upright,
    strategy,
    deg,
    1,
    lean * sine,
    undefined,
    lateral,
  );
  const support: IAutoMovieMotionHumanBalance.ISupport = HumanBalance.support(
    body,
    key,
  );
  const shift: HumanPhysics.SupportOffset = HumanPhysics.supportOffset(
    support,
    HumanFrame.forward(key.yaw),
  );
  if (sine !== 0 && shift !== null && shift !== 0) {
    lean -= (weight * shift) / sine;
    deg = bendLowerPitch(
      body,
      upright,
      target,
      side,
      strategy,
      lean,
      reach,
      wristAt,
      lateral,
    );
  }
  return { strategy, lean, pitch: deg };
}

/*
 * The action clock a lowering key is read on.
 */
export namespace bendLowerSolve {
  /*
   * An actual instant and its action event clock for a static lower-key query.
   */
  export interface IInstant {
    /*
     * Absolute film second at the start of the observed action.
     */
    start: number;
    /*
     * Local action second at which the lowering is read.
     */
    seconds: number;
    /*
     * The actual action duration and its named event shares.
     */
    timing: Parameters<typeof HumanPhysics.prepare>[3];
    /*
     * Resolver of any bound declared on another action or cue.
     */
    instant?: HumanPhysics.Instant;
  }
}

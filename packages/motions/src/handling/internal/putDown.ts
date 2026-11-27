import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanPutDown,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { HumanPropFrame } from "../../perform/internal/HumanPropFrame";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { StrikingRoll } from "../../striking/internal/StrikingRoll";
import { putDownPlan } from "./putDownPlan";
import { putDownRestingDemand } from "./putDownRestingDemand";
import { putDownTarget } from "./putDownTarget";

/*
 * Setting a held prop down at a place and letting go.
 *
 * The goal is the prop's resting frame, not the hand: the author names where
 * the prop's origin goes (and optionally its heading), and the hand is placed
 * wherever holds the prop there, by the rigid hand-to-prop offset the grip has
 * kept since it closed (the prop's displayed frame and the hand's at the start,
 * so whatever the grasp was, the same grasp lays the prop down). With `on`, the
 * prop is put on a bone of the performer's own body instead, at its frame on
 * that bone as the body stands at the start, and is worn there from `placed`
 * (`IHumanActionPlan.wears`). With `onto`, it is set on another prop's socket,
 * its own socket laid on it, and rides that socket from `placed` as the other
 * prop's articulations pose it (`IHumanActionPlan.mounts`): an arrow nocked on
 * a bow's string, drawn back with it. A free placement uses the prop's declared
 * rest rotation turned to the requested heading, or the whole `rotation` the
 * author declares, such as a card laid face up. The arm keeps its entry
 * configuration as its reference while the rest of the body keeps its entry
 * posture.
 *
 * Phases: a transport of the hand to the placing frame, timed by the
 * reach-to-grasp movement time over the travel (`HumanPrehension`), its last
 * 0.05 m straight down so the prop lands rather than slides (provisional
 * setback); the release, the fingers opening flat over 0.2 s (provisional) as
 * the grip ends, which leaves the prop where it was placed; and the hand's
 * return to where the arm hangs, rising the same 0.05 m first, over another
 * movement time.
 *
 * Events: `placed` transfers the prop from the grip to its resting frame.
 * `release` marks the end of finger opening. A placing frame beyond the arm's
 * reach is refused, as is a placement without a destination. A rigid receiver
 * with an authored motion track may translate horizontally at constant speed
 * during a direct placement. The hand arrives with the receiver's velocity,
 * opens while tracking it, and eases away afterward.
 */
export namespace putDown {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "putDown";

  /*
   * May be performed over a carrier, as a seated rider holsters a revolver: it
   * then claims only the working arm and its hand (`HumanCarriedHand`).
   */
  export const overlay: boolean = true;

  /*
   * Cancel table.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: ["release", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    walk: [
      {
        window: ["release", 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /*
   * The final vertical stretch of the placing transport, metres; provisional.
   */
  export const SETBACK: number = 0.05;

  /*
   * Time the fingers take to open at the release, seconds; provisional.
   */
  export const OPEN: number = 0.2;

  /*
   * The turns of a free placement's heading tried, degrees from the prop's
   * heading as it is held: the whole way round in the grasp search's steps of
   * 15 (`HumanGrasp.TURNS`), since a prop laid with no authored heading rests
   * alike at any.
   */
  export const HEADINGS: readonly number[] = Array.from(
    { length: 24 },
    (_: unknown, i: number): number => -165 + 15 * i,
  );

  /*
   * putDownPlan, read through this namespace.
   */
  export const plan: typeof putDownPlan = putDownPlan;

  /*
   * A fixed socket placement asks the earlier grasp to align both sockets; a
   * free placement at an authored resting attitude asks it to lay the prop at
   * that attitude (`putDownRestingDemand`).
   * Parameter ahead: The destination, the predicted stance and the candidate grip.
   * Returns: The resting pose when an attitude is authored, the fixed socket
   * pose when a named source socket is supplied, otherwise none.
   */
  export function demands(
    ahead: IAutoMovieMotionHumanActionLaw.IAhead<IAutoMovieMotionHumanPutDown.IParams>,
  ): readonly IAutoMovieMotionHumanActionLaw.IDemand[] {
    // A free placement at an authored resting attitude asks the grip to lay
    // the prop at it (`putDownRestingDemand`).
    const resting: IAutoMovieMotionHumanActionLaw.IDemand | undefined =
      putDownRestingDemand(ahead);
    if (resting !== undefined) return [resting];
    const via: string | undefined = ahead.params.onto?.via;
    if (
      via === undefined ||
      ahead.grip.prop !== ahead.params.prop ||
      ahead.grip.side !== (ahead.params.hand ?? "right")
    )
      return [];
    // Look-ahead has the pickup's clock. Fit tracked contacts when their placement starts.
    if (putDownTarget.track(ahead, ahead.params.onto!.prop) !== undefined)
      return [];
    const destination: IAutoMovieRigidTransform = putDownTarget(
      ahead,
      (): ReturnType<typeof resolveHumanPosture> =>
        resolveHumanPosture(ahead.body, ahead.grip.posture),
    )!;
    const tool: IAutoMovieMotionHumanStrikingHeld.ITool = ahead.grip.tool({
      tip: via,
    });
    const frame: IAutoMovieRigidTransform = HumanPropFrame.parent(
      destination,
      tool.held!.frame,
    );
    return [
      {
        posture: ahead.grip.posture,
        tool,
        frame: {
          point: frame.position,
          rotation: frame.rotation,
        },
        back: 0,
        bound: StrikingRoll.MISS,
      },
    ];
  }
}

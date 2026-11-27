import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBoard,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import type { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanBoardAdmitData } from "./HumanBoardAdmitData";

/*
 * Admit a boarding: the performer's take-off velocity against the seat (the
 * central difference of its own root against the seat's over a 60th of a
 * second), the level reach, the rise and the drop of its way to the key, all
 * within `BOUNDS`, and the carrier's declared load capacity.
 * Parameter context: The boarding's context.
 * Parameter carrier: The seat contact's moving frame.
 * Parameter from: The entry posture in the seat's frame.
 * Parameter key: The seated key in the seat's frame.
 * On `speed`, `reach`, `rise` or `drop` past its bound,
 * or on `load` past the carrier's capacity.
 */
export function HumanBoardAdmit(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBoard>,
  carrier: HumanMountedFrame.Reader,
  from: IAutoMovieMotionHumanPosture,
  key: IAutoMovieMotionHumanPosture,
): void {
  // The take-off's velocity against the seat, and the way's reach, rise and drop.
  const h: number = 1 / 60;
  const self: (film: number) => IAutoMovieVector3 = (
    film: number,
  ): IAutoMovieVector3 =>
    context.performer(context.subject).root(film).position;
  const relative: (film: number) => IAutoMovieVector3 = (
    film: number,
  ): IAutoMovieVector3 => {
    const frame: IAutoMovieRigidTransform = carrier(film);
    return AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.inverse(frame.rotation),
      AutoMovieEngineVector3.subtract(self(film), frame.position),
    );
  };
  // A performer with no motion of its own before the act has none against the
  // seat: the performance refuses a read of where they are before their first
  // placed act (`participant`), and that refusal alone reads as no slip. Any
  // other error propagates.
  let slip: number = 0;
  try {
    slip = AutoMovieEngineVector3.length(
      AutoMovieEngineVector3.scale(
        AutoMovieEngineVector3.subtract(relative(context.start), relative(context.start - h)),
        1 / h,
      ),
    );
  } catch (error: unknown) {
    if (!(error instanceof AutoMovieMotionHumanRefusal && error.kind === "participant"))
      throw error;
  }
  HumanBoardAdmit.way(slip, from, key);

  // A carrier asked to carry more than it declares is refused.
  if (context.params.load !== undefined) {
    const total: number =
      context.params.load.carried + context.body.measure.mass;
    if (total > context.params.load.capacity)
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "load",
        value: total,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: context.params.load.capacity,
          unit: "kg",
        },
        reason: `boarding brings the carrier's load to ${total.toFixed(1)} kg, beyond its declared ${context.params.load.capacity} kg`,
        fix: "board a carrier that may carry the load, or lighten it",
      });
  }
}

/*
 * The board admission's checks.
 */
export namespace HumanBoardAdmit {
  /*
   * Admit a boarding's way: the take-off's speed against the seat at most 1.5
   * m/s, and the way from the take-off to the seated key at most 2.5 m across,
   * 1.5 m up and 3 m down (`BOUNDS`).
   * Parameter slip: The performer's speed against the seat at the take-off, m/s.
   * Parameter from: The take-off posture.
   * Parameter key: The seated key posture.
   * When any of them exceeds its bound.
   */
  export function way(
    slip: number,
    from: Pick<IAutoMovieMotionHumanPosture, "root">,
    key: Pick<IAutoMovieMotionHumanPosture, "root">,
  ): void {
    const way: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(key.root, from.root);
    const checks: readonly [string, number, number][] = [
      ["speed", slip, HumanBoardAdmitData.BOUNDS.speed],
      ["reach", Math.hypot(way.x, way.z), HumanBoardAdmitData.BOUNDS.reach],
      ["rise", way.y, HumanBoardAdmitData.BOUNDS.rise],
      ["drop", -way.y, HumanBoardAdmitData.BOUNDS.drop],
    ];
    for (const [axis, value, most] of checks)
      if (value > most)
        throw new AutoMovieMotionHumanRefusal({
          kind: "reach",
          axis,
          value,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: most,
            unit: axis === "speed" ? "m/s" : "m",
          },
          reason: `boarding the seat asks a ${axis} of ${value.toFixed(3)}, beyond ${most}`,
          fix: "run level with the seat and take off from within reach of it",
        });
  }
}

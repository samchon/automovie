import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBoard,
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import type { HumanMountedFrame } from "./HumanMountedFrame";

/*
 * Bounds of an admitted boarding, in the seat's moving frame (provisional): the
 * most the performer moves relative to the seat at the take-off, metres per
 * second; the farthest level way; the most it rises and drops.
 */
const BOUNDS: Readonly<Record<BOUNDSEntryItem, number>> = {
  speed: 1.5,
  reach: 2.5,
  rise: 1.5,
  drop: 3,
};

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
    return Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      Vector3.subtract(self(film), frame.position),
    );
  };
  // A performer with no motion of its own before the act has none against the
  // seat: the performance refuses a read of where they are before their first
  // placed act (`participant`), and that refusal alone reads as no slip. Any
  // other error propagates.
  let slip: number = 0;
  try {
    slip = Vector3.length(
      Vector3.scale(
        Vector3.subtract(relative(context.start), relative(context.start - h)),
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
    const way: IAutoMovieVector3 = Vector3.subtract(key.root, from.root);
    const checks: readonly [string, number, number][] = [
      ["speed", slip, BOUNDS.speed],
      ["reach", Math.hypot(way.x, way.z), BOUNDS.reach],
      ["rise", way.y, BOUNDS.rise],
      ["drop", -way.y, BOUNDS.drop],
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

/*
 * The alternatives of `BOUNDSEntryItem`'s site.
 */
type BOUNDSEntryItem = "speed" | "reach" | "rise" | "drop";

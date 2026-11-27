import { AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * A shared walk of a coupled pair: both feet of each performer step one
 * displacement over a window, alternating, the root carried on its own profile
 * by the law that uses it (`hostageHold`, `heldHostage`).
 */
export namespace PairWalk {
  /*
   * One foot's step over the walk: which foot, when, from where to where.
   */
  export interface IStep {
    /*
     * The stepping foot.
     */
    side: AutoMovieHumanSide;
    /*
     * When it lifts, seconds since the action's start.
     */
    from: number;
    /*
     * When it lands, seconds since the action's start.
     */
    to: number;
    /*
     * Where it lifts from, world metres.
     */
    start: IAutoMovieVector3;
    /*
     * Where it lands, world metres.
     */
    end: IAutoMovieVector3;
  }

  /*
   * The longest step, metres: a short backward step (authored).
   */
  export const STEP: number = 0.3;

  /*
   * How high a stepping foot lifts, metres: authored.
   */
  export const LIFT: number = 0.04;

  /*
   * The steps that carry both feet a displacement over a window, the feet
   * alternating, the last step closing the trailing foot.
   * Parameter entry: The entry state, its feet.
   * Parameter travel: The displacement, world metres.
   * Parameter from: The window's start, seconds.
   * Parameter to: The window's end, seconds.
   * Returns: The steps in order.
   */
  export function steps(
    entry: Pick<IAutoMovieMotionHumanEntryState, "feet">,
    travel: IAutoMovieVector3,
    from: number,
    to: number,
  ): IStep[] {
    const length: number = AutoMovieEngineVector3.length(travel);
    if (!(length > 1e-6)) return [];
    const count: number = Math.max(1, Math.ceil(length / STEP));
    const span: number = (to - from) / (count + 1);
    const at: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: entry.feet.left.ankle,
      right: entry.feet.right.ankle,
    };
    const out: IStep[] = [];
    for (let j: number = 0; j <= count; ++j) {
      const side: AutoMovieHumanSide = j % 2 === 0 ? "left" : "right";
      const end: IAutoMovieVector3 = AutoMovieEngineVector3.add(
        side === "left" ? entry.feet.left.ankle : entry.feet.right.ankle,
        AutoMovieEngineVector3.scale(travel, Math.min(1, (j + 1) / count)),
      );
      out.push({
        side,
        from: from + j * span,
        to: from + (j + 1) * span,
        start: at[side],
        end,
      });
      at[side] = end;
    }
    return out;
  }

  /*
   * The feet's goals at a second.
   * Parameter entry: The entry state.
   * Parameter steps: The walk's steps.
   * Parameter seconds: Seconds since the action's start.
   * Parameter knee: The knee's hint from an ankle.
   * Returns: The two leg goals.
   */
  export function legs(
    entry: Pick<IAutoMovieMotionHumanEntryState, "feet">,
    steps: readonly IStep[],
    seconds: number,
    knee: (ankle: IAutoMovieVector3) => IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture["limbs"] {
    const out: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const side of ["left", "right"] as const) {
      let point: IAutoMovieVector3 = entry.feet[side].ankle;
      let planted: boolean = true;
      for (const s of steps)
        if (s.side === side) {
          if (seconds >= s.to) point = s.end;
          else if (seconds > s.from) {
            const u: number = AutoMovieEngineMotionSampling.minimumJerkShare(
              (seconds - s.from) / (s.to - s.from),
            );
            point = AutoMovieEngineVector3.add(AutoMovieEngineVector3.lerp(s.start, s.end, u), {
              x: 0,
              y: Math.sin(Math.PI * u) * LIFT,
              z: 0,
            });
            planted = false;
          }
        }
      out[`${side}Leg`] = {
        point,
        rotation: entry.feet[side].rotation,
        bend: knee(point),
        planted,
      } satisfies IAutoMovieHumanLimbGoal;
    }
    return out;
  }

  /*
   * Each foot's plant windows outside its steps, as shares of a duration.
   * Parameter steps: The walk's steps.
   * Parameter duration: The action's duration, seconds.
   * Returns: The contact windows.
   */
  export function plants(
    steps: readonly IStep[],
    duration: number,
  ): IAutoMovieMotionHumanContactWindow[] {
    const out: IAutoMovieMotionHumanContactWindow[] = [];
    for (const side of ["left", "right"] as const) {
      let from: number = 0;
      for (const s of steps)
        if (s.side === side) {
          if (s.from > from)
            out.push({
              part: `${side}Foot`,
              kind: "plant",
              from: from / duration,
              to: s.from / duration,
              support: { kind: "ground" },
            });
          from = s.to;
        }
      out.push({
        part: `${side}Foot`,
        kind: "plant",
        from: from / duration,
        to: 1,
        support: { kind: "ground" },
      });
    }
    return out;
  }
}

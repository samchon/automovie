import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanWalkPace,
  IAutoMovieVector3,
} from "@automovie/interface";

import { WalkPace } from "./WalkPace";
import type { walkStepFoot } from "./walkStepFoot";

/**
 * A gait entered in stride: one entry foot standing and the other in the air (a
 * hurdler's trail leg over the bar, the lead foot landed). The foot in the air
 * bears nothing, so it steps first, its swing leaving from where it is with the
 * velocity it entered with, and it lands one period after the standing foot's
 * stance began, as the next footfall of a gait in progress does; it stands on
 * no opening stance. How long the standing foot has stood is read from where
 * the pelvis is over it: a cruising footprint lies `front` periods of stride
 * ahead of the pelvis at its heel strike, and the pelvis has since closed on it
 * at the entry's speed. A stance met at rest has stood none, and none stands
 * longer than a cruising stance or a period, by which the foot in the air would
 * have landed.
 */
export namespace walkStride {
  /** What `airborne` reads of an entry: whether each foot is planted. */
  export interface IFeet {
    /** The entry's feet. */
    feet: Record<
      AutoMovieHumanSide,
      Pick<IAutoMovieMotionHumanEntryState.IFoot, "planted">
    >;
  }

  /**
   * The foot in the air of an entry in stride.
   *
   * @param entry Whether each entry foot is planted.
   * @returns The side, or undefined when both feet stand or neither does.
   */
  export function airborne(entry: IFeet): AutoMovieHumanSide | undefined {
    return entry.feet.left.planted === entry.feet.right.planted
      ? undefined
      : entry.feet.left.planted
        ? "right"
        : "left";
  }

  /**
   * The gait's timing, in stride where a foot is in the air.
   *
   * @param props The pace's inputs, without the stood time.
   * @param longest The longest step, metres.
   * @param entry The entry state.
   * @param way The way's opening direction, a horizontal unit vector, or
   *   undefined for no way.
   * @returns The timing.
   */
  export function pace(
    props: IAutoMovieMotionHumanWalkPace.IProps,
    longest: number,
    entry: IAutoMovieMotionHumanEntryState,
    way: IAutoMovieVector3 | undefined,
  ): WalkPace {
    const flying: AutoMovieHumanSide | undefined = airborne(entry);
    if (flying === undefined) return WalkPace.fit(props, longest);
    const opening: WalkPace = WalkPace.fit({ ...props, stride: 0 }, longest);
    const speed: number = props.entrySpeed ?? 0;
    if (!(speed > 0) || way === undefined) return opening;
    const standing: IAutoMovieVector3 =
      entry.feet[flying === "left" ? "right" : "left"].ankle;
    const ahead: number =
      (standing.x - entry.posture.root.x) * way.x +
      (standing.z - entry.posture.root.z) * way.z;
    const T: number = opening.period;
    const stood: number = Math.min(
      2 * T - opening.swing,
      T,
      Math.max(0, (opening.front * opening.stride - ahead) / speed),
    );
    return WalkPace.fit({ ...props, stride: stood }, longest);
  }

  /**
   * The foot in the air as it entered, for its first swing.
   *
   * @param entry The entry state.
   * @param side The foot.
   * @returns Its placement, toes and velocity, or undefined for a standing
   *   foot.
   */
  export function flying(
    entry: IAutoMovieMotionHumanEntryState,
    side: AutoMovieHumanSide,
  ): walkStepFoot.IAirborne | undefined {
    return side !== airborne(entry)
      ? undefined
      : {
          foot: {
            placement: {
              ankle: { ...entry.feet[side].ankle },
              rotation: { ...entry.feet[side].rotation },
            },
            toes: entry.posture.joints[`${side}Toes`]?.[0] ?? 0,
          },
          velocity: { ...entry.feet[side].velocity },
        };
  }
}

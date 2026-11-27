import type {
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanLeanInto,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRise,
  IAutoMovieMotionHumanTouchStance,
} from "@automovie/interface";

import { lowerHumanPosture } from "../posture/internal/lowerHumanPosture";
import type { prepareHumanPoseResolution } from "../posture/internal/prepareHumanPoseResolution";
import type { AutoMovieMotionHumanTouchStanceMoves } from "./AutoMovieMotionHumanTouchStanceMoves";

/**
 * The primitives of a solved touch stance
 * (`IAutoMovieMotionHumanTouchStance.IStance.primitives`): the girdle, the
 * heels, the turn and the lean written over the stroke's envelope, with an
 * optional correction, read from the stance's solved angles, lean and posture
 * moves.
 *
 * @param scope What the stance solved.
 * @returns The stance's primitives on a clock.
 */
export function AutoMovieMotionHumanTouchStancePrimitives(
  scope: AutoMovieMotionHumanTouchStancePrimitives.IScope,
): IAutoMovieMotionHumanTouchStance.IStance["primitives"] {
  const {
    props,
    body,
    feet,
    girdle,
    raise,
    turn,
    leaning,
    lean,
    arrival,
    moved,
    twisted,
    planted,
  }: AutoMovieMotionHumanTouchStancePrimitives.IScope = scope;
  return (
    clock: IAutoMovieMotionClock,
    correction?: IAutoMovieMotionHumanTouchStance.ICorrection,
  ): IAutoMovieMotionHumanPrimitive[] => {
    if (
      props.girdles === undefined &&
      girdle === 0 &&
      raise === 0 &&
      turn === 0 &&
      props.fixed !== true &&
      correction === undefined
    )
      return leaning ? [lean.primitive(clock)] : [];
    if (
      props.girdles === undefined &&
      girdle === 0 &&
      raise === 0 &&
      turn === 0 &&
      !leaning
    )
      return correction === undefined
        ? []
        : [
            {
              channels: [correction.channel],
              from: 0,
              to: clock.duration,
              write: correction.write,
            },
          ];
    const share: (seconds: number) => number = (seconds: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], seconds);
    const channels: AutoMovieMotionHumanChannel[] =
      raise > 0
        ? ["root", "trunk", "leftLeg", "rightLeg"]
        : leaning
          ? ["root", "trunk"]
          : ["trunk"];
    if (correction !== undefined && !channels.includes(correction.channel))
      channels.push(correction.channel);
    return [
      {
        channels,
        from: 0,
        to: clock.duration,
        write: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
          _before?: IAutoMovieMotionHumanPrimitive.Reader,
          resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
          projection?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[4],
        ): IAutoMovieMotionHumanPosture => {
          const k: number = share(seconds);
          const degrees: number = raise * (props.heels?.(clock, seconds) ?? k);
          const ankles: IAutoMovieMotionHumanRise.Stance | undefined =
            degrees === 0 ? undefined : (props.placements?.(posture) ?? feet);
          const up: IAutoMovieMotionHumanPosture = twisted(
            moved(posture, girdle * k, degrees, ankles, k),
            turn * k,
          );

          // The lean is read at the full rise, so its angle does not
          // change with the share of the rise shown.
          const leaned: IAutoMovieMotionHumanPosture = leaning
            ? lean.tip(
                up,
                k *
                  (props.fixed === true
                    ? arrival
                    : lean.pitch(
                        twisted(moved(posture, girdle, raise, ankles), turn),
                        clock.progress("strokeStart", "strokeEnd", seconds),
                        resolution,
                      )),
              )
            : up;
          const settled: IAutoMovieMotionHumanPosture =
            ankles !== undefined
              ? planted(leaned, ankles, degrees, resolution)
              : leaning
                ? {
                    ...leaned,
                    root: lowerHumanPosture(body, leaned, undefined, resolution)
                      .root,
                  }
                : leaned;
          return correction === undefined
            ? settled
            : correction.write(
                settled,
                seconds,
                _before,
                resolution,
                projection,
              );
        },
      },
    ];
  };
}

/** What the primitives of a solved touch stance read. */
export namespace AutoMovieMotionHumanTouchStancePrimitives {
  /** What a solved touch stance writes its primitives from. */
  export interface IScope {
    /** The stance's props. */
    props: IAutoMovieMotionHumanTouchStance.IProps;

    /** The body. */
    body: IAutoMovieMotionHumanTouchStance.IProps["body"];

    /** The feet the heels rise on; none when absent. */
    feet: IAutoMovieMotionHumanRise.Stance | undefined;

    /** The girdle's lift, degrees. */
    girdle: number;

    /** The heels' rise, degrees. */
    raise: number;

    /** The trunk's turn, degrees. */
    turn: number;

    /** Whether the stance leans. */
    leaning: boolean;

    /** The lean on the turned trunk. */
    lean: IAutoMovieMotionHumanLeanInto.ILean;

    /** The lean's pitch at the stroke's start. */
    arrival: number;

    /** The girdle and heel move (`AutoMovieMotionHumanTouchStanceMoves`). */
    moved: AutoMovieMotionHumanTouchStanceMoves.IMoves["moved"];

    /** The trunk's turn (`AutoMovieMotionHumanTouchStanceMoves`). */
    twisted: AutoMovieMotionHumanTouchStanceMoves.IMoves["twisted"];

    /** The raised feet's fit (`AutoMovieMotionHumanTouchStanceMoves`). */
    planted: AutoMovieMotionHumanTouchStanceMoves.IMoves["planted"];
  }
}

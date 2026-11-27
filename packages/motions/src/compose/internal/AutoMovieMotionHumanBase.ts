import type {
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";

/**
 * Bases of composed actions: the plan whose posture every unclaimed channel
 * keeps.
 *
 * Most actions happen on a body that otherwise stays as it is (a stance, a
 * seat, the posture the action was entered in), so their base is one posture
 * held for the action's duration with the supports it stands on. A held base
 * borrows its posture and returns that exact object on every read, including
 * later caller edits. An explicit constructor that owns copied coefficients is
 * separate from this public borrowing contract.
 */
export namespace AutoMovieMotionHumanBase {
  /**
   * A base that holds one posture.
   *
   * @param duration Seconds; the composed action's clock lasts as long.
   * @param posture The borrowed posture; every read returns this exact object
   *   and observes later edits.
   * @param contacts The supports it stands on, shares of the duration.
   * @returns The plan.
   */
  export function still(
    duration: number,
    posture: IAutoMovieMotionHumanPosture,
    contacts: readonly IAutoMovieMotionHumanContactWindow[] = [],
  ): IAutoMovieMotionHumanActionPlan {
    return {
      duration,
      events: [],
      contacts: [...contacts],

      // One posture throughout: still over the whole plan.
      still: [0, duration],
      posture: (): IAutoMovieMotionHumanPosture => posture,
    };
  }

  /**
   * The base of an action that may be performed over another: the carrier's
   * posture, instant by instant, when the action is an overlay, and otherwise
   * the posture it was entered in, held on the supports given.
   *
   * @param context The action's context.
   * @param duration Seconds; the composed action's clock lasts as long.
   * @param contacts The supports a held base stands on, shares of the duration;
   *   when absent, the supports the body rests on at the entry, held
   *   throughout. A carrier declares its own.
   * @returns The plan.
   */
  export function under(
    context: Pick<IAutoMovieMotionHumanActionContext, "carrier"> & {
      entry: Pick<IAutoMovieMotionHumanEntryState, "posture" | "supports">;
    },
    duration: number,
    contacts?: readonly IAutoMovieMotionHumanContactWindow[],
  ): IAutoMovieMotionHumanActionPlan {
    const carrier: IAutoMovieMotionHumanActionContext.ICarrier | undefined =
      context.carrier;
    if (carrier === undefined)
      return still(
        duration,
        context.entry.posture,
        contacts ??
          context.entry.supports.map(
            (s): IAutoMovieMotionHumanContactWindow => ({
              ...s,
              from: 0,
              to: 1,
            }),
          ),
      );
    return {
      duration,
      events: [],
      contacts: [],
      posture: (
        seconds: number,
        channels?: readonly AutoMovieMotionHumanChannel[],
        resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture =>
        carrier.posture(seconds, channels, resolution, projection),
    };
  }

  /**
   * Both feet planted on the ground for a share of an action.
   *
   * @param from Share of the duration the plants start at.
   * @param to Share of the duration the plants end at.
   * @returns The left foot's window, then the right foot's.
   */
  export function plants(
    from: number = 0,
    to: number = 1,
  ): IAutoMovieMotionHumanContactWindow[] {
    return (["leftFoot", "rightFoot"] as const).map(
      (part: PlantsPart): IAutoMovieMotionHumanContactWindow => ({
        part,
        kind: "plant",
        from,
        to,
        support: { kind: "ground" },
      }),
    );
  }
}

/** The alternatives of `PlantsPart`'s site. */
type PlantsPart = "leftFoot" | "rightFoot";

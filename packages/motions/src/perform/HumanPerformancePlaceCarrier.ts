import type {
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import type { prepareHumanPoseResolution } from "../posture/internal/prepareHumanPoseResolution";

/** The record of `IPlaceDraftedResult`'s site. */
type IPlaceDraftedResult = {
  support?: IAutoMovieMotionHumanContactWindow.Support;
};

/**
 * The carrier an overlay rides (`HumanPerformancePlace.place`): the action that
 * carries the body at the overlay's start, its posture read at the carrier's
 * own second for an overlay second, and the prop it plants on, the support the
 * overlay rides.
 *
 * @param previous The carrying action.
 * @param start The overlay's film start, seconds.
 * @returns The overlay's carrier.
 */
export function HumanPerformancePlaceCarrier(
  previous: HumanPerformancePlaceCarrier.IPrevious,
  start: number,
): NonNullable<IAutoMovieMotionHumanActionContext<never>["carrier"]> {
  return {
    name: previous.name,
    posture: (
      seconds: number,
      channels?: readonly AutoMovieMotionHumanChannel[],
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      // Query-scoped prefix sharing belongs to the composer.
      // A retained carrier callback must read current stop/plan
      // state and the exact caller's demand and metadata loans.
      const at: number = Math.min(
        previous.plan.duration,
        Math.max(0, start + seconds - previous.start),
      );
      return previous.plan.posture(at, channels, resolution, projection);
    },
    // The prop the carrier plants on, the support the overlay rides.
    ...((): IPlaceDraftedResult => {
      const plant: IAutoMovieMotionHumanContactWindow | undefined =
        previous.plan.contacts.find(
          (c: IAutoMovieMotionHumanContactWindow): boolean =>
            c.kind === "plant" && c.support.kind !== "ground",
        );
      return plant === undefined ? {} : { support: plant.support };
    })(),
  };
}

/** Companion types of {@link HumanPerformancePlaceCarrier}. */
export namespace HumanPerformancePlaceCarrier {
  /**
   * What the carrier reads of the carrying action: its name, its start, and its
   * plan's duration, posture and contacts.
   */
  export type IPrevious = Pick<
    IAutoMovieMotionHumanSegment,
    "name" | "start"
  > & {
    /** The plan's duration, posture and contacts. */
    plan: Pick<
      IAutoMovieMotionHumanActionPlan,
      "duration" | "posture" | "contacts"
    >;
  };
}

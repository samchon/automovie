import type { IAutoMovieMotionPropLaunch } from "@automovie/interface";

const INCOMING: unique symbol = Symbol("prop handback predecessor");

type TaggedLaunch = IAutoMovieMotionPropLaunch & {
  [INCOMING]?: IAutoMovieMotionPropLaunch;
};

/*
 * An opt-in publication identity used by final flight admission. This symbol
 * is carried by ordinary launch spreads in the planner and stays out of JSON
 * and string-keyed public observations.
 */
export namespace HumanPropHandback {
  export function tag(
    launch: IAutoMovieMotionPropLaunch,
    predecessor: IAutoMovieMotionPropLaunch,
  ): IAutoMovieMotionPropLaunch {
    const tagged: TaggedLaunch = { ...launch, [INCOMING]: predecessor };
    return tagged;
  }

  export function predecessor(
    launch: IAutoMovieMotionPropLaunch,
  ): IAutoMovieMotionPropLaunch | undefined {
    return (launch as TaggedLaunch)[INCOMING];
  }
}

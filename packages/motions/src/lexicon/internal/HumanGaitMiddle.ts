import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Where the feet stand at the entry: their ankles' midpoint on the floor, world
 * metres.
 */
export function HumanGaitMiddle(
  context: IAutoMovieMotionHumanActionContext<object>,
): IAutoMovieVector3 {
  const feet: IAutoMovieMotionHumanActionContext["entry"]["feet"] =
    context.entry.feet;
  return {
    x: (feet.left.ankle.x + feet.right.ankle.x) / 2,
    y: 0,
    z: (feet.left.ankle.z + feet.right.ankle.z) / 2,
  };
}

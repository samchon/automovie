import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

/**
 * Read displayed placement and material at one film second. An externally
 * posed model supplies the whole local payload, including any absent geometry.
 * Otherwise use the driven articulation when there is one, or declared rest.
 *
 * @param prop The placed prop.
 * @param seconds Film seconds.
 * @param frame The action's displayed prop reader, including its carrier view.
 * @param driven The pose from the performance's published articulation state,
 *   or undefined if nothing drives it.
 * @returns The displayed frame and the prop-local material.
 */
export function HumanPerformancePropSnapshot(
  prop: IAutoMovieMotionHumanProp,
  seconds: number,
  frame: (seconds: number) => IAutoMovieRigidTransform,
  driven: (seconds: number) => IAutoMovieMotionHumanProp.IPosed | undefined,
): IAutoMovieMotionHumanPropReader.ISnapshot {
  return {
    frame: frame(seconds),
    posed: prop.poseAt?.(seconds) ?? driven(seconds) ?? {
        affordances: prop.affordances ?? [],
        ...(prop.shapes === undefined ? {} : { shapes: prop.shapes }),
      },
  };
}

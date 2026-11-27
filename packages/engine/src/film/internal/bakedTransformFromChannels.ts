import {
  type IAutoMovieSampledChannel,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Assemble a node's baked world frame from one already sampled object-channel
 * map.
 *
 * Translation and rotation must both have started; otherwise null leaves
 * placement authority with the caller. Admitted complete channel values are a
 * premise. Components are copied into new records, except the borrowed
 * read-only unit scale when no scale track writes. This helper does not choose
 * authority or sample time.
 */
export function bakedTransformFromChannels(
  sampled: ReadonlyMap<string, IAutoMovieSampledChannel>,
  node: string,
): IAutoMovieTransform | null {
  const translation: number[] | undefined = sampled.get(
    `node:${node}:translation`,
  )?.value;
  const rotation: number[] | undefined = sampled.get(
    `node:${node}:rotation`,
  )?.value;
  if (translation === undefined || rotation === undefined) return null;
  const scale: number[] | undefined = sampled.get(`node:${node}:scale`)?.value;
  return {
    translation: { x: translation[0]!, y: translation[1]!, z: translation[2]! },
    rotation: {
      x: rotation[0]!,
      y: rotation[1]!,
      z: rotation[2]!,
      w: rotation[3]!,
    },
    scale:
      scale === undefined
        ? UNIT_SCALE
        : { x: scale[0]!, y: scale[1]!, z: scale[2]! },
  };
}

/** Read-only fallback when the object authority writes no scale channel. */
const UNIT_SCALE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

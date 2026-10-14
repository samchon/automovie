import { IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieSampledChannel } from "../resolve/IAutoMovieSampledChannel";

/** Read-only fallback when the object authority writes no scale channel. */
const UNIT_SCALE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

/**
 * Assemble a node's baked world frame from one already sampled object-channel map.
 *
 * Translation and rotation must both have started; otherwise null leaves placement
 * authority with the caller. Admitted complete channel values are a premise.
 * Components are copied into new records, except the borrowed read-only unit scale
 * when no scale track writes. This helper does not choose authority or sample time.
 *
 * @evidence contracts/common.md#principled-implementation Reads the sampler's canonical node/path keys and constructs a world TRS only when both required channels exist; optional scale follows the same selected authority, with unit scale matching attach and launch's scale-free clips.
 * @evidence contracts/common.md#clear-and-simple-design Separates map-to-frame assembly from sampleClipSequence so bakedTransformFromClipsAt and resolveBeatSnapshot share the same null and scale semantics while the snapshot samples each exact instant once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No producer id or node has special authority; absent required channels remain absent and no staged scale is guessed from unrelated scene state.
 * @evidence contracts/common.md#meaningful-documentation States the already-sampled map premise, required channels, caller-owned missing-frame fallback, scalar copies and borrowed unit-scale ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Three map reads and a fixed-size TRS assembly take constant work, apart from key construction proportional to node-id length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Consumes the caller's current map without sampling or retaining it; the snapshot owns sharing of maps across nodes at one instant.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh frame and component records; the module retains only one fixed unit-scale record that consumers must not mutate.
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

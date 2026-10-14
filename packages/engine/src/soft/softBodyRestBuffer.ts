import {
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftNamedState,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Allocate the authored rest coordinates with static anchors and one named state's targets applied.
 *
 * @evidence contracts/common.md#principled-implementation Named anchor poses override explicit anchor positions, which override the particle's authored rest triple. A missing named state throws; validated domains provide in-range particle indices and dense coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Validation's plain rest-configuration result and both simulation wrappers use one target-resolution owner, while only the simulation mutates the returned typed buffer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An ungated out-of-range typed-array write is not promoted into an invented particle; this function does not replace domain admission or moving-boundary resolution.
 * @evidence contracts/common.md#meaningful-documentation States target precedence, named-state refusal and the typed buffer's ownership.
 * @evidence contracts/performance.md#efficient-algorithms For P coordinates, A anchors, S states and T selected-state poses, copying and application cost O(P+A+S+T), with O(P+T) temporary/result storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Named targets are indexed once per call and reused across anchors; mutable domains and selected states are not treated as cross-call equivalents.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The pose map is local, target references are read only, and the fresh Float64Array transfers to its consumer without retaining the domain.
 */
export const softBodyRestBuffer: (
  domain: IAutoMovieSoftBodyDomain,
  state: string | null,
) => Float64Array<ArrayBufferLike> = (
  domain: IAutoMovieSoftBodyDomain,
  state: string | null,
): Float64Array => {
  const position: Float64Array<ArrayBuffer> = Float64Array.from(domain.rest);
  const poses: Map<string, IAutoMovieVector3> = resolveState(domain, state);
  for (const anchor of domain.anchors) {
    const moved: IAutoMovieVector3 | undefined = poses.get(anchor.id);
    const target: IAutoMovieVector3 = moved ??
      anchor.position ?? {
        x: domain.rest[anchor.particle * 3],
        y: domain.rest[anchor.particle * 3 + 1],
        z: domain.rest[anchor.particle * 3 + 2],
      };
    position[anchor.particle * 3] = target.x;
    position[anchor.particle * 3 + 1] = target.y;
    position[anchor.particle * 3 + 2] = target.z;
  }
  return position;
};

/** Index one declared state's target references; the caller owns and discards the map. */
const resolveState: (
  domain: IAutoMovieSoftBodyDomain,
  state: string | null,
) => Map<string, IAutoMovieVector3> = (
  domain: IAutoMovieSoftBodyDomain,
  state: string | null,
): Map<string, IAutoMovieVector3> => {
  const poses: Map<string, IAutoMovieVector3> = new Map<
    string,
    IAutoMovieVector3
  >();
  if (state === null) return poses;
  const named: IAutoMovieSoftNamedState | undefined = domain.states.find(
    (candidate: IAutoMovieSoftNamedState): boolean => candidate.id === state,
  );
  if (named === undefined)
    throw new Error(
      `soft body "${domain.id}" does not declare a named state "${state}"`,
    );
  for (const pose of named.anchors) poses.set(pose.anchor, pose.position);
  return poses;
};

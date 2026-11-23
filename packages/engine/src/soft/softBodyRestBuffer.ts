import {
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftNamedState,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Allocate the authored rest coordinates with static anchors and one named
 * state's targets applied.
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

/**
 * Index one declared state's target references; the caller owns and discards
 * the map.
 */
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

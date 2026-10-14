import { IAutoMovieClip } from "@automovie/interface";

import { yQuat } from "./yQuat";

/** A one-key clip turning `node` by `deg` about +Y. */
export function swingClip(
  id: string,
  node: string,
  deg: number,
  overrides: Partial<IAutoMovieClip["tracks"][number]> = {},
): IAutoMovieClip {
  return {
    id,
    name: null,
    duration: 2,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node, path: "rotation" },
        times: [0],
        values: yQuat(deg),
        interpolation: "linear",
        ...overrides,
      },
    ],
  };
}

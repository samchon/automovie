import {
  type IAutoMovieSweepSpine,
  type IAutoMovieSweepTransport,
  IAutoMovieVector3,
} from "@automovie/interface";

import { transportAutoMovieSweepSpine } from "./transportAutoMovieSweepSpine";

/*
 * Compile a spine record into a transport: size it, write its points, starting
 * direction and end tangents, and update it.
 * Parameter spine: The spine, only read.
 * Parameter frames: Whether the transport builds its frame table.
 * Returns: The updated transport.
 * Error when an end tangent is not finite or is zero, and whatever
 * `transportAutoMovieSweepSpine` and its `update` refuse.
 */
export const loadAutoMovieSweepSpine: (
  spine: IAutoMovieSweepSpine,
  frames: boolean,
) => IAutoMovieSweepTransport = (
  spine: IAutoMovieSweepSpine,
  frames: boolean,
): IAutoMovieSweepTransport => {
  const transport: IAutoMovieSweepTransport = transportAutoMovieSweepSpine(
    spine.points.length,
    frames,
  );
  spine.points.forEach((p: IAutoMovieVector3, k: number): void => {
    transport.points[3 * k] = p.x;
    transport.points[3 * k + 1] = p.y;
    transport.points[3 * k + 2] = p.z;
  });
  const write = (
    target: Float64Array,
    v: IAutoMovieVector3 | undefined,
    what: string,
  ): void => {
    if (v === undefined) return;
    if (Math.hypot(v.x, v.y, v.z) === 0)
      throw new Error(
        `sweep spine ${what} tangent must be finite and not zero`,
      );
    target[0] = v.x;
    target[1] = v.y;
    target[2] = v.z;
  };
  transport.normal[0] = spine.normal.x;
  transport.normal[1] = spine.normal.y;
  transport.normal[2] = spine.normal.z;
  write(transport.start, spine.tangents?.start, "start");
  write(transport.end, spine.tangents?.end, "end");
  transport.update();
  return transport;
};

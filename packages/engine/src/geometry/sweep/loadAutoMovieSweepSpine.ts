import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieSweepSpine } from "./IAutoMovieSweepSpine";
import { IAutoMovieSweepTransport } from "./IAutoMovieSweepTransport";
import { transportAutoMovieSweepSpine } from "./transportAutoMovieSweepSpine";

/**
 * Compile a spine record into a transport: size it, write its points,
 * starting direction and end tangents, and update it.
 *
 * @param spine The spine, only read.
 * @param frames Whether the transport builds its frame table.
 * @returns The updated transport.
 * @throws Error when an end tangent is not finite or is zero, and whatever `transportAutoMovieSweepSpine` and its `update` refuse.
 *
 * @evidence contracts/common.md#principled-implementation The record-to-buffer step every spine consumer needs, kept in one place.
 * @evidence contracts/common.md#clear-and-simple-design Writes the arrays the transport exposes and calls its one recompile.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A zero end tangent is refused here, because in the transport's arrays zero means none.
 * @evidence contracts/common.md#meaningful-documentation States what is written and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms O(n) writes plus one `update`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per compiled spine; the transport is the reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the transport is transferred to the caller.
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
    if (
      ![v.x, v.y, v.z].every(Number.isFinite) ||
      Math.hypot(v.x, v.y, v.z) === 0
    )
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

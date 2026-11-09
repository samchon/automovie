import type { IAutoMovieSchedule } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { BodyFrame } from "../../laws/body/BodyFrame";
import type { IBodyState } from "../../laws/body/IBodyState";
import type { IStageWorld } from "./IStageWorld";
import { PropTrack } from "./PropTrack";

/**
 * Where a prop is at a second during resolution, read from the previous
 * resolution pass's prop track: resting, falling, gliding or flying at its
 * track's point, or held at its holder's hand (the hand's reached point, or
 * in front of the holder's chest). The stage context uses it so a scene can
 * bend toward or pick up a note that was dropped earlier in the film.
 *
 * ```ts
 * PropPoint.at(world, previous, "note", 35.2, (id, t) => context.body(id, t));
 * ```
 *
 * @evidence docs/research/everyday/handover.md#dropped A dropped sheet lands near below the release and lies still.
 * @evidence contracts/development/behaviors.md#relational-goals Targets resolve from the prop's own track, not from scene coordinates.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation A pure function of the previous pass.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One prop track per previous pass, cached by the schedule's identity.
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and the held case.
 */
export namespace PropPoint {
  const tracks: WeakMap<IAutoMovieSchedule, PropTrack> = new WeakMap();

  /**
   * A prop's point at a second, or undefined when the previous pass does not place it.
   *
   * @param world The world.
   * @param previous The previous resolution pass.
   * @param prop The prop's id.
   * @param seconds Film seconds.
   * @param body A student's state at a second.
   * @returns World metres.
   */
  export function at(
    world: IStageWorld,
    previous: IAutoMovieSchedule,
    prop: string,
    seconds: number,
    body: (subject: string, at: number) => IBodyState,
  ): IAutoMovieVector3 | undefined {
    let track: PropTrack | undefined = tracks.get(previous);
    if (!track) {
      track = PropTrack.resolve(world, previous);
      tracks.set(previous, track);
    }
    const segment: PropTrack.ISegment | undefined = track.at(prop, seconds);
    if (!segment) return undefined;
    if (segment.kind !== "held") return PropTrack.point(segment, seconds);
    const holder: IBodyState = body(segment.subject, seconds);
    return holder.hands[segment.hand].point ?? BodyFrame.toWorld(holder.position, holder.heading, { forward: 0.3, left: segment.hand === "left" ? 0.1 : -0.1, up: 1.05 });
  }
}

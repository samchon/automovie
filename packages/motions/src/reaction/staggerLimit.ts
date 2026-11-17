import type { IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanFoot, IAutoMovieVector3 } from "@automovie/interface";

import { StrikingTarget } from "../striking/StrikingTarget";
import { staggerBounds } from "./staggerBounds";
import { staggerRecover } from "./staggerRecover";

/**
 * The fastest push a body catches in a stagger's recovery steps
 * (`staggerRecover`), the limit a refused push names (`stagger`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and who reads it.
 * @evidence contracts/development/design.md#principled-representation One function and its memory of each body's limits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by `stagger`'s refusal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The limit is the whole model's, read by the recovery itself.
 */
export namespace staggerLimit {
  /**
   * The fastest push along a direction a body catches in `STEPS` recovery
   * steps, to `RESOLUTION` and then floored to a whole centimetre per second,
   * with every speed of that grid over `VERIFIED` below it caught too.
   *
   * The pendulum alone, its steps unchecked against the legs' ranges,
   * catches at least what the whole model catches, so its fastest caught
   * speed bounds the limit from above; the whole model is then bisected
   * between none and that bound. A bound the whole model catches is the
   * limit at once.
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param push The push's horizontal unit direction, world.
   * @param above A speed it does not catch, m/s.
   * @returns m/s, a whole centimetre per second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the bracket and the result's precision.
   * @evidence contracts/development/implementation.md#principled-implementation Capture is monotone in the speed: `recover` tries every order of the feet and lands each step as near its target as its region allows, so whatever catches a push catches a slower one along the same course (Koolen et al. 2012); the pendulum's capture is a necessary condition of the whole model's, so it bounds the bracket from above, and the whole model is bisected inside it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two bisections over `recover`: the pendulum's, then the whole model's.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The limit is the whole model's, never the pendulum's bound.
   * @evidence contracts/development/implementation.md#efficient-algorithms The pendulum's bisection costs no stance course; the whole model's runs inside its bound, read only when a push is refused.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `recover`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    body: IAutoMovieMotionHumanActionContext["body"],
    entry: IAutoMovieMotionHumanActionContext["entry"],
    push: IAutoMovieVector3,
    above: number,
  ): number {
    // The limit is the body's in a direction from a stance: read once.
    const feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> =
      StrikingTarget.feet(entry);
    const key: string = [
      push.x,
      push.z,
      ...[feet.left, feet.right].flatMap(
        (f: IAutoMovieMotionHumanFoot.IPlacement): number[] => [f.ankle.x, f.ankle.z],
      ),
    ]
      .map((v: number): string => v.toFixed(4))
      .join(",");
    const known: Map<string, number> | undefined = LIMITS.get(body);
    const kept: number | undefined = known?.get(key);
    if (kept !== undefined && kept < above) return kept;
    const bisect = (
      lo: number,
      hi: number,
      catches: (speed: number) => boolean,
    ): number => {
      while (hi - lo > staggerBounds.RESOLUTION) {
        const mid: number = (lo + hi) / 2;
        if (catches(mid)) lo = mid;
        else hi = mid;
      }
      return lo;
    };
    const bound: number = bisect(
      0,
      above,
      (speed: number): boolean =>
        staggerRecover.recover(body, entry, push, speed, 1, false) !== null,
    );
    const whole = (speed: number): boolean =>
      staggerRecover.recover(body, entry, push, speed, 1) !== null;
    // The limit stands with its band verified: every speed of the grid over
    // `VERIFIED` below it is caught too; a refused one below it moves the
    // search under it.
    let found: number = whole(bound) ? bound : bisect(0, bound, whole);
    for (;;) {
      let refused: number = -1;
      for (let i: number = 1; i * staggerBounds.RESOLUTION <= staggerBounds.VERIFIED + 1e-9; i++) {
        const speed: number = found - i * staggerBounds.RESOLUTION;
        if (speed <= 0) break;
        if (!whole(speed)) {
          refused = speed;
          break;
        }
      }
      if (refused < 0) break;
      found = bisect(0, refused, whole);
    }
    const out: number = Math.floor(found * 100) / 100;
    if (known === undefined) LIMITS.set(body, new Map([[key, out]]));
    else known.set(key, out);
    return out;
  }

  /** Each body's fastest caught push, by its direction and its stance's feet, read once (`limit`). */
  const LIMITS: WeakMap<
    IAutoMovieMotionHumanActionContext["body"],
    Map<string, number>
  > = new WeakMap();
}

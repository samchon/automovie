import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import { staggerBounds } from "./staggerBounds";
import { staggerKnots } from "./staggerKnots";
import { staggerRecover } from "./staggerRecover";
import { prepareStaggerPendulumEntry } from "./prepareStaggerPendulumEntry";

/**
 * The fastest push a body catches in a stagger's recovery steps
 * (`staggerRecover`), the limit a refused push names (`stagger`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and who reads it.
 * @evidence contracts/development/design.md#principled-representation One exact speed search under one fixed body, entry and push, with call-local repeated-speed observations.
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
   * @param bending Optional actual completed bending from this same unchanged body and complete entry, within the current parent operation.
   * @param prepared Optional actual entry geometry with that same unchanged-body/entry and operation premise.
   * @returns m/s, a whole centimetre per second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the bracket and the result's precision.
   * @evidence contracts/development/implementation.md#principled-implementation Capture is monotone in the speed: `recover` tries every order of the feet and lands each step as near its target as its region allows, so whatever catches a push catches a slower one along the same course (Koolen et al. 2012); the pendulum's capture is a necessary condition of the whole model's, so it bounds the bracket from above, and the whole model is bisected inside it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two bisections over `recover`: the pendulum's, then the whole model's.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The limit is the whole model's, never the pendulum's bound.
   * @evidence contracts/development/implementation.md#efficient-algorithms Pendulum bisection demands no stance course or bending solve; the whole model runs inside that bound, sharing one fixed-entry bending and avoiding duplicate solves of the exact same speed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The call-local speed map fixes body, complete entry, push and righting context; each changed speed still runs the real recovery law. An explicit same-operation parent can lend its actual bending/entry geometry instead of preparing the same entry again. No rounded or incomplete entry key can replay a previous invocation's result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The invocation retains one boolean per distinct queried speed and borrows or lazily owns one bending and fixed entry-geometry record, released on return or failure; no module/body result history remains.
   */
  export function of(
    body: IHumanActionContext["body"],
    entry: IHumanActionContext["entry"],
    push: IAutoMovieVector3,
    above: number,
    bending?: Record<"pitch" | "roll", IAutoMovieVector3>,
    prepared?: ReturnType<typeof prepareStaggerPendulumEntry>,
  ): number {
    const geometry: ReturnType<typeof prepareStaggerPendulumEntry> = prepared ?? prepareStaggerPendulumEntry(body, entry);
    let bend: Record<"pitch" | "roll", IAutoMovieVector3> | undefined = bending;
    const readBend: () => Record<"pitch" | "roll", IAutoMovieVector3> =
      (): Record<"pitch" | "roll", IAutoMovieVector3> =>
        (bend ??= staggerKnots.bending(body, entry));
    const bisect: (lo: number, hi: number, catches: (speed: number) => boolean) => number = (
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
        staggerRecover.recover(body, entry, push, speed, 1, false, readBend, geometry) !== null,
    );
    // Bisection and the verified band may ask for the same speed. This
    // invocation fixes every recovery input, so keep only its exact answers.
    const checked: Map<number, boolean> = new Map();
    const whole: (speed: number) => boolean = (speed: number): boolean => {
      const known: boolean | undefined = checked.get(speed);
      if (known !== undefined) return known;
      const result: boolean = staggerRecover.recover(body, entry, push, speed, 1, true, readBend, geometry) !== null;
      checked.set(speed, result);
      return result;
    };
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
    return Math.floor(found * 100) / 100;
  }

}

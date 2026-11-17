import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import { StaggerPendulum } from "./StaggerPendulum";
import { staggerBounds } from "./staggerBounds";
import { staggerRecover } from "./staggerRecover";

/**
 * The fastest push a body catches in a stagger's recovery steps
 * (`staggerRecover`), the limit a refused push names (`stagger`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and who reads it.
 * @evidence contracts/development/design.md#principled-representation One speed search invoking the actual recovery law for every ordered speed observation under the current body, entry and push.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by `stagger`'s refusal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The limit is the whole model's, read by the recovery itself.
 */
export namespace staggerLimit {
  /**
   * The fastest push along a direction a body catches in `STEPS` recovery
   * steps, to `RESOLUTION` and then floored to a whole centimetre per second,
   * with every speed of that grid over `VERIFIED` below it caught too.
   *
   * The pendulum alone, its steps unadmitted by the legs, catches at least
   * what the whole model catches, exactly: the whole model places every
   * step, the close and the settling as the pendulum does and only refuses
   * those the legs do not hold (`staggerRecover.recover`). So the
   * pendulum's fastest caught speed bounds the limit from above, and the
   * whole model is bisected between none and that bound. A bound the whole
   * model catches is the limit at once.
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param push The push's horizontal unit direction, world.
   * @param above A speed it does not catch, m/s.
   * @returns m/s, a whole centimetre per second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the bracket, its premise and the result's precision.
   * @evidence contracts/development/implementation.md#principled-implementation Capture is monotone in the speed for the pendulum: `recover` tries every order of the feet and lands each step as near its target as its region allows, so whatever catches a push catches a slower one along the same course (Koolen et al. 2012); the pendulum's capture is a necessary condition of the whole model's, which shares its dynamics, so it bounds the bracket from above, and the whole model is bisected inside it with its verified band.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two bisections over `recover`: the pendulum's, then the whole model's.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The limit is the whole model's, never the pendulum's bound.
   * @evidence contracts/development/implementation.md#efficient-algorithms About log2(above / RESOLUTION) closed-form pendulum probes, then at most as many whole-model probes and VERIFIED / RESOLUTION band probes per refused band speed; a whole-model probe solves no stance course, and admits only the prefixes of orders the pendulum catches.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The entry's fixed geometry (`StaggerPendulum.prepare`: one whole-body centre of mass read and the soles' extents) is read once and shared by every probe, as it depends on the body and entry alone; each probe's pendulum state and admissions are its own speed's.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains only scalar bracket/grid state, the fixed geometry and local callbacks until return or failure.
   */
  export function of(
    body: IHumanActionContext["body"],
    entry: IHumanActionContext["entry"],
    push: IAutoMovieVector3,
    above: number,
  ): number {
    const fixed: ReturnType<typeof StaggerPendulum.prepare> = StaggerPendulum.prepare(body, entry);
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
        staggerRecover.recover(body, entry, push, speed, 1, false, fixed) !== null,
    );
    const whole: (speed: number) => boolean = (speed: number): boolean =>
      staggerRecover.recover(body, entry, push, speed, 1, true, fixed) !== null;

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

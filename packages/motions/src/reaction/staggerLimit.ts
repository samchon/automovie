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
   * @param fixed The entry's geometry (`StaggerPendulum.prepare`) of this same body and entry, shared with the plan that was refused; read here when absent.
   * @returns m/s, a whole centimetre per second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the bracket, its premise and the result's precision.
   * @evidence contracts/development/implementation.md#principled-implementation Capture is monotone in the speed for the pendulum: `recover` tries every order of the feet and lands each step as near its target as its region allows, so whatever catches a push catches a slower one along the same course (Koolen et al. 2012); the pendulum's capture is a necessary condition of the whole model's, which shares its dynamics, so it bounds the bracket from above, and the whole model is bisected inside it with its verified band.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two bisections over `recover`: the pendulum's, then the whole model's.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The limit is the whole model's, never the pendulum's bound.
   * @evidence contracts/development/implementation.md#efficient-algorithms About log2(above / RESOLUTION) closed-form pendulum probes, then at most as many whole-model probes and VERIFIED / RESOLUTION band probes per refused band speed; a whole-model probe solves no stance course, and admits only the prefixes of orders the pendulum catches.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The entry's fixed geometry (`StaggerPendulum.prepare`) is read once and shared by every probe, as it depends on the body and entry alone; each grid speed's answer is kept per model within the search, since probing it again would run the same deterministic recovery; each probe's pendulum state and admissions are its own speed's.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains only scalar bracket/grid state, the fixed geometry and local callbacks until return or failure.
   */
  export function of(
    body: IHumanActionContext["body"],
    entry: IHumanActionContext["entry"],
    push: IAutoMovieVector3,
    above: number,
    fixed: ReturnType<typeof StaggerPendulum.prepare> = StaggerPendulum.prepare(body, entry),
  ): number {
    // The search runs on the fixed grid of `RESOLUTION` multiples, so the
    // limit does not depend on the refused speed that asked for it: index
    // 0 (no push) is caught, and the first index at or over `above` is not.
    const R: number = staggerBounds.RESOLUTION;
    const top: number = Math.ceil(above / R - 1e-9);
    const probe: (catches: (speed: number) => boolean) => (k: number) => boolean = (
      catches: (speed: number) => boolean,
    ): ((k: number) => boolean) => {
      // One answer per grid speed and model within this search: a speed
      // probed again (the band's, a bisection's end) is the same recovery.
      const known: Map<number, boolean> = new Map();
      return (k: number): boolean => {
        if (k <= 0) return true;
        if (k >= top) return false;
        let caught: boolean | undefined = known.get(k);
        if (caught === undefined) {
          caught = catches(k * R);
          known.set(k, caught);
        }
        return caught;
      };
    };
    const bisect: (lo: number, hi: number, caught: (k: number) => boolean) => number = (
      lo: number,
      hi: number,
      caught: (k: number) => boolean,
    ): number => {
      while (hi - lo > 1) {
        const mid: number = (lo + hi) >> 1;
        if (caught(mid)) lo = mid;
        else hi = mid;
      }
      return lo;
    };
    const pendulum: (k: number) => boolean = probe(
      (speed: number): boolean =>
        staggerRecover.recover(body, entry, push, speed, 1, false, fixed) !== null,
    );
    const whole: (k: number) => boolean = probe(
      (speed: number): boolean =>
        staggerRecover.recover(body, entry, push, speed, 1, true, fixed) !== null,
    );
    const bound: number = bisect(0, top, pendulum);

    // The limit stands with its band verified: every speed of the grid over
    // `VERIFIED` below it is caught too; a refused one below it moves the
    // search under it.
    const band: number = Math.round(staggerBounds.VERIFIED / R);
    let found: number = whole(bound) ? bound : bisect(0, bound, whole);
    for (;;) {
      let refused: number = -1;
      for (let i: number = 1; i <= band && found - i > 0; i++)
        if (!whole(found - i)) {
          refused = found - i;
          break;
        }
      if (refused < 0) break;
      found = bisect(0, refused, whole);
    }
    return Math.floor(found * R * 100 + 1e-9) / 100;
  }

}

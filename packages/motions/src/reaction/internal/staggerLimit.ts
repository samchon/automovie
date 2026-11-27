import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieVector3,
} from "@automovie/interface";

import { StaggerPendulum } from "./StaggerPendulum";
import { staggerBounds } from "./staggerBounds";
import { staggerCapture } from "./staggerCapture";
import { staggerPendulumEntry } from "./staggerPendulumEntry";
import { staggerRecover } from "./staggerRecover";

/*
 * The fastest push along a direction a body catches in `STEPS` recovery steps,
 * to `RESOLUTION` and then floored to a whole centimetre per second, with every
 * speed of that grid over `VERIFIED` below it caught too.
 *
 * The pendulum alone, its steps unadmitted by the legs, catches at least what
 * the whole model catches, exactly: the whole model places every step, the
 * close and the settling as the pendulum does and only refuses those the legs
 * do not hold (`staggerRecover.recover`). So the pendulum's fastest caught
 * speed bounds the limit from above, and the whole model is bisected between
 * none and that bound. A bound the whole model catches is the limit at once.
 * Parameter body: The body.
 * Parameter entry: The posture the push meets.
 * Parameter push: The push's horizontal unit direction, world.
 * Parameter above: A speed it does not catch, m/s.
 * Parameter fixed: The entry's geometry (`staggerPendulumEntry.prepare`) of this
 * same body and entry, shared with the plan that was refused; read here when
 * absent.
 * Returns: M/s, a whole centimetre per second.
 */
export function staggerLimit(
  body: IAutoMovieMotionHumanActionContext["body"],
  entry: IAutoMovieMotionHumanActionContext["entry"],
  push: IAutoMovieVector3,
  above: number,
  fixed: ReturnType<
    typeof staggerPendulumEntry.prepare
  > = staggerPendulumEntry.prepare(body, entry),
): number {
  // The search runs on the fixed grid of `RESOLUTION` multiples, so the
  // limit does not depend on the refused speed that asked for it: index
  // 0 (no push) is caught, and the first index at or over `above` is not.
  const R: number = staggerBounds.RESOLUTION;

  // Koolen's `STEPS`-step capture distance bounds the bracket: a push's
  // extrapolated centre of mass lies at least v / omega0 less the centre's
  // distance from its nearer ankle from that ankle, so no push over
  // omega0 (d_STEPS + that distance) is caught (`staggerCapture`).
  const still: StaggerPendulum = new StaggerPendulum(
    body,
    entry,
    push,
    0,
    fixed,
  );
  const near: number = Math.min(
    ...(["left", "right"] as const).map((side: AutoMovieHumanSide): number =>
      Math.hypot(
        fixed.centre.x - fixed.entered[side].ankle.x,
        fixed.centre.z - fixed.entered[side].ankle.z,
      ),
    ),
  );
  const screened: number =
    fixed.w * (staggerCapture(still).distance(staggerBounds.STEPS) + near);
  const top: number =
    Math.ceil(Math.min(above, screened) / R - 1e-9) +
    (screened < above ? 1 : 0);
  const probe: (
    catches: (speed: number) => boolean,
  ) => (k: number) => boolean = (
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
  const bisect: (
    lo: number,
    hi: number,
    caught: (k: number) => boolean,
  ) => number = (
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
      staggerRecover.recover(body, entry, push, speed, 1, false, fixed) !==
      null,
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

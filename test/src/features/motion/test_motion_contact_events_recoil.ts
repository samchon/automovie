import { resolveAutoMovieContactEvents } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A later weapon meets a stopped limb where that limb is shown after its stop,
 * not where it stopped: a striking hand that dwells 15 ms on contact and then
 * recoils is gone when a counter arrives after the recoil.
 *
 * The scene is plain geometry on the line y = 1: A's fist, a 5 cm sphere,
 * travels +X at 2 m/s from x = -1 into B's 10 cm body sphere at x = 0.5;
 * A's body is that fist alone, which after its stop holds for 15 ms and then
 * recoils to x = -1 within 0.1 s. B's counter, a 5 cm sphere, travels -X at
 * 1.5 m/s from x = 1.6.
 *
 * Scenarios:
 * 1. A's fist stops on B at 0.675 s, when its centre reaches x = 0.35.
 * 2. B's counter is not stopped near 0.767 s, where it would meet the fist
 *    had it stayed frozen at x = 0.35; with the recoil, nothing stops it.
 * 3. Control: with A's fist held at its stop instead, the counter stops on A
 *    at 0.767 s.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public resolver with bodies that read the committed stops; a resolver that evaluates later weapons against a frozen stop fails scenario 2.
 * @evidence contracts/development/testing.md#independent-expectations Contact times are solved by hand from the straight paths and the radii.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs the recoiling limb with a frozen control that must stop the counter.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on plain geometry; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 scenarios and what each pins.
 */
export function test_motion_contact_events_recoil(): void {
  const fist = (t: number): IAutoMovieVector3 => ({
    x: -1 + 2 * t,
    y: 1,
    z: 0,
  });
  const counter = (t: number): IAutoMovieVector3 => ({
    x: 1.6 - 1.5 * t,
    y: 1,
    z: 0,
  });
  const sphere = (
    centre: IAutoMovieVector3,
    radius: number,
    p: IAutoMovieVector3,
  ): number =>
    Math.hypot(p.x - centre.x, p.y - centre.y, p.z - centre.z) - radius;
  const run = (recoil: boolean): resolveAutoMovieContactEvents.IEvent[] =>
    resolveAutoMovieContactEvents({
      weapons: [
        {
          id: "a:fist",
          owner: "a",
          radius: 0.05,
          position: (t: number) => fist(t),
        },
        {
          id: "b:counter",
          owner: "b",
          radius: 0.05,
          position: (t: number) => counter(t),
        },
      ],
      bodies: [
        {
          id: "a",
          distance: (
            p: IAutoMovieVector3,
            t: number,
            stops: resolveAutoMovieContactEvents.IStops,
          ): number => {
            const s: number | undefined = stops.get("a:fist");
            if (s === undefined || t <= s + 0.015)
              return sphere(
                fist(s === undefined ? t : Math.min(t, s)),
                0.05,
                p,
              );
            if (!recoil) return sphere(fist(s), 0.05, p);
            const u: number = Math.min(1, (t - s - 0.015) / 0.1);
            const at: IAutoMovieVector3 = fist(s);
            return sphere({ ...at, x: at.x + (-1 - at.x) * u }, 0.05, p);
          },
        },
        {
          id: "b",
          distance: (p: IAutoMovieVector3): number =>
            sphere({ x: 0.5, y: 1, z: 0 }, 0.1, p),
        },
      ],
      from: 0,
      to: 1,
      step: 1 / 120,
    });

  // 1. The fist stops on B.
  const recoiling = run(true);
  const first = recoiling.find((e) => e.weapon === "a:fist");
  TestValidator.predicate(
    `the fist stops on B at 0.675 s (${first?.seconds})`,
    first !== undefined &&
      first.against === "b" &&
      Math.abs(first.seconds - 0.675) < 1e-4,
  );

  // 2. The counter passes where the recoiled fist no longer is.
  TestValidator.predicate(
    `the counter is not stopped by the recoiled fist (${JSON.stringify(recoiling)})`,
    recoiling.every((e) => e.weapon !== "b:counter"),
  );

  // 3. Control: a fist held at its stop does stop the counter.
  const held = run(false).find((e) => e.weapon === "b:counter");
  TestValidator.predicate(
    `a held fist stops the counter at 0.767 s (${held?.seconds})`,
    held !== undefined &&
      held.against === "a" &&
      Math.abs(held.seconds - 1.15 / 1.5) < 1e-4,
  );
}

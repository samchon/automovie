import { resolveAutoMovieContactEvents } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A tapered capsule weapon, a limb that narrows from one joint to the next,
 * meets a body where its own radius there reaches it, not where its widest
 * radius would.
 *
 * The geometry is plain and solved by hand. A shin lies along x from -0.2 to
 * 0.2 m in the plane z = 0 and falls at 2 m/s from y = 1; its radius falls
 * from 0.08 m at x = -0.2 to 0.02 m at x = 0.2, `k = -0.15` per metre. A
 * forearm, a capsule of radius 0.02 m, lies still along z through x = 0.15,
 * `s = 0.35` m along the shin from its wide end. With the shin's axis `H`
 * above the forearm's, the least of the distance less the radius over the
 * shin is `H sqrt(1 - k^2) - 0.08 - k s`, so the two touch at `H = (0.02 +
 * 0.08 - 0.0525) / sqrt(1 - 0.0225)`.
 *
 * Scenarios:
 * 1. The tapered shin meets the forearm at `t = (1 - H) / 2 = 0.47598...` s,
 *    to 1e-6 s; the body receives the two radii and answers the tapered
 *    distance itself.
 * 2. The same shin at its widest radius throughout meets it at 0.45 s, when
 *    its axis is 0.1 m above: the over-wide limb this removes.
 * 3. A tail radius without a tail, or a negative one, throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public resolver and reads its events; a taper ignored, read at one end or subtracted twice fails.
 * @evidence contracts/development/testing.md#independent-expectations The contact seconds are solved by hand from the straight fall and the closed form of a point's distance to a round cone.
 * @evidence contracts/development/testing.md#distinguishing-cases A tapered and a constant shin on the same fall, and two invalid tail radii.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 scenarios and what each pins.
 */
export function test_motion_contact_events_tapered(): void {
  const close = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;
  const height = (t: number): number => 1 - 2 * t;
  const end =
    (x: number) =>
    (t: number): IAutoMovieVector3 => ({ x, y: height(t), z: 0 });
  const post: number = 0.15;

  // The forearm's signed distance to a horizontal segment in the plane z = 0,
  // widened by a radius running from `r[0]` at `a` to `r[1]` at `b`: the
  // closed form of a point (the forearm's axis) against a round cone,
  // clamped to the segment.
  const toForearm = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    r: readonly [number, number],
  ): number => {
    const length: number = b.x - a.x;
    const k: number = (r[1] - r[0]) / length;
    const s: number = post - a.x;
    const h: number = Math.abs(a.y);
    const u: number = Math.min(
      length,
      Math.max(0, s + (k * h) / Math.sqrt(1 - k * k)),
    );
    return Math.hypot(s - u, h) - (r[0] + k * u) - 0.02;
  };
  const forearm: resolveAutoMovieContactEvents.IBody = {
    id: "F",
    distance: (p: IAutoMovieVector3): number =>
      Math.hypot(p.x - post, p.y) - 0.02,
    axis: (
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
      _t: number,
      _stops: resolveAutoMovieContactEvents.IStops,
      taper?: readonly [number, number],
    ): number => toForearm(a, b, taper ?? [0, 0]),
  };
  const run = (tailRadius?: number): resolveAutoMovieContactEvents.IEvent[] =>
    resolveAutoMovieContactEvents({
      weapons: [
        {
          id: "shin",
          owner: "S",
          radius: 0.08,
          ...(tailRadius === undefined ? {} : { tailRadius }),
          position: end(-0.2),
          tail: end(0.2),
        },
      ],
      bodies: [forearm],
      from: 0,
      to: 1,
      step: 1 / 120,
    });

  // 1. The tapered shin.
  const k: number = -0.15;
  const H: number = (0.02 + 0.08 + k * 0.35) / Math.sqrt(1 - k * k);
  const tapered = run(0.02);
  TestValidator.predicate(
    `the tapered shin meets the forearm at ${(1 - H) / 2} s (${tapered[0]?.seconds})`,
    tapered.length === 1 &&
      tapered[0]!.against === "F" &&
      close(tapered[0]!.seconds, (1 - H) / 2),
  );

  // 2. The shin at its widest radius throughout.
  const wide = run();
  TestValidator.predicate(
    `the constant shin meets the forearm at 0.45 s (${wide[0]?.seconds})`,
    wide.length === 1 && close(wide[0]!.seconds, 0.45),
  );

  // 3. Invalid tail radii.
  for (const weapon of [
    { id: "w", owner: "S", radius: 0.08, tailRadius: 0.02, position: end(0) },
    {
      id: "w",
      owner: "S",
      radius: 0.08,
      tailRadius: -0.01,
      position: end(-0.2),
      tail: end(0.2),
    },
  ])
    TestValidator.error(
      `an invalid tail radius (${weapon.tailRadius})`,
      (): unknown =>
        resolveAutoMovieContactEvents({
          weapons: [weapon],
          bodies: [forearm],
          from: 0,
          to: 1,
          step: 1 / 120,
        }),
    );
}

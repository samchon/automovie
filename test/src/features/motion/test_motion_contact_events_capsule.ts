import { Vector3, resolveAutoMovieContactEvents } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A capsule weapon, a limb segment swept by its radius, meets what crosses it
 * anywhere along its length, where spheres at a few stations would let the
 * crossing pass between them.
 *
 * The geometry is plain and solved by hand. A shin lies along x from -0.2 to
 * 0.2 m in the plane z = 0, radius 0.05 m, and falls at 2 m/s from y = 1. A
 * forearm, a capsule of radius 0.02 m, lies still along z through the origin.
 *
 * Scenarios:
 * 1. Spheres at the shin's two ends, its former stations, never come within
 *    0.07 m of the forearm (their centres stay 0.2 m from it), so they meet
 *    nothing: the defect the capsule removes.
 * 2. The capsule meets the forearm when the shin's axis is the two radii,
 *    0.07 m, above it: at `t = (1 - 0.07) / 2 = 0.465` s, to 1e-6 s.
 * 3. Two vertical capsule shins of radius 0.1 m, each the other's body,
 *    approaching along x at 2 m/s each from x = -1 and 1 with overlapping
 *    heights, touch when their axes are 0.2 m apart, `t = 0.45` s; both stop
 *    there, each against the other, with identical events in either listing
 *    order.
 * 4. A capsule weapon against a body that measures no segment throws rather
 *    than being reduced to its ends.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public resolver and reads its events; a capsule tested only at its ends, a late or early impact, or an order-dependent result fails.
 * @evidence contracts/development/testing.md#independent-expectations Contact seconds are solved by hand from straight paths and the radii; the segment distances are the closed forms of this axis-aligned geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases End spheres against the capsule on the same crossing, a crossing and a head-on pair, both listing orders, and a body without segment distance.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_motion_contact_events_capsule(): void {
  const close = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;

  // The falling shin and the still forearm along z: in the plane z = 0 the
  // forearm is the origin, so a segment's distance to it is the planar
  // distance from the origin to the segment, less the forearm's radius.
  const height = (t: number): number => 1 - 2 * t;
  const end =
    (x: number) =>
    (t: number): IAutoMovieVector3 => ({ x, y: height(t), z: 0 });
  const toOrigin = (a: IAutoMovieVector3, b: IAutoMovieVector3): number => {
    const ab: IAutoMovieVector3 = Vector3.subtract(b, a);
    const k: number = Math.min(
      1,
      Math.max(0, -Vector3.dot(a, ab) / Math.max(1e-18, Vector3.dot(ab, ab))),
    );
    return Vector3.length(Vector3.add(a, Vector3.scale(ab, k)));
  };
  const forearm: resolveAutoMovieContactEvents.IBody = {
    id: "F",
    distance: (p: IAutoMovieVector3): number => Math.hypot(p.x, p.y) - 0.02,
    axis: (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
      toOrigin({ ...a, z: 0 }, { ...b, z: 0 }) - 0.02,
  };
  const spheres = resolveAutoMovieContactEvents({
    weapons: [
      { id: "near", owner: "S", radius: 0.05, position: end(-0.2) },
      { id: "far", owner: "S", radius: 0.05, position: end(0.2) },
    ],
    bodies: [forearm],
    from: 0,
    to: 1,
    step: 1 / 120,
  });
  TestValidator.predicate(
    "spheres at the ends pass the forearm",
    spheres.length === 0,
  );
  const capsule = resolveAutoMovieContactEvents({
    weapons: [
      {
        id: "shin",
        owner: "S",
        radius: 0.05,
        position: end(-0.2),
        tail: end(0.2),
      },
    ],
    bodies: [forearm],
    from: 0,
    to: 1,
    step: 1 / 120,
  });
  TestValidator.predicate(
    `the capsule meets the forearm at 0.465 s (${capsule[0]?.seconds})`,
    capsule.length === 1 &&
      capsule[0]!.against === "F" &&
      close(capsule[0]!.seconds, 0.465),
  );

  // Head-on shins, each the other's body and held once stopped. Parallel
  // vertical segments with overlapping heights are their x gap apart.
  type Path = (t: number) => number;
  const held =
    (id: string, x: Path) =>
    (t: number, stops: resolveAutoMovieContactEvents.IStops): number =>
      x(Math.min(t, stops.get(id) ?? Infinity));
  const shin = (
    id: string,
    owner: string,
    x: Path,
    low: number,
  ): resolveAutoMovieContactEvents.IWeapon => ({
    id,
    owner,
    radius: 0.1,
    position: (t, stops) => ({ x: held(id, x)(t, stops), y: low, z: 0 }),
    tail: (t, stops) => ({ x: held(id, x)(t, stops), y: low + 0.4, z: 0 }),
  });
  const leg = (
    id: string,
    weapon: string,
    x: Path,
  ): resolveAutoMovieContactEvents.IBody => ({
    id,
    distance: (
      p: IAutoMovieVector3,
      t: number,
      stops: resolveAutoMovieContactEvents.IStops,
    ): number => Math.abs(p.x - held(weapon, x)(t, stops)) - 0.1,
    axis: (
      a: IAutoMovieVector3,
      _b: IAutoMovieVector3,
      t: number,
      stops: resolveAutoMovieContactEvents.IStops,
    ): number => Math.abs(a.x - held(weapon, x)(t, stops)) - 0.1,
  });
  const left: Path = (t) => -1 + 2 * t;
  const right: Path = (t) => 1 - 2 * t;
  const runs = [0, 1].map((order: number) => {
    const weapons = [shin("a", "A", left, 0.3), shin("b", "B", right, 0.5)];
    return resolveAutoMovieContactEvents({
      weapons: order === 0 ? weapons : [...weapons].reverse(),
      bodies: [leg("A", "a", left), leg("B", "b", right)],
      from: 0,
      to: 1,
      step: 1 / 120,
    });
  });
  TestValidator.predicate(
    "head-on capsules stop together at 0.45 s in either order",
    runs.every(
      (events) =>
        events.length === 2 &&
        events.every((e) => close(e.seconds, 0.45)) &&
        events.some((e) => e.weapon === "a" && e.against === "B") &&
        events.some((e) => e.weapon === "b" && e.against === "A"),
    ) &&
      runs[0]!.every(
        (e, i) =>
          e.seconds === runs[1]![i]!.seconds &&
          e.weapon === runs[1]![i]!.weapon &&
          e.against === runs[1]![i]!.against,
      ),
  );

  TestValidator.error(
    "a capsule against a body without segment distance",
    (): unknown =>
      resolveAutoMovieContactEvents({
        weapons: [
          {
            id: "shin",
            owner: "S",
            radius: 0.05,
            position: end(-0.2),
            tail: end(0.2),
          },
        ],
        bodies: [
          {
            id: "P",
            distance: (p: IAutoMovieVector3): number =>
              Math.hypot(p.x, p.y) - 0.02,
          },
        ],
        from: 0,
        to: 1,
        step: 1 / 120,
      }),
  );
}

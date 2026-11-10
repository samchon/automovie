import { Vector3, resolveAutoMovieContactEvents } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Simultaneous contacts resolve in time order, each stop changing what the
 * others meet, independently of the order the weapons are listed in.
 *
 * Every body here is a sphere of radius 0.1 m around its weapon's centre (a
 * fist carried by its arm), standing still once its weapon stops.
 *
 * Scenarios:
 * 1. Head-on: two weapons approaching along x at 2 m/s each touch when their
 *    centres are the two radii, 0.2 m, apart: both stop at the same second,
 *    `t = (2 - 0.2) / 4 = 0.45`, each against the other, in either listing
 *    order.
 * 2. Earliest first: a weapon stopped by a post at 0.2 s stays short of
 *    where a later weapon passes, which then meets nothing, though it would
 *    have met the first on its free path; a repeat is bit-identical.
 * 3. Crossing: a weapon passes behind where the other has already gone
 *    (their paths cross at different times): no contact.
 * 4. Block: a strike toward a still head meets a guard sphere that arrives
 *    on its line first, at the second solved from the guard's arrival, and
 *    never reaches the head; without the guard it meets the head.
 * 5. A span or step that is not positive, or a repeated weapon id, throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public resolver and reads its events; a missed tie, an order-dependent result, a contact through an earlier block or a phantom crossing fails.
 * @evidence contracts/development/testing.md#independent-expectations Contact seconds are solved by hand from the straight paths and the radii.
 * @evidence contracts/development/testing.md#distinguishing-cases Head-on, crossing, blocked and unblocked strikes, both listing orders, invalid input.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 scenarios and what each pins.
 */
export function test_motion_striking_contact_events(): void {
  type Path = (t: number) => IAutoMovieVector3;
  const held =
    (id: string, path: Path) =>
    (
      t: number,
      stops: resolveAutoMovieContactEvents.IStops,
    ): IAutoMovieVector3 =>
      path(Math.min(t, stops.get(id) ?? Infinity));
  const weapon = (
    id: string,
    owner: string,
    path: Path,
  ): resolveAutoMovieContactEvents.IWeapon => ({
    id,
    owner,
    radius: 0.1,
    position: held(id, path),
  });
  const carrier = (
    id: string,
    weaponId: string,
    path: Path,
  ): resolveAutoMovieContactEvents.IBody => ({
    id,
    distance: (
      p: IAutoMovieVector3,
      t: number,
      stops: resolveAutoMovieContactEvents.IStops,
    ): number =>
      Vector3.length(Vector3.subtract(p, held(weaponId, path)(t, stops))) - 0.1,
  });
  const close = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;

  const a: Path = (t) => ({ x: -1 + 2 * t, y: 0, z: 0 });
  const b: Path = (t) => ({ x: 1 - 2 * t, y: 0, z: 0 });
  for (const order of [0, 1]) {
    const weapons = [weapon("a", "A", a), weapon("b", "B", b)];
    const events = resolveAutoMovieContactEvents({
      weapons: order === 0 ? weapons : [...weapons].reverse(),
      bodies: [carrier("A", "a", a), carrier("B", "b", b)],
      from: 0,
      to: 1,
      step: 1 / 96,
    });
    TestValidator.predicate(
      `head-on, order ${order}`,
      events.length === 2 &&
        events.every((e) => close(e.seconds, 0.45)) &&
        events[0]!.weapon === "a" &&
        events[0]!.against === "B" &&
        events[1]!.against === "A",
    );
  }

  // Earliest first, the others against the stopped pose: weapon c would meet
  // a's free path at a later second, but a has stopped short of it, so c
  // passes; repeating the resolution gives bit-identical seconds.
  const a2: Path = (t) => ({ x: -1 + 2 * t, y: 0, z: 0 });
  const c: Path = (t) => ({ x: 0, y: 1 - 2 * t, z: 0 });
  const solve = () =>
    resolveAutoMovieContactEvents({
      weapons: [weapon("c", "C", c), weapon("a", "A", a2)],
      bodies: [
        {
          id: "W",
          distance: (p: IAutoMovieVector3): number =>
            Vector3.length(Vector3.subtract(p, { x: -0.4, y: 0, z: 0 })) - 0.1,
        },
        carrier("A", "a", a2),
        carrier("C", "c", c),
      ],
      from: 0,
      to: 1,
      step: 1 / 96,
    });
  const first = solve();
  const second = solve();
  TestValidator.predicate(
    "a stopped weapon is passed by the later one, bit-identically",
    first.length === 1 &&
      first[0]!.weapon === "a" &&
      first[0]!.against === "W" &&
      close(first[0]!.seconds, 0.2) &&
      second.length === first.length &&
      second.every(
        (e, i) =>
          e.seconds === first[i]!.seconds && e.weapon === first[i]!.weapon,
      ),
  );

  const across: Path = (t) => ({ x: -1 + 2 * t, y: 0, z: 0 });
  const late: Path = (t) => ({ x: 0, y: -1 + 2 * (t - 0.6), z: 0 });
  TestValidator.predicate(
    "crossing paths at different times",
    resolveAutoMovieContactEvents({
      weapons: [weapon("a", "A", across), weapon("b", "B", late)],
      bodies: [carrier("A", "a", across), carrier("B", "b", late)],
      from: 0,
      to: 1,
      step: 1 / 96,
    }).length === 0,
  );

  const strike: Path = (t) => ({ x: -1 + 2 * t, y: 0, z: 0 });
  const head: IAutoMovieVector3 = { x: 0.5, y: 0, z: 0 };
  const guardPath: Path = (t) => ({
    x: 0.2,
    y: Math.max(0, 0.5 - 2 * t),
    z: 0,
  });
  const headBody: resolveAutoMovieContactEvents.IBody = {
    id: "H",
    distance: (p: IAutoMovieVector3): number =>
      Vector3.length(Vector3.subtract(p, head)) - 0.1,
  };
  const blocked = resolveAutoMovieContactEvents({
    weapons: [weapon("s", "S", strike)],
    bodies: [
      {
        id: "G",
        distance: (p: IAutoMovieVector3, t: number): number =>
          Vector3.length(Vector3.subtract(p, guardPath(t))) - 0.1,
      },
      headBody,
    ],
    from: 0,
    to: 1,
    step: 1 / 96,
  });
  TestValidator.predicate(
    "the guard on the line stops the strike",
    blocked.length === 1 &&
      blocked[0]!.against === "G" &&
      close(blocked[0]!.seconds, 0.5),
  );
  const open = resolveAutoMovieContactEvents({
    weapons: [weapon("s", "S", strike)],
    bodies: [headBody],
    from: 0,
    to: 1,
    step: 1 / 96,
  });
  TestValidator.predicate(
    "without the guard it meets the head",
    open.length === 1 &&
      open[0]!.against === "H" &&
      close(open[0]!.seconds, 0.65),
  );

  TestValidator.error("empty span", (): unknown =>
    resolveAutoMovieContactEvents({
      weapons: [],
      bodies: [],
      from: 1,
      to: 1,
      step: 0.1,
    }),
  );
  TestValidator.error("zero step", (): unknown =>
    resolveAutoMovieContactEvents({
      weapons: [],
      bodies: [],
      from: 0,
      to: 1,
      step: 0,
    }),
  );
  TestValidator.error("repeated id", (): unknown =>
    resolveAutoMovieContactEvents({
      weapons: [weapon("a", "A", a), weapon("a", "B", b)],
      bodies: [],
      from: 0,
      to: 1,
      step: 0.1,
    }),
  );
}

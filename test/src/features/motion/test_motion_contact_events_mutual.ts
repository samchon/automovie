import { resolveAutoMovieContactEvents } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A contact is mutual: when the part a weapon meets carries a weapon of its
 * own that is still moving, both stop at the same second, so neither limb is
 * driven on into the one that has already stopped on it.
 *
 * The geometry is plain and solved by hand. Two vertical capsule shins of
 * radius 0.1 m approach along x at 2 m/s each, `a` of body A from x = -1 and
 * `b` of body B from x = 1, so their axes are `2 - 4 t` apart. Body A measures
 * its shin 0.1 m thick, as its weapon does, but body B measures its own only
 * 0.06 m thick: the two measures of one limb that disagree.
 *
 * Scenarios:
 * 1. Without `carried`, `b` meets body A at `2 - 4 t = 0.2`, `t = 0.45` s, and
 *    stops with its axis at x = 0.1. `a` goes on until its axis is 0.16 m from
 *    it, `-1 + 2 t = -0.06`, `t = 0.47` s: 0.04 m inside the stopped capsule,
 *    the defect.
 * 2. With `carried` naming each body's shin, both stop at 0.45 s, each against
 *    the other, their axes the two radii apart; the events are the same in
 *    either listing order.
 * 3. A body that names a weapon already stopped changes nothing: three
 *    shins, where the third meets a stopped one, yield three events.
 * 4. A body naming a carried weapon that is not its own throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public resolver and reads its events; a second weapon stopped late, twice, or against the wrong body fails.
 * @evidence contracts/development/testing.md#independent-expectations Contact seconds are solved by hand from straight paths, the radii and the two thicknesses.
 * @evidence contracts/development/testing.md#distinguishing-cases The same pair without and with the mutual rule, both listing orders, an already stopped carried weapon, and a foreign one.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_motion_contact_events_mutual(): void {
  const close = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;
  type Path = (t: number) => number;
  const held =
    (id: string, x: Path) =>
    (t: number, stops: resolveAutoMovieContactEvents.IStops): number =>
      x(Math.min(t, stops.get(id) ?? Infinity));
  const shin = (
    id: string,
    owner: string,
    x: Path,
  ): resolveAutoMovieContactEvents.IWeapon => ({
    id,
    owner,
    radius: 0.1,
    position: (
      t: number,
      stops: resolveAutoMovieContactEvents.IStops,
    ): IAutoMovieVector3 => ({ x: held(id, x)(t, stops), y: 0.3, z: 0 }),
    tail: (
      t: number,
      stops: resolveAutoMovieContactEvents.IStops,
    ): IAutoMovieVector3 => ({ x: held(id, x)(t, stops), y: 0.7, z: 0 }),
  });
  const leg = (
    id: string,
    weapon: string,
    x: Path,
    thickness: number,
    carried: string | undefined,
  ): resolveAutoMovieContactEvents.IBody => ({
    id,
    distance: (
      p: IAutoMovieVector3,
      t: number,
      stops: resolveAutoMovieContactEvents.IStops,
    ): number => Math.abs(p.x - held(weapon, x)(t, stops)) - thickness,
    axis: (
      a: IAutoMovieVector3,
      _b: IAutoMovieVector3,
      t: number,
      stops: resolveAutoMovieContactEvents.IStops,
    ): number => Math.abs(a.x - held(weapon, x)(t, stops)) - thickness,
    ...(carried === undefined
      ? {}
      : { carried: (): string | undefined => carried }),
  });
  const left: Path = (t: number): number => -1 + 2 * t;
  const right: Path = (t: number): number => 1 - 2 * t;
  const resolve = (
    mutual: boolean,
    reversed: boolean,
  ): resolveAutoMovieContactEvents.IEvent[] => {
    const weapons: resolveAutoMovieContactEvents.IWeapon[] = [
      shin("a", "A", left),
      shin("b", "B", right),
    ];
    return resolveAutoMovieContactEvents({
      weapons: reversed ? [...weapons].reverse() : weapons,
      bodies: [
        leg("A", "a", left, 0.1, mutual ? "a" : undefined),
        leg("B", "b", right, 0.06, mutual ? "b" : undefined),
      ],
      from: 0,
      to: 1,
      step: 1 / 120,
    });
  };

  const apart: resolveAutoMovieContactEvents.IEvent[] = resolve(false, false);
  TestValidator.predicate(
    `without the rule the second shin stops late (${apart.map((e) => e.seconds).join(", ")})`,
    apart.length === 2 &&
      apart[0]!.weapon === "b" &&
      close(apart[0]!.seconds, 0.45) &&
      apart[1]!.weapon === "a" &&
      close(apart[1]!.seconds, 0.47),
  );

  const runs: resolveAutoMovieContactEvents.IEvent[][] = [false, true].map(
    (reversed: boolean): resolveAutoMovieContactEvents.IEvent[] =>
      resolve(true, reversed),
  );
  TestValidator.predicate(
    `mutual shins stop together at 0.45 s (${runs[0]!.map((e) => e.seconds).join(", ")})`,
    runs.every(
      (events: resolveAutoMovieContactEvents.IEvent[]): boolean =>
        events.length === 2 &&
        events[0]!.seconds === events[1]!.seconds &&
        close(events[0]!.seconds, 0.45) &&
        events.some(
          (e: resolveAutoMovieContactEvents.IEvent): boolean =>
            e.weapon === "a" && e.against === "B",
        ) &&
        events.some(
          (e: resolveAutoMovieContactEvents.IEvent): boolean =>
            e.weapon === "b" && e.against === "A",
        ),
    ) &&
      runs[0]!.every(
        (e: resolveAutoMovieContactEvents.IEvent, i: number): boolean =>
          e.seconds === runs[1]![i]!.seconds &&
          e.weapon === runs[1]![i]!.weapon &&
          e.against === runs[1]![i]!.against,
      ),
  );

  // A third shin of body C follows `a` from x = -2 at 2 m/s and meets body A,
  // whose carried shin has already stopped at x = -0.1: at -2 + 2 t = -0.3,
  // t = 0.85 s, and only it stops then.
  const behind: Path = (t: number): number => -2 + 2 * t;
  const three: resolveAutoMovieContactEvents.IEvent[] =
    resolveAutoMovieContactEvents({
      weapons: [
        shin("a", "A", left),
        shin("b", "B", right),
        shin("c", "C", behind),
      ],
      bodies: [
        leg("A", "a", left, 0.1, "a"),
        leg("B", "b", right, 0.06, "b"),
        leg("C", "c", behind, 0.1, "c"),
      ],
      from: 0,
      to: 1,
      step: 1 / 120,
    });
  TestValidator.predicate(
    `an already stopped carried weapon is left alone (${three.map((e) => `${e.weapon}@${e.seconds}`).join(", ")})`,
    three.length === 3 &&
      three[2]!.weapon === "c" &&
      three[2]!.against === "A" &&
      close(three[2]!.seconds, 0.85),
  );

  TestValidator.error("a carried weapon of another body", (): unknown =>
    resolveAutoMovieContactEvents({
      weapons: [shin("a", "A", left), shin("b", "B", right)],
      bodies: [leg("A", "a", left, 0.1, "b"), leg("B", "b", right, 0.06, "b")],
      from: 0,
      to: 1,
      step: 1 / 120,
    }),
  );
}

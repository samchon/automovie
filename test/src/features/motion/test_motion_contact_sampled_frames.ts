import { resolveAutoMovieContactEvents as C } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Combined weapon frames carry actual same-time endpoints through contact
 * search, stop-state changes and departure witnesses without inactive reads.
 *
 * Scenarios:
 * 1. Two 0.1 metre spheres moving toward X=0 meet at 0.45 and 0.7 seconds.
 *    The second path changes after the first stop, so a frame retained across
 *    stop contexts would preserve the wrong 0.95-second contact instead.
 * 2. A tilted capsule falls toward Y=0. Linear taper gives the minimum of
 *    endpoint gaps: the narrow tail touches at 0.375 seconds. Treating the
 *    whole segment as its wide radius would touch at 0.3 seconds.
 * 3. A sphere initially touching X=0 departs, has certified positive clearance
 *    at 0.25 seconds and re-enters at 0.6. Both certificate measurements and
 *    the later scan use actual combined frames.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives metre/second geometry, stop-dependent path, taper/departure equations and the ownership of callback counters in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Runs public event resolution with ordinary and sampled weapons, checks analytic contact ids/times and actual taper arguments, and observes owned callbacks to require samples while leaving replaced position/tail operations inactive.
 * @evidence contracts/development/testing.md#independent-expectations Sphere contact solves x=-radius, giving 0.45 and stop-adjusted 0.7. For the falling tilted capsule, tail gap is 0.8-2t-0.05, whose zero is 0.375; uniform wide radius gives 0.3. The departing piecewise linear path reaches x=-0.1 again at 0.6. No event snapshot supplies those times.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers sphere and tapered capsule geometry, ordinary versus combined adapters, current stops before/after a committed event, replaced callback inactivity, required positive sampling, initial departure witness and later entry. Mutual contact and malformed declarations remain separately specified.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable in-memory unit owns analytic paths, walls, certificate callbacks and counters. It replaces no foreign function, global or solver and starts no host, renderer or compiler; the existing 1e-6-second contact precision remains unchanged.
 */
export function test_motion_contact_sampled_frames(): void {
  let positions: number = 0;
  let tails: number = 0;
  let samples: number = 0;
  let beforeStop: number = 0;
  let afterStop: number = 0;

  /** Adapt an owned actual frame without allowing either transport to change its geometry. */
  function weapon(id: string, sampled: boolean,
    read: (seconds: number, stops: C.IStops) => C.IWeaponFrame,
    capsule: boolean = false): C.IWeapon {
    return {
      id, owner: `owner-${id}`, radius: 0.1,
      position: (seconds: number, stops: C.IStops): IAutoMovieVector3 => {
        positions++;
        return read(seconds, stops).position;
      },
      ...(capsule ? { tail: (seconds: number, stops: C.IStops): IAutoMovieVector3 => {
        tails++;
        return read(seconds, stops).tail!;
      } } : {}),
      ...(sampled ? { sample: (seconds: number, stops: C.IStops): C.IWeaponFrame => {
        samples++;
        return read(seconds, stops);
      } } : {}),
    };
  }

  const wall: C.IBody = { id: "wall", distance: (point: IAutoMovieVector3): number => -point.x };
  for (const sampled of [false, true]) {
    positions = 0; tails = 0; samples = 0; beforeStop = 0; afterStop = 0;
    const events: C.IEvent[] = C({ from: 0, to: 1, step: 1 / 120, bodies: [wall], weapons: [
      weapon("a", sampled, (seconds: number): C.IWeaponFrame => ({
        position: { x: -1 + 2 * seconds, y: 0, z: 0 },
      })),
      weapon("b", sampled, (seconds: number, stops: C.IStops): C.IWeaponFrame => {
        const stopped: boolean = stops.has("a");
        if (stopped) afterStop++; else beforeStop++;
        return { position: { x: (stopped ? -1.5 : -2) + 2 * seconds, y: 0, z: 0 } };
      }),
    ] });
    TestValidator.predicate("current stop context determines the two analytic contacts",
      events.length === 2 && events[0]!.weapon === "a" && events[1]!.weapon === "b" &&
      events.every((event: C.IEvent): boolean => event.against === "wall") &&
      nclose(events[0]!.seconds, 0.45, 1e-6) && nclose(events[1]!.seconds, 0.7, 1e-6) &&
      beforeStop > 0 && afterStop > 0,
    );
    TestValidator.predicate("combined sphere sampling leaves replaced callbacks inactive",
      sampled ? samples > 0 && positions === 0 && tails === 0 : samples === 0 && positions > 0,
    );
  }

  for (const sampled of [false, true]) {
    positions = 0; tails = 0; samples = 0;
    let tapered: number = 0;
    const floor: C.IBody = {
      id: "floor", distance: (point: IAutoMovieVector3): number => point.y,
      axis: (a: IAutoMovieVector3, b: IAutoMovieVector3, _seconds: number,
        _stops: C.IStops, radii?: readonly [number, number]): number => {
        if (radii !== undefined) {
          tapered++;
          TestValidator.predicate("actual ordered taper reaches the body's axis measurement",
            nclose(radii[0], 0.2, 0) && nclose(radii[1], 0.05, 0),
          );
        }
        return Math.min(a.y - (radii?.[0] ?? 0), b.y - (radii?.[1] ?? 0));
      },
    };
    const axis: C.IWeapon = weapon("taper", sampled, (seconds: number): C.IWeaponFrame => ({
      position: { x: 0, y: 1 - 2 * seconds, z: 0 },
      tail: { x: 1, y: 0.8 - 2 * seconds, z: 0 },
    }), true);
    axis.radius = 0.2;
    axis.tailRadius = 0.05;
    const events: C.IEvent[] = C({ from: 0, to: 1, step: 1 / 120, bodies: [floor], weapons: [axis] });
    TestValidator.predicate("sampled taper preserves its independently derived tail contact",
      events.length === 1 && nclose(events[0]!.seconds, 0.375, 1e-6) && tapered > 0,
    );
    TestValidator.predicate("combined capsule sampling leaves separate endpoints inactive",
      sampled ? samples > 0 && positions === 0 && tails === 0 : samples === 0 && positions > 0 && tails > 0,
    );
  }

  positions = 0; samples = 0;
  const leaving: C.IWeapon = weapon("departing", true, (seconds: number): C.IWeaponFrame => ({
    position: { x: seconds <= 0.4 ? -0.1 - seconds : -0.5 + 2 * (seconds - 0.4), y: 0, z: 0 },
  }));
  const separating: C.IBody = {
    ...wall,
    departure: (contact: C.IInitialContact): C.Departure => {
      TestValidator.predicate("departure witness reads actual positive clearance", contact.at(0.25) > 0);
      return { kind: "clearance", seconds: 0.25 };
    },
  };
  const reentry: C.IEvent[] = C({ from: 0, to: 1, step: 1 / 120, bodies: [separating], weapons: [leaving] });
  TestValidator.predicate("sampled departure preserves the later analytic entry",
    reentry.length === 1 && nclose(reentry[0]!.seconds, 0.6, 1e-6) && samples > 0 && positions === 0,
  );
}

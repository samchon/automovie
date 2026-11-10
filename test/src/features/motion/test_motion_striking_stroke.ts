import { Quaternion, Vector3, superposeMinimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { StrikingContact, StrikingStroke } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A strike's stroke lands exactly on its contact point at its contact second
 * with the measured share of peak speed, follows its declared impact
 * direction, stops on the first surface it meets and recoils to its return
 * point; the contact geometry under it measures exact distances.
 *
 * Scenarios:
 * 1. The impact share solves `30 u^2 (1-u)^2 = share x 1.875` above the
 *    middle: 0.5 for a full-speed share, and the kick's 0.55 and the punch's
 *    0.78 reproduce their speed shares.
 * 2. A straight delivery lands on its point at its second with speed equal to
 *    the share of its peak (sampled on a fine grid).
 * 3. A hook-like delivery with a via point and a sideways impact direction
 *    still lands exactly on its point, travelling with a positive component
 *    along the declared direction.
 * 4. A stroke with no surface recoils from the contact and ends at its return
 *    point, continuous in position at the contact.
 * 5. A stroke against a wall stops where it first touches it, holds no
 *    penetration, recoils from there, and finds the same stop whether it is
 *    evaluated late first or early first.
 * 6. Capsule and box distances are exact signed distances; the first-contact
 *    scan brackets and bisects a known crossing.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the public delivery, stroke and contact functions and reads positions, speeds, stop seconds and distances; a landing off its point, a wrong speed share, a lost recoil, an order-dependent stop or a wrong distance fails.
 * @evidence contracts/development/testing.md#independent-expectations The impact share and speeds follow from the quintic's closed form; the wall's crossing is solved from the straight path; distances are computed by hand for axis-aligned shapes.
 * @evidence contracts/development/testing.md#distinguishing-cases Straight and via deliveries, free and stopped strokes, both evaluation orders, capsule, sphere and rotated box shapes.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 scenarios and what each pins.
 */
export function test_motion_striking_stroke(): void {
  const near = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    e: number = 1e-9,
  ): boolean => Vector3.length(Vector3.subtract(a, b)) <= e;
  const speedShare = (u: number): number =>
    (30 * u * u * (1 - u) * (1 - u)) / 1.875;
  TestValidator.predicate(
    "full speed share",
    Math.abs(StrikingStroke.impactShare(1) - 0.5) < 1e-6,
  );
  for (const share of [0.55, 0.78]) {
    const u: number = StrikingStroke.impactShare(share);
    TestValidator.predicate(
      `speed share ${share}`,
      u > 0.5 && Math.abs(speedShare(u) - share) < 1e-9,
    );
  }

  const origin: IAutoMovieVector3 = { x: 0, y: 1.4, z: 0 };
  const impact: IAutoMovieVector3 = { x: 0, y: 1.45, z: 0.6 };
  const straight = StrikingStroke.delivery({
    origin,
    impact,
    direction: Vector3.subtract(impact, origin),
    launch: 1,
    contact: 1.3,
    speed: 0.78,
  });
  const at = superposeMinimumJerk(origin, straight, 1.3);
  let peak: number = 0;
  for (let t: number = 1; t <= 1.6; t += 0.0005)
    peak = Math.max(
      peak,
      Vector3.length(superposeMinimumJerk(origin, straight, t).velocity),
    );
  TestValidator.predicate(
    "lands at speed share",
    near(at.position, impact) &&
      Math.abs(Vector3.length(at.velocity) / peak - 0.78) < 1e-3,
  );

  const sideways: IAutoMovieVector3 = { x: -1, y: 0, z: 0.5 };
  const hook = StrikingStroke.delivery({
    origin,
    via: {
      point: { x: 0.3, y: 1.45, z: 0.2 },
      begin: 1,
      end: 1.15,
      overlap: 0.05,
    },
    impact,
    direction: sideways,
    launch: 1,
    contact: 1.3,
    speed: 0.55,
  });
  const h = superposeMinimumJerk(origin, hook, 1.3);
  TestValidator.predicate(
    "via delivery lands",
    near(h.position, impact) && Vector3.dot(h.velocity, sideways) > 0,
  );

  const back: IAutoMovieVector3 = { x: 0.05, y: 1.4, z: 0.05 };
  const free = StrikingStroke.create({
    origin,
    units: straight,
    contact: 1.3,
    back,
    recoil: 0.35,
    scan: { from: 1, to: 1.4, step: 1 / 96 },
  });
  TestValidator.predicate(
    "free stroke recoils to its return",
    near(free.end(1.3), impact) &&
      near(free.end(1.3 + 1e-7), free.end(1.3 - 1e-7), 1e-5) &&
      near(free.end(1.3 + 0.35 + 0.3), back) &&
      free.stop(2) === undefined,
  );

  const wall: number = 0.45;
  const make = (): StrikingStroke.IStroke =>
    StrikingStroke.create({
      origin,
      units: straight,
      contact: 1.3,
      back,
      recoil: 0.35,
      gap: (end: IAutoMovieVector3): number => wall - end.z,
      scan: { from: 1, to: 1.4, step: 1 / 96 },
    });
  const lateFirst = make();
  lateFirst.end(1.5);
  const lateStop: number | undefined = lateFirst.stop(2);
  const earlyFirst = make();
  for (let t: number = 1; t <= 1.5; t += 1 / 24) earlyFirst.end(t);
  const earlyStop: number | undefined = earlyFirst.stop(2);
  const crossing: number = superposeMinimumJerk(origin, straight, lateStop ?? 0)
    .position.z;
  let deepest: number = -Infinity;
  for (let t: number = 1; t <= 1.7; t += 0.002)
    deepest = Math.max(deepest, lateFirst.end(t).z - wall);
  TestValidator.predicate(
    "stops on the wall in either order",
    lateStop !== undefined &&
      lateStop === earlyStop &&
      lateStop < 1.3 &&
      Math.abs(crossing - wall) < 1e-6 &&
      deepest <= 1e-6 &&
      near(lateFirst.end(lateStop + StrikingStroke.DWELL + 0.36), back) &&
      near(
        lateFirst.end(lateStop + 0.5 * StrikingStroke.DWELL),
        lateFirst.end(lateStop),
      ),
  );

  const capsule: StrikingContact.ICollider = {
    kind: "capsule",
    name: "c",
    a: { x: 0, y: 0, z: 0 },
    b: { x: 0, y: 1, z: 0 },
    radius: 0.1,
  };
  const sphere: StrikingContact.ICollider = {
    kind: "capsule",
    name: "s",
    a: { x: 2, y: 0, z: 0 },
    b: { x: 2, y: 0, z: 0 },
    radius: 0.2,
  };
  const box: StrikingContact.ICollider = {
    kind: "box",
    name: "b",
    centre: { x: 0, y: 0, z: 3 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
    halfExtents: { x: 0.5, y: 0.2, z: 0.1 },
  };
  TestValidator.predicate(
    "distances",
    Math.abs(
      StrikingContact.distance({ x: 0.5, y: 0.5, z: 0 }, capsule) - 0.4,
    ) < 1e-12 &&
      Math.abs(
        StrikingContact.distance({ x: 0, y: 1.5, z: 0 }, capsule) - 0.4,
      ) < 1e-12 &&
      Math.abs(StrikingContact.distance({ x: 2, y: 0, z: 0.5 }, sphere) - 0.3) <
        1e-12 &&
      Math.abs(StrikingContact.distance({ x: 0, y: 0, z: 3.8 }, box) - 0.3) <
        1e-9 &&
      Math.abs(StrikingContact.distance({ x: 0, y: 0, z: 3.3 }, box) + 0.1) <
        1e-9 &&
      Math.abs(StrikingContact.distance({ x: 0.3, y: 0, z: 3 }, box) - 0.2) <
        1e-9 &&
      StrikingContact.nearest({ x: 1.7, y: 0, z: 0 }, [capsule, sphere, box])
        ?.name === "s",
  );
  const crossed: number | undefined = StrikingContact.first(
    (t: number): number => 0.37 - t,
    0,
    1,
    0.1,
  );
  TestValidator.predicate(
    "first crossing",
    crossed !== undefined &&
      Math.abs(crossed - 0.37) < 1e-6 &&
      StrikingContact.first((): number => 1, 0, 1, 0.1) === undefined,
  );
}

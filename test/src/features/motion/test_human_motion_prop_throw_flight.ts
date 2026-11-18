import { createDrinkware } from "@automovie/archetypes";
import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  throwObject,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A thrown prop rides the hand to the release, then flies the throw's own
 * path and comes to rest on the floor (#3479).
 *
 * Scenarios, the average man and the small woman, each throwing a mug
 * overarm with the right hand at a point 6 m ahead on the floor, then
 * standing:
 * 1. The throw publishes one launch of the mug, at the release, with the
 *    plan's launch velocity, and the mug has one flight.
 * 2. Until the release the mug keeps its offset in the hand: its distance
 *    to the hand's grip changes by at most 2 mm at ten instants.
 * 3. The mug enters the flight at release. The early, middle and late
 *    airborne positions match the independent constant-acceleration
 *    quadratic to within 1e-6 m, pinning all its coefficients.
 * 4. The flight's first launch velocity equals the throw's launch velocity
 *    within 1e-9 m/s.
 * 5. The flight ends on the floor (`ground`) and the mug rests there: at
 *    the film's end its origin is within 1 mm of the contact's height of
 *    zero.
 * 6. It rests within 0.1 m of the aim point on the floor plan (the throw's
 *    dispersion is zero at a fixed seed and trained skill) — provisional
 *    bound #3479 names.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Throws a real mug archetype through the public chain and reads the displayed prop, the hand and the flights; a prop left at the release point, one that leaves the hand early, a flight off the throw's path or one that sinks through the floor fails.
 * @evidence contracts/development/testing.md#independent-expectations Integrating constant terrestrial gravity from the published launch state gives an independent quadratic oracle. The release clock and zero-height floor pin the phase boundaries. The 2 mm, 1e-6 m and 0.1 m are #3479's bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies; held, flying and at rest.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory, reads the ten held-prop observations, three airborne nodes and the floor endpoint on each.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the six numbered scenarios with their bounds.
 */
export function test_human_motion_prop_throw_flight(): void {
  const mug: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "mug",
  });
  const aim: IAutoMovieVector3 = { x: 0, y: 0, z: 6 };
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    let performance: IAutoMovieMotionHumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "throw",
        props: [
          HumanObject.prop("mug", mug, {
            at: { x: -0.25, y: 0.9, z: 0.35 },
            yaw: 0,
          }),
        ],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .pickUp({ prop: "mug", handle: "handle" })
          .throwObject({
            at: { kind: "point", frame: "world", at: aim },
            prop: "mug",
          })
          .stand({ seconds: 3 }).node,
      });
    } catch (error) {
      TestValidator.predicate(
        `${name}: the throw plans (${error instanceof Error ? error.message : String(error)})`,
        false,
      );
      continue;
    }
    const segment = performance.segments("a")[1]!;
    const launch = throwObject.of(segment.plan)!;
    const launches = segment.plan.launches ?? [];
    TestValidator.predicate(
      `${name}: one launch of the mug at the release`,
      launches.length === 1 &&
        launches[0]!.prop === "mug" &&
        Math.abs(launches[0]!.seconds - launch.seconds) <= 1e-12,
    );
    const flights = performance.flights("mug");
    TestValidator.predicate(
      `${name}: the mug has one flight`,
      flights.length === 1,
    );
    if (flights.length !== 1) continue;
    const flight = flights[0]!;

    // 2. Held to the release.
    const release: number = segment.start + launch.seconds;
    const grip = (t: number): number =>
      Vector3.length(
        Vector3.subtract(
          performance.prop("mug", t).position,
          performance.bones("a", t).get("rightHand")!.worldPosition,
        ),
      );
    const first: number = grip(segment.start + 0.01);
    let drift: number = 0;
    for (let k: number = 1; k <= 10; k++)
      drift = Math.max(
        drift,
        Math.abs(
          grip(segment.start + ((release - segment.start) * k) / 10 - 1e-4) -
            first,
        ),
      );
    TestValidator.predicate(
      `${name}: the mug rides the hand to the release (${(1000 * drift).toFixed(2)} mm)`,
      drift <= 2e-3,
    );

    // 3. The flight's path.
    TestValidator.predicate(
      `${name}: the flight begins at the release and uses the ballistic branch`,
      Math.abs(flight.launch - release) <= 1e-12 &&
        flight.projectile.drag === undefined,
    );
    let off: number = 0;
    const end: number = Math.min(flight.end, performance.duration);
    TestValidator.predicate(
      `${name}: the airborne interval is nonempty`,
      end > flight.launch,
    );
    const { origin, velocity } = flight.projectile;
    // Three distinct original nodes determine a quadratic per coordinate.
    for (const k of [1, 11, 20]) {
      const t: number = flight.launch + ((end - flight.launch) * k) / 21;
      const dt: number = t - release;
      const expected: IAutoMovieVector3 = {
        x: origin.x + velocity.x * dt,
        y:
          origin.y +
          velocity.y * dt -
          (AutoMovieGravity.STANDARD * dt ** 2) / 2,
        z: origin.z + velocity.z * dt,
      };
      off = Math.max(
        off,
        Vector3.length(
          Vector3.subtract(performance.prop("mug", t).position, expected),
        ),
      );
    }
    TestValidator.predicate(
      `${name}: the mug flies its flight (${off.toExponential(2)} m)`,
      off <= 1e-6,
    );

    // 4. The throw's velocity.
    TestValidator.predicate(
      `${name}: the flight leaves with the throw's velocity`,
      Vector3.length(
        Vector3.subtract(flight.projectile.velocity, launch.velocity),
      ) <= 1e-9 &&
        Vector3.length(
          Vector3.subtract(flight.projectile.gravity, AutoMovieGravity.DOWN),
        ) === 0,
    );

    // 5 and 6. At rest on the floor near the aim.
    const rest: IAutoMovieVector3 = performance.prop(
      "mug",
      performance.duration,
    ).position;
    TestValidator.predicate(
      `${name}: the flight ends on the floor`,
      flight.contact?.struck.kind === "ground" && Math.abs(rest.y) <= 1e-3,
    );
    TestValidator.predicate(
      `${name}: it rests near the aim (${Math.hypot(rest.x - aim.x, rest.z - aim.z).toFixed(3)} m)`,
      Math.hypot(rest.x - aim.x, rest.z - aim.z) <= 0.1,
    );
  }
}

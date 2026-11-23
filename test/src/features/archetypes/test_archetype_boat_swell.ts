import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeCourse,
  type AutoMovieArchetypeRide,
  AutoMovieArchetypeSea,
  createBoat,
  rowBoat,
} from "@automovie/archetypes";
import type { IAutoMovieTransform } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A seeded sea gives one surface for one seed and second, inside the amplitudes its spectrum allows, and a boat rides it.
 *
 * Scenarios:
 * 1. Two seas of the same height, heading and seed give the same elevation and slope at every point and second read; another seed gives another surface.
 * 2. The components' variance is the Pierson-Moskowitz spectrum's over its band: four times the root of the summed squared amplitudes over two is within 2 percent of the significant height asked for (WMO-No. 702, Hm0 = 4 times the root of the zeroth moment), the band holding nearly all the energy.
 * 3. Through a minute the elevation never exceeds the summed amplitudes and the slope never the summed amplitude-wavenumber products.
 * 4. A rowboat rowed 20 m on that sea at 1.5 m/s, already at that speed when the course begins and still at it when it ends, so no rate of speeding up or slowing enters, heaves by the elevation under its root, and pitches and rolls inside the steepest slope's angle; on a calm sea of zero height it does not move off still water.
 *
 * The sea is the top of the WMO sea state code's slight band, 1.25 m significant height.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds seas and a floating ride and reads them across points and seconds; a sea depending on anything but its seed and second, one off its spectrum, a surface beyond its bounds, or a boat not following it is caught.
 * @evidence contracts/development/testing.md#independent-expectations The significant height from the zeroth moment is WMO-No. 702's relation, worked here from the components; the bounds are the triangle inequality on a sum of sinusoids.
 * @evidence contracts/development/testing.md#distinguishing-cases A slight sea, two seeds, a calm sea, a still and a floating ride.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_boat_swell(): void {
  const findings: string[] = [];
  // The top of the WMO sea state code's slight band, 0.5 to 1.25 m significant height.
  const options: AutoMovieArchetypeSea.IOptions = { height: 1.25, seed: 7 };
  const sea: AutoMovieArchetypeSea.ISea = AutoMovieArchetypeSea.of(options);
  const again: AutoMovieArchetypeSea.ISea = AutoMovieArchetypeSea.of(options);
  const other: AutoMovieArchetypeSea.ISea = AutoMovieArchetypeSea.of({
    ...options,
    seed: 8,
  });
  let differs: boolean = false;
  for (let seconds: number = 0; seconds < 60; seconds += 0.37)
    for (const [x, z] of [
      [0, 0],
      [3, -5],
      [-12, 20],
    ] as const) {
      const e: number = sea.elevation(x, z, seconds);
      const s: { x: number; z: number } = sea.slope(x, z, seconds);
      if (
        e !== again.elevation(x, z, seconds) ||
        s.x !== again.slope(x, z, seconds).x ||
        s.z !== again.slope(x, z, seconds).z
      )
        findings.push(`the sea differs from itself at ${seconds} s`);
      if (e !== other.elevation(x, z, seconds)) differs = true;
      if (Math.abs(e) > sea.crest)
        findings.push(`the elevation ${e} m passes the crest ${sea.crest} m`);
      if (Math.hypot(s.x, s.z) > sea.steepest)
        findings.push(`the slope passes the steepest ${sea.steepest}`);
    }
  if (!differs) findings.push("another seed gave the same surface");
  const m0: number = sea.components.reduce(
    (sum: number, c: AutoMovieArchetypeSea.IComponent): number =>
      sum + (c.amplitude * c.amplitude) / 2,
    0,
  );
  if (Math.abs(4 * Math.sqrt(m0) - options.height) > 0.02 * options.height)
    findings.push(
      `the components give a significant height of ${4 * Math.sqrt(m0)} m`,
    );

  // A boat on it.
  const boat: AutoMovieArchetype<createBoat.Affordance, createBoat.Dimension> =
    createBoat({ kind: "rowboat" }, 2);
  const course: AutoMovieArchetypeCourse.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 20 }],
    cruise: 1.5,
    startSpeed: 1.5,
    endSpeed: 1.5,
  };
  const still: AutoMovieArchetypeRide.IRide<
    createBoat.Affordance,
    createBoat.Dimension
  > = rowBoat(boat, course);
  const floating: AutoMovieArchetypeRide.IRide<
    createBoat.Affordance,
    createBoat.Dimension
  > = rowBoat(boat, course, { sea: options });
  const calm: AutoMovieArchetypeRide.IRide<
    createBoat.Affordance,
    createBoat.Dimension
  > = rowBoat(boat, course, { sea: { height: 0, seed: 7 } });
  for (let seconds: number = 0; seconds < still.duration; seconds += 0.5) {
    const base: IAutoMovieTransform = still.at(seconds).placement;
    const moved: IAutoMovieTransform = floating.at(seconds).placement;
    const heave: number = moved.translation.y - base.translation.y;
    if (
      Math.abs(
        heave - sea.elevation(base.translation.x, base.translation.z, seconds),
      ) > 1e-9
    )
      findings.push(`the boat does not heave with the sea at ${seconds} s`);
    const tilt: number =
      2 *
      Math.acos(
        Math.min(
          1,
          Math.abs(
            moved.rotation.w * base.rotation.w +
              moved.rotation.x * base.rotation.x +
              moved.rotation.y * base.rotation.y +
              moved.rotation.z * base.rotation.z,
          ),
        ),
      );
    if (tilt > Math.SQRT2 * Math.atan(sea.steepest) + 1e-9)
      findings.push(`the boat tilts ${tilt} rad at ${seconds} s`);
    const level: IAutoMovieTransform = calm.at(seconds).placement;
    if (
      Math.abs(level.translation.y - base.translation.y) > 0 ||
      Math.abs(level.rotation.w - base.rotation.w) > 1e-12
    )
      findings.push(`a calm sea moved the boat at ${seconds} s`);
  }
  TestValidator.equals(
    "the sea is seeded and bounded and the boat rides it",
    findings,
    [],
  );
}

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  AutoMovieArchetypeSea,
  createBoat,
  rowBoat,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A floating support follows the actual surface normal for every heading, and
 * sea construction admits only finite, representable spectra.
 *
 * Scenarios:
 *
 * 1. An actual rowboat at headings 0, 37, 90 and -120 degrees floats on authored
 *    local planes with flat, axial and signed oblique gradients. Its up axis
 *    equals normalize(-dx,1,-dz), its forward tangent retains the course
 *    heading, and its handles follow that same rigid frame.
 * 2. Sampling out of order leaves the actual source ride untouched; calm water
 *    leaves every source axis and translation unchanged.
 * 3. A real seeded spectrum at heights 1e-200, 1.25 and 1e200 has finite positive
 *    components, obeys deep-water dispersion and recovers Hm0 within the
 *    existing two-percent quadrature allowance after scaling.
 * 4. Full-turn and very large finite headings produce their reduced direction.
 *    Negative/nonfinite heights, nonfinite headings and unrepresentable
 *    endpoint spectra are structured parameter refusals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the independent plane normal, source ownership, spectrum similarity, scalar admission and numerical endpoint scenarios. Local plane fixtures isolate rigid-frame arithmetic and make no measured sea-state claim.
 * @evidence contracts/development/testing.md#behavioral-verification Floats an actual public rowboat, reads its axes and handle frames, then constructs actual seeded seas and exercises input refusals. Detects the missing pitch/roll coupling, altered source samples, invalid spectral arithmetic and nonfinite headings.
 * @evidence contracts/development/testing.md#independent-expectations A plane y=dx*x+dz*z+c has normal (-dx,1,-dz); a tangent retains its horizontal heading and has vertical rise dx*forwardX+dz*forwardZ. Deep-water dispersion is omega squared=g*k and WMO-No.702 defines Hm0=4sqrt(m0), with m0=sum(A squared/2). The peak-relative spectrum scales frequency by H^-1/2, wavenumber by H^-1 and amplitude by H; expectations do not call Sea.motion or replay its rotation formula.
 * @evidence contracts/development/testing.md#distinguishing-cases Flat, single-axis, both oblique signs, four support headings, three time orders, real finite spectra across 400 decimal orders, periodic angles and structured invalid/representation boundaries. Boat stroke geometry and measured spectrum quadrature remain covered by boat_oars and boat_swell.
 * @evidence contracts/development/testing.md#execution-ownership One discovered portable unit uses in-memory public producers and explicit local surface inputs; it starts no viewer, process, compiler or render host and replaces no foreign method.
 */
export function test_archetype_sea_surface_frame(): void {
  const findings: string[] = [];
  const boat: AutoMovieArchetype<createBoat.Affordance, createBoat.Dimension> =
    createBoat({ kind: "rowboat" }, 19);
  const axes: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];

  for (const heading of [0, 37, 90, -120]) {
    const course: AutoMovieArchetypeCourse.ICourse = {
      start: { x: 1, z: -2, heading },
      legs: [{ kind: "straight", length: 6 }],
      cruise: 1.5,
      startSpeed: 1.5,
      endSpeed: 1.5,
    };
    const source: AutoMovieArchetypeRide.IRide<
      createBoat.Affordance,
      createBoat.Dimension
    > = rowBoat(boat, course);
    const before: AutoMovieArchetypeRide.ISample<
      createBoat.Affordance,
      createBoat.Dimension
    > = source.at(1);
    for (const [dx, dz] of [
      [0, 0],
      [0.4, 0],
      [0, -0.3],
      [0.6, -0.8],
      [-0.6, 0.8],
    ] as const) {
      const surface: AutoMovieArchetypeSea.ISea = {
        heading: 0,
        components: [],
        crest: Infinity,
        steepest: Math.hypot(dx, dz),
        elevation: (x: number, z: number, seconds: number): number =>
          2 + dx * x + dz * z + seconds / 5,
        slope: (): { x: number; z: number } => ({ x: dx, z: dz }),
      };
      const floating: AutoMovieArchetypeRide.IRide<
        createBoat.Affordance,
        createBoat.Dimension
      > = AutoMovieArchetypeSea.float(source, surface);
      const length: number = Math.hypot(dx, 1, dz);
      const normal: IAutoMovieVector3 = {
        x: -dx / length,
        y: 1 / length,
        z: -dz / length,
      };
      for (const seconds of [2, 0, 1, 2]) {
        const base: IAutoMovieTransform = source.at(seconds).placement;
        const sample: AutoMovieArchetypeRide.ISample<
          createBoat.Affordance,
          createBoat.Dimension
        > = floating.at(seconds);
        const moved: IAutoMovieTransform = sample.placement;
        const label: string = `${heading} degrees, (${dx},${dz}) at ${seconds}`;
        if (!vector(AutoMovieArchetypeFrame.axis(moved, "y"), normal))
          findings.push(`${label}: the support misses the plane normal`);
        const forward: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
          moved,
          "z",
        );
        const original: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
          base,
          "z",
        );
        const horizontal: number = Math.hypot(forward.x, forward.z);
        if (
          !near(forward.x / horizontal, original.x) ||
          !near(forward.z / horizontal, original.z) ||
          !near(forward.y, dx * forward.x + dz * forward.z)
        )
          findings.push(
            `${label}: the forward axis leaves its heading or plane`,
          );
        const point: IAutoMovieVector3 = base.translation;
        if (
          !near(moved.translation.x, point.x) ||
          !near(moved.translation.z, point.z) ||
          !near(
            moved.translation.y,
            point.y + 2 + dx * point.x + dz * point.z + seconds / 5,
          )
        )
          findings.push(`${label}: the root misses the local elevation`);
        if (!vector(sample.course.placement.translation, moved.translation))
          findings.push(`${label}: the course publishes another placement`);

        // The handle's declared local frame and the actual root define its world frame.
        const local: IAutoMovieTransform =
          sample.archetype.affordance("leftHandle").frame;
        const offset: IAutoMovieVector3 = Quaternion.rotateVector(
          moved.rotation,
          local.translation,
        );
        const frame: IAutoMovieTransform = floating.frame(
          "leftHandle",
          seconds,
        );
        if (
          !vector(frame.translation, {
            x: moved.translation.x + offset.x,
            y: moved.translation.y + offset.y,
            z: moved.translation.z + offset.z,
          })
        )
          findings.push(`${label}: the actual handle leaves the floating root`);
      }
    }
    const after: AutoMovieArchetypeRide.ISample<
      createBoat.Affordance,
      createBoat.Dimension
    > = source.at(1);
    const calm: IAutoMovieTransform = AutoMovieArchetypeSea.float(
      source,
      AutoMovieArchetypeSea.of({ height: 0, seed: 19 }),
    ).at(1).placement;
    if (!vector(before.placement.translation, after.placement.translation))
      findings.push(`${heading}: floating mutated the source placement`);
    for (const axis of axes)
      if (
        !vector(
          AutoMovieArchetypeFrame.axis(before.placement, axis),
          AutoMovieArchetypeFrame.axis(after.placement, axis),
        ) ||
        !vector(
          AutoMovieArchetypeFrame.axis(before.placement, axis),
          AutoMovieArchetypeFrame.axis(calm, axis),
        )
      )
        findings.push(`${heading}: floating mutated a source or calm axis`);
    if (!vector(before.placement.translation, calm.translation))
      findings.push(`${heading}: calm water translated the source`);
  }

  const reference: AutoMovieArchetypeSea.ISea = AutoMovieArchetypeSea.of({
    height: 1,
    seed: 9,
  });
  for (const height of [1e-200, 1.25, 1e200]) {
    const sea: AutoMovieArchetypeSea.ISea = AutoMovieArchetypeSea.of({
      height,
      seed: 9,
    });
    const normalized: number[] = [];
    for (let k: number = 0; k < sea.components.length; k++) {
      const c: AutoMovieArchetypeSea.IComponent = sea.components[k]!;
      const base: AutoMovieArchetypeSea.IComponent = reference.components[k]!;
      if (
        ![c.frequency, c.wavenumber, c.amplitude].every(
          (value: number): boolean => value > 0,
        ) ||
        !near(c.frequency * Math.sqrt(height), base.frequency) ||
        !near(c.wavenumber * height, base.wavenumber) ||
        !near(c.amplitude / height, base.amplitude) ||
        !near(
          (Math.sqrt(c.wavenumber) * Math.sqrt(9.80665)) /
            (2 * Math.PI * c.frequency),
          1,
        )
      )
        findings.push(`${height}: component ${k} violates spectrum similarity`);
      normalized.push(c.amplitude / height);
    }
    if (!(Math.abs((4 * Math.hypot(...normalized)) / Math.SQRT2 - 1) <= 0.02))
      findings.push(`${height}: invalid spectrum bounds or significant height`);
  }

  for (const heading of [45, 405, -315, Number.MAX_VALUE]) {
    const sea: AutoMovieArchetypeSea.ISea = AutoMovieArchetypeSea.of({
      height: 1.25,
      heading,
      seed: 3,
    });
    const reduced: AutoMovieArchetypeSea.ISea = AutoMovieArchetypeSea.of({
      height: 1.25,
      heading: heading % 360,
      seed: 3,
    });
    if (
      !near(sea.elevation(2, -3, 0.5), reduced.elevation(2, -3, 0.5)) ||
      !near(sea.slope(2, -3, 0.5).x, reduced.slope(2, -3, 0.5).x) ||
      !near(sea.slope(2, -3, 0.5).z, reduced.slope(2, -3, 0.5).z)
    )
      findings.push(`${heading}: heading reduction changes the surface`);
  }
  for (const height of [
    -1,
    NaN,
    Infinity,
    -Infinity,
    Number.MIN_VALUE,
    Number.MAX_VALUE,
  ])
    refused({ height, seed: 1 }, "height");
  for (const heading of [NaN, Infinity, -Infinity, null, "0"])
    refused(
      { height: 1.25, heading, seed: 1 } as AutoMovieArchetypeSea.IOptions,
      "heading",
    );
  TestValidator.equals("floating roots match their sea surface", findings, []);

  /** Finite-safe comparison keeps NaN from satisfying any geometry assertion. */
  function near(actual: number, expected: number): boolean {
    return (
      Math.abs(actual - expected) <= 1e-11 * Math.max(1, Math.abs(expected))
    );
  }

  /**
   * Independent coordinates compare a measured axis or point with its geometric
   * oracle.
   */
  function vector(
    actual: IAutoMovieVector3,
    expected: IAutoMovieVector3,
  ): boolean {
    return (
      near(actual.x, expected.x) &&
      near(actual.y, expected.y) &&
      near(actual.z, expected.z)
    );
  }

  /**
   * Every invalid scalar must identify its actual input axis through the public
   * refusal.
   */
  function refused(
    options: AutoMovieArchetypeSea.IOptions,
    axis: "height" | "heading",
  ): void {
    try {
      AutoMovieArchetypeSea.of(options);
      findings.push(`${axis} ${String(options[axis])} was accepted`);
    } catch (error) {
      if (
        !(
          error instanceof AutoMovieArchetypeRefusal &&
          error.kind === "parameter" &&
          error.axis === axis
        )
      )
        findings.push(`${axis} failed without its structured refusal`);
    }
  }
}

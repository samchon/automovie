import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeMass,
} from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * A rounded scalar part mass does not replace its unrounded allocation in a
 * body's intrinsic or parallel-axis inertia contributions.
 *
 * Scenarios:
 * 1. With total mass M=2^-600, a unit cube of share W=2^600 and a concentric
 *    cube of side L=2^300/share1 have intrinsic moments M/3. The large cube's
 *    scalar mass rounds to zero, but its moment contributes M/6. Total mass1
 *    is the ordinary-scale control; both part orders have the same result.
 * 2. Placing that large cube at (L,0,0) adds M to the Y/Z moments. Placing it
 *    at (L,L,L) adds 2M to each diagonal and -M to each cross component.
 *    Their common-centre coordinates are 2^-300 on displaced axes.
 * 3. Shares 2^475:3 and cube sides 1:2^237 produce intrinsic moment 5M/12.
 *    The second scalar mass is 3*2^-1075, rounded to 2*MIN_VALUE, whose use
 *    as an inertia operand would instead give M/2: a 20 percent error.
 * 4. A singleton cube of side2 and exact MIN_VALUE mass remains supported;
 *    its final (2/3)*MIN_VALUE moments round to MIN_VALUE.
 * 5. An implicit volume-density weight must be locally representable before
 *    allocation. Cubes with volumes MIN and 3*MIN at density .5 refuse their
 *    zero/inexact subnormal weights. Exact MIN*1 and 2*MIN*.5 remain valid,
 *    and an explicitly authored zero share still means massless geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States authored dimensions, relative weights, total mass, SI tensor components, ordinary controls and binary64 scalar versus aggregate boundaries without material-derived measurements.
 * @evidence contracts/development/testing.md#behavioral-verification Uses real Builder.build, AutoMovieArchetype.properties and public Mass.parts. Positive allocations rounded to zero or a nonzero subnormal still contribute their physical geometry to the aggregate. Observing scalar outputs separately prevents hiding the defect by changing parts or refusing all small masses.
 * @evidence contracts/development/testing.md#independent-expectations A cube's central moment is m*squaredSide/6. For W=L squared=2^600, the two intrinsic contributions sum to M*W/[3*(W+1)], which rounds to M/3. Their reduced-mass parallel-axis contribution on each displaced coordinate is M*W*L squared/(W+1) squared, which rounds to M; equal coordinate offsets give negative cross moments. For shares 2^475:3 and squared side2^474, intrinsic contributions approach M/6+M/4=5M/12, with corrections far below one ulp. Expectations do not multiply the rounded scalar part masses. For local weight controls, volume MIN at x=2^1023 contributes centre 2^-51 and a transverse moment 2^972 under unit total mass; this is a pre-allocation local datum whose inexact representation is refused, not a rounded scalar part mass whose aggregate moment must be recovered. Tensor and centre observations are divided by their known physical scale before nclose, so tiny results cannot pass an absolute tolerance vacuously.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers zero and nonzero subnormal scalar allocations, concentric and displaced solids, positive diagonal and negative cross components, both input orders, ordinary total mass, separately observed part masses, an exact least-positive singleton, implicit zero/inexact subnormal refusal versus exact local weights, and authored zero shares. Existing mass_numeric owns invalid/local-primitive representability refusal.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous portable unit owns its synthetic builders and uses public outputs and the shared finite-aware nclose helper; no private arithmetic, patched method, compiler, process or renderer is invoked.
 */
export function test_archetype_mass_allocation_numeric(): void {
  const findings: string[] = [];
  const small: number = 2 ** -600;
  const length: number = 2 ** 300;
  const coordinate: number = 2 ** -300;
  const layouts: readonly {
    offset: IAutoMovieVector3;
    centre: IAutoMovieVector3;
    inertia: AutoMovieArchetypeMass.IInertia;
  }[] = [
    {
      offset: { x: 0, y: 0, z: 0 },
      centre: { x: 0, y: 0, z: 0 },
      inertia: { xx: 1 / 3, yy: 1 / 3, zz: 1 / 3, xy: 0, xz: 0, yz: 0 },
    },
    {
      offset: { x: length, y: 0, z: 0 },
      centre: { x: 1, y: 0, z: 0 },
      inertia: { xx: 1 / 3, yy: 4 / 3, zz: 4 / 3, xy: 0, xz: 0, yz: 0 },
    },
    {
      offset: { x: length, y: length, z: length },
      centre: { x: 1, y: 1, z: 1 },
      inertia: { xx: 7 / 3, yy: 7 / 3, zz: 7 / 3, xy: -1, xz: -1, yz: -1 },
    },
  ];
  for (const mass of [small, 1])
    for (const reverse of [false, true]) {
      for (const layout of layouts) {
        const made: AutoMovieArchetype<never, never> = make(
          mass,
          2 ** 600,
          1,
          length,
          layout.offset,
          reverse,
        );
        observe(
          made.properties,
          mass,
          layout.inertia,
          "zero-allocation moment",
        );
        for (const axis of ["x", "y", "z"] as const)
          if (
            !nclose(
              made.properties.centerOfMass[axis] / coordinate,
              layout.centre[axis],
              1e-12,
            )
          )
            findings.push(
              "the centre and tensor used different mass distributions",
            );
        const scalar: Record<string, number> = AutoMovieArchetypeMass.parts(
          made.parts,
          mass,
          {},
          { a: 2 ** 600, b: 1 },
        );
        if (
          !nclose(scalar.a ?? NaN, mass, 0) ||
          !nclose(scalar.b ?? NaN, mass === small ? 0 : 2 ** -600, 0)
        )
          findings.push(
            "aggregate recovery changed independently rounded scalar part masses",
          );
      }
      const rounded: AutoMovieArchetype<never, never> = make(
        mass,
        2 ** 475,
        3,
        2 ** 237,
        { x: 0, y: 0, z: 0 },
        reverse,
      );
      observe(
        rounded.properties,
        mass,
        { xx: 5 / 12, yy: 5 / 12, zz: 5 / 12, xy: 0, xz: 0, yz: 0 },
        "nonzero-subnormal allocation moment",
      );
      const scalar: Record<string, number> = AutoMovieArchetypeMass.parts(
        rounded.parts,
        mass,
        {},
        { a: 2 ** 475, b: 3 },
      );
      if (
        !nclose(
          scalar.b ?? NaN,
          mass === small ? 2 * Number.MIN_VALUE : 3 * 2 ** -475,
          0,
        )
      )
        findings.push(
          "the subnormal scalar mass no longer follows final binary64 rounding",
        );
    }

  const singleton: AutoMovieArchetype<never, never> = builder()
    .box("only", { x: 2, y: 2, z: 2 }, { x: 0, y: 0, z: 0 })
    .build(Number.MIN_VALUE);
  observe(
    singleton.properties,
    Number.MIN_VALUE,
    { xx: 1, yy: 1, zz: 1, xy: 0, xz: 0, yz: 0 },
    "exact subnormal singleton",
  );

  // The implicit positive local weight precedes both aggregate and scalar allocation.
  for (const factor of [1, 3]) {
    const specimen: AutoMovieArchetype<never, never> = localSpecimen(factor, 1);
    const readers: readonly (() => unknown)[] = [
      (): AutoMovieArchetype<never, never> => localSpecimen(factor, 0.5),
      (): AutoMovieArchetypeMass.IProperties =>
        AutoMovieArchetypeMass.of(specimen.parts, 1, { b: 0.5 }),
      (): Record<string, number> =>
        AutoMovieArchetypeMass.parts(specimen.parts, 1, { b: 0.5 }),
    ];
    for (const read of readers) {
      let refused: boolean = false;
      try {
        read();
      } catch (error) {
        refused =
          error instanceof Error &&
          error.message.includes("Part b") &&
          error.message.includes("positive local volume-density product");
      }
      if (!refused)
        findings.push(
          "a positive implicit local weight lost subnormal precision before admission",
        );
    }
  }
  for (const [factor, relative] of [
    [1, 1],
    [2, 0.5],
  ] as const) {
    const specimen: AutoMovieArchetype<never, never> = localSpecimen(
      factor,
      relative,
    );
    const actual: AutoMovieArchetypeMass.IProperties = specimen.properties;
    const scalar: Record<string, number> = AutoMovieArchetypeMass.parts(
      specimen.parts,
      1,
      { b: relative },
    );
    if (
      !nclose(actual.centerOfMass.x / 2 ** -51, 1, 1e-12) ||
      !nclose(actual.inertia.yy / 2 ** 972, 1, 1e-12) ||
      !nclose(actual.inertia.zz / 2 ** 972, 1, 1e-12) ||
      !nclose(scalar.b ?? NaN, Number.MIN_VALUE, 0)
    )
      findings.push(
        "an exactly represented subnormal local weight was refused or changed",
      );
  }
  const massless: AutoMovieArchetype<never, never> = localSpecimen(
    1,
    0.5,
    true,
  );
  const masslessParts: Record<string, number> = AutoMovieArchetypeMass.parts(
    massless.parts,
    1,
    { b: 0.5 },
    { b: 0 },
  );
  if (
    !nclose(massless.properties.centerOfMass.x, 0, 0) ||
    !nclose(massless.properties.inertia.yy, 1 / 6, 1e-12) ||
    !nclose(masslessParts.b ?? NaN, 0, 0)
  )
    findings.push(
      "an authored zero share was mistaken for failed implicit weight arithmetic",
    );
  TestValidator.equals(
    "aggregate inertia preserves unrounded mass allocations",
    findings,
    [],
  );

  /** A scale-free observation catches both finite-value loss and NaN/Infinity. */
  function observe(
    actual: AutoMovieArchetypeMass.IProperties,
    mass: number,
    expected: AutoMovieArchetypeMass.IInertia,
    label: string,
  ): void {
    if (!nclose(actual.mass, mass, 0))
      findings.push(`${label}: total mass changed`);
    for (const component of ["xx", "yy", "zz", "xy", "xz", "yz"] as const)
      if (!nclose(actual.inertia[component] / mass, expected[component], 1e-12))
        findings.push(
          `${label}: ${component} lost its independent physical expectation`,
        );
  }

  /** Two independently dimensioned uniform cubes, with caller-authored shares. */
  function make(
    mass: number,
    shareA: number,
    shareB: number,
    side: number,
    offset: IAutoMovieVector3,
    reverse: boolean,
  ): AutoMovieArchetype<never, never> {
    const entries: {
      id: string;
      side: number;
      centre: IAutoMovieVector3;
      share: number;
    }[] = [
      { id: "a", side: 1, centre: { x: 0, y: 0, z: 0 }, share: shareA },
      { id: "b", side, centre: offset, share: shareB },
    ];
    if (reverse) entries.reverse();
    const made: AutoMovieArchetypeBuilder<never, never> = builder();
    for (const entry of entries)
      made.box(
        entry.id,
        { x: entry.side, y: entry.side, z: entry.side },
        entry.centre,
        { share: entry.share },
      );
    return made.build(mass);
  }

  /** A positive local volume and distant lever expose any lost implicit weight. */
  function localSpecimen(
    factor: number,
    relative: number,
    zero: boolean = false,
  ): AutoMovieArchetype<never, never> {
    const side: number = 2 ** -358;
    return builder()
      .box("a", { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 })
      .box(
        "b",
        { x: factor * side, y: side, z: side },
        { x: 2 ** 1023, y: 0, z: 0 },
        { density: relative, ...(zero ? { share: 0 } : {}) },
      )
      .build(1);
  }
  /** Neutral authored geometry, with no empirical material or restitution claim. */
  function builder(): AutoMovieArchetypeBuilder<never, never> {
    return new AutoMovieArchetypeBuilder<never, never>({
      name: "allocation inertia fixture",
      material: "composite",
      draw: new AutoMovieArchetypeDrawSession<never>(
        "allocation-inertia-fixture",
        {},
        undefined,
      ),
    });
  }
}

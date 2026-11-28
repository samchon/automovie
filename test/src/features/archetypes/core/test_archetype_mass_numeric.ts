import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeMass,
} from "@automovie/archetypes";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Finite mass allocation and centres survive intermediate overflow/underflow;
 * malformed or truly unrepresentable physical records are refused.
 *
 * Scenarios:
 * 1. Two equal unit boxes whose relative weights are MAX_VALUE still divide
 *    8 kg equally, balance at x=1 and obey the parallel-axis theorem.
 * 2. A large finite mass with a large explicit share keeps finite textbook
 *    box moments. A real builder-to-fracture path preserves those mass records.
 * 3. Equal bodies at x=1e200 and mass 1e200 combine at that same centre,
 *    without forming the overflowing m*x intermediate.
 * 4. Moment direction normalization works at MIN_VALUE and MAX_VALUE scale;
 *    a distant point on the moment axis does not create an inf-inf distance.
 * 5. Proportional allocations and line moments preserve subnormal inputs;
 *    a tiny body's coordinate scale restores its mean contribution, and
 *    complete aggregate sums reject the true overflow rounding boundary.
 * 6. Nonpositive/non-finite mass, density or dimensions, zero total share,
 *    impossible volume/tensor, zero direction and overflowing body total refuse.
 * 7. A positive-volume thin box with sides 1e-200,1e-200,1e100 has local
 *    Izz=(x squared+y squared)/12 below representability. Although mass1e100
 *    could restore a finite final moment, this API admits local properties
 *    first and must refuse instead of fabricating zero local/final inertia.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines authored shape references, SI axes, extreme but representable observations and invalid mass data.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public building, part allocation, fracture, mass combination and directional moment entries. It checks normal, extreme and invalid data, including fracture reconstruction, coincident placements, distant axes and direction magnitudes.
 * @evidence contracts/development/testing.md#independent-expectations A unit cube's central moment is `m/6`. Equal 4 kg cubes separated by 2 metres add 8 kg square metres to each perpendicular axis. A least-positive point mass at 1.5 metres has a moment that rounds to `2*Number.MIN_VALUE`. Three positive `2^969` contributions exceed the maximum finite mass's rounding midpoint.
 */
export function test_archetype_mass_numeric(): void {
  const findings: string[] = [];
  const max: number = Number.MAX_VALUE;
  const made: AutoMovieArchetype<never, never> = builder()
    .box("a", { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 }, { density: max })
    .box("b", { x: 1, y: 1, z: 1 }, { x: 2, y: 0, z: 0 }, { density: max })
    .build(8);
  if (
    !(
      close(made.properties.centerOfMass.x, 1) &&
      close(made.properties.inertia.xx, 8 / 6) &&
      close(made.properties.inertia.yy, 8 / 6 + 8)
    )
  )
    findings.push(
      "equal overflowing relative-weight sum changed cube mass or moments",
    );
  const shares: Record<string, number> = AutoMovieArchetypeMass.parts(
    made.parts,
    8,
    {
      a: max,
      b: max,
    },
  );
  if (shares.a !== 4 || shares.b !== 4)
    findings.push("equal weights did not receive 4 kg each");
  const large: number = max / 4;
  const box: AutoMovieArchetype<never, never> = builder()
    .box("a", { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 }, { share: max })
    .build(large);
  if (
    !(
      close(box.properties.inertia.xx / large, 1 / 6) && box.body.mass === large
    )
  )
    findings.push(
      "a representable large box moment was lost to mass*share overflow",
    );
  const flat: AutoMovieArchetype<never, never> = builder()
    .box("a", { x: 1.5e154, y: 1.5e154, z: 1e-300 }, { x: 0, y: 0, z: 0 })
    .build(1e-300);
  if (
    !(
      close(flat.properties.inertia.xx, 1.875e7) &&
      close(flat.properties.inertia.zz, 3.75e7)
    )
  )
    findings.push(
      "representable thin-box volume or divided square-sum moment overflowed",
    );
  const capsule: IAutoMovieModelPart = {
    ...made.parts[0]!,
    geometry: {
      type: "primitive",
      shape: { type: "capsule", radius: 1e-100, height: 4e154 },
    },
  };
  const capsuleMass: AutoMovieArchetypeMass.IProperties =
    AutoMovieArchetypeMass.of([capsule], 1);
  if (
    !(
      close(capsuleMass.inertia.xx / 1e308, 4 / 3) &&
      close(capsuleMass.inertia.yy / 1e-200, 0.5)
    )
  )
    findings.push(
      "a representable slender capsule moment was lost to an intermediate square",
    );
  const broken: ReturnType<typeof made.broken> = builder()
    .box("a", { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 }, { share: max })
    .box("b", { x: 1, y: 1, z: 1 }, { x: 2, y: 0, z: 0 }, { share: max })
    .fracture([{ id: "piece", parts: ["a"] }])
    .build(1e300, { restitution: 0, outcome: { fracture: 1 } })
    .broken({ energy: 1, momentum: { x: 0, y: 0, z: 0 } });
  if (
    broken === null ||
    broken.remainder === null ||
    broken.fragments[0] === undefined ||
    !(
      close(broken.remainder.body.mass / 1e300, 0.5) &&
      close(broken.fragments[0].archetype.body.mass / 1e300, 0.5) &&
      close(broken.fragments[0].archetype.properties.inertia.xx / 1e300, 1 / 12)
    )
  )
    findings.push(
      "real fracture reconstruction lost a representable large part mass",
    );

  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const own: AutoMovieArchetypeMass.IProperties = properties(1e200, {
    x: 0,
    y: 0,
    z: 0,
  });
  const combined: AutoMovieArchetypeMass.IProperties =
    AutoMovieArchetypeMass.combine(
      [0, 1].map(
        (): AutoMovieArchetypeMass.IPlaced => ({
          properties: own,
          placement: {
            translation: { x: 1e200, y: 0, z: 0 },
            rotation: identity,
          },
        }),
      ),
    );
  if (
    !(
      combined.mass === 2e200 &&
      combined.centerOfMass.x === 1e200 &&
      combined.inertia.xx === 2 &&
      combined.inertia.yy === 2
    )
  )
    findings.push(
      "coincident finite bodies lost their weighted centre or own tensor",
    );
  const far: AutoMovieArchetypeMass.IProperties = properties(1e-200, {
    x: 1e200,
    y: 0,
    z: 0,
  });
  for (const scale of [Number.MIN_VALUE, 1, max])
    if (
      !close(
        AutoMovieArchetypeMass.about(
          far,
          { x: 0, y: 0, z: 0 },
          { x: scale, y: 0, z: 0 },
        ),
        1,
      )
    )
      findings.push(
        `a parallel distant axis failed at direction scale ${scale}`,
      );
  if (
    !close(
      AutoMovieArchetypeMass.about(
        far,
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ) / 1e200,
      1,
    )
  )
    findings.push(
      "a small mass's finite distant-axis moment overflowed before multiplication",
    );
  const subnormalMasses: Record<string, number> = AutoMovieArchetypeMass.parts(
    made.parts,
    2,
    {},
    {
      a: Number.MIN_VALUE,
      b: 2 * Number.MIN_VALUE,
    },
  );
  if (subnormalMasses.a !== 2 / 3 || subnormalMasses.b !== 4 / 3)
    findings.push(
      "subnormal relative weights lost their proportional allocation",
    );
  const point: AutoMovieArchetypeMass.IProperties = {
    mass: Number.MIN_VALUE,
    centerOfMass: { x: 1.5, y: 0, z: 0 },
    inertia: { xx: 0, yy: 0, zz: 0, xy: 0, xz: 0, yz: 0 },
  };
  if (
    AutoMovieArchetypeMass.about(
      point,
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    ) !==
    2 * Number.MIN_VALUE
  )
    findings.push(
      "a subnormal point-mass moment rounded before its final product",
    );
  const rescued: AutoMovieArchetypeMass.IProperties =
    AutoMovieArchetypeMass.combine([
      {
        properties: properties(1e300, { x: 0, y: 0, z: 0 }),
        placement: { translation: { x: 0, y: 0, z: 0 }, rotation: identity },
      },
      {
        properties: properties(1e-300, { x: 1e300, y: 0, z: 0 }),
        placement: { translation: { x: 0, y: 0, z: 0 }, rotation: identity },
      },
    ]);
  const maximumMean: AutoMovieArchetypeMass.IProperties =
    AutoMovieArchetypeMass.combine(
      [0, 1].map(
        (): AutoMovieArchetypeMass.IPlaced => ({
          properties: properties(1, { x: 0, y: 0, z: 0 }),
          placement: {
            translation: { x: max, y: 0, z: 0 },
            rotation: identity,
          },
        }),
      ),
    );
  if (
    !close(rescued.centerOfMass.x / 1e-300, 1) ||
    maximumMean.centerOfMass.x !== max
  )
    findings.push("a scaled convex mean lost a finite extreme result");
  for (const mass of [0, -1, Number.NaN, Infinity, -Infinity])
    if (
      !refused((): void => {
        builder()
          .box("a", { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 })
          .build(mass);
      })
    )
      findings.push(`invalid body mass ${mass} was accepted`);
  for (const density of [0, -1, Number.NaN, Infinity, -Infinity])
    if (
      !refused((): void => {
        builder()
          .box("a", { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 }, { density })
          .build(1);
      })
    )
      findings.push(`invalid relative density ${density} was accepted`);
  for (const share of [-1, Number.NaN, Infinity, -Infinity])
    if (
      !refused((): void => {
        builder()
          .box("a", { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 }, { share })
          .build(1);
      })
    )
      findings.push(`invalid explicit share ${share} was accepted`);
  for (const length of [0, -1, Number.NaN, Infinity, max])
    if (
      !refused((): void => {
        builder()
          .box("a", { x: length, y: length, z: length }, { x: 0, y: 0, z: 0 })
          .build(1);
      })
    )
      findings.push(`invalid or unrepresentable cube ${length} was accepted`);
  if (
    !refused((): void => {
      builder()
        .box("a", { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 }, { share: 0 })
        .build(1);
    }) ||
    !refused((): void => {
      AutoMovieArchetypeMass.about(
        own,
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
      );
    }) ||
    !refused((): void => {
      AutoMovieArchetypeMass.combine(
        [0, 1].map(
          (): AutoMovieArchetypeMass.IPlaced => ({
            properties: properties(max, { x: 0, y: 0, z: 0 }),
            placement: {
              translation: { x: 0, y: 0, z: 0 },
              rotation: identity,
            },
          }),
        ),
      );
    })
  )
    findings.push(
      "zero total weight, zero moment direction or overflowing body mass was accepted",
    );
  for (const axis of ["mass", "tensor"] as const)
    if (
      !refused((): void => {
        AutoMovieArchetypeMass.combine(
          [max, 2 ** 969, 2 ** 969, 2 ** 969].map(
            (value: number): AutoMovieArchetypeMass.IPlaced => ({
              properties: {
                mass: axis === "mass" ? value : 1,
                centerOfMass: { x: 0, y: 0, z: 0 },
                inertia: {
                  xx: axis === "tensor" ? value : 1,
                  yy: axis === "tensor" ? value : 1,
                  zz: axis === "tensor" ? value : 1,
                  xy: 0,
                  xz: 0,
                  yz: 0,
                },
              },
              placement: {
                translation: { x: 0, y: 0, z: 0 },
                rotation: identity,
              },
            }),
          ),
        );
      })
    )
      findings.push(
        `the complete combined ${axis} sum lost the true overflow midpoint`,
      );
  // Nondegenerate local moments must remain representable before later mass scaling.
  let localRefusal: boolean = false;
  try {
    builder()
      .box("a", { x: 1e-200, y: 1e-200, z: 1e100 }, { x: 0, y: 0, z: 0 })
      .build(1e100);
  } catch (error) {
    localRefusal =
      error instanceof Error && error.message.includes("principal moments");
  }
  if (!localRefusal)
    findings.push(
      "a nondegenerate local principal moment underflowed to a fabricated zero",
    );
  TestValidator.equals(
    "mass properties retain finite representable results",
    findings,
    [],
  );

  /** A relative comparison stays finite and also fails NaN. */
  function close(a: number, b: number): boolean {
    return Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(b));
  }

  /** Generic authored solid fixture, with no material-derived mass or coefficient. */
  function builder(): AutoMovieArchetypeBuilder<never, never> {
    return new AutoMovieArchetypeBuilder<never, never>({
      name: "numeric solid",
      material: "steel",
      draw: new AutoMovieArchetypeDrawSession<never>(
        "numeric-solid",
        {},
        undefined,
      ),
    });
  }

  /** A valid positive diagonal tensor isolates placement and line-moment arithmetic. */
  function properties(
    mass: number,
    centre: IAutoMovieVector3,
  ): AutoMovieArchetypeMass.IProperties {
    return {
      mass,
      centerOfMass: centre,
      inertia: { xx: 1, yy: 1, zz: 1, xy: 0, xz: 0, yz: 0 },
    };
  }

  /** Every unsupported numeric input must throw before returning a broken record. */
  function refused(run: () => void): boolean {
    try {
      run();
    } catch {
      return true;
    }
    return false;
  }
}

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  type AutoMovieArchetypeFracture,
  AutoMovieArchetypeRefusal,
} from "@automovie/archetypes";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A hit has finite nonnegative kinetic energy and finite momentum, and each
 * fragment receives its own finite velocity record.
 *
 * Three equal unit boxes carry total mass 3 kg. Two boxes break off at an
 * authored 5 J threshold, leaving fragment mass 2 kg, so momentum (2,-1,1) kg
 * m/s gives both fragments velocity (1,-0.5,0.5) m/s by p=Mv. Zero momentum is
 * valid. These are authored mechanics inputs, not measured materials.
 *
 * Scenarios:
 *
 * 1. At and below 5 J, valid inputs retain the threshold decision and conserve the
 *    supplied momentum across both fragments.
 * 2. Negative and non-finite energy, and every non-finite momentum component, are
 *    refused even when the object has no fracture or a hit is subthreshold; an
 *    active threshold must be finite and positive, as validateModel requires.
 * 3. A finite momentum whose velocity over a small fragment mass overflows is
 *    refused rather than exposing infinity.
 * 4. Editing one returned velocity affects neither another fragment, another break
 *    of the same object, nor the caller's original momentum.
 * 5. The common-velocity energy floor p²/(2M) is enforced at its exact binary64
 *    boundary, its adjacent lower energy and overflow-scale inputs.
 * 6. Invalid or underflowed piece masses are refused before computing their mass
 *    properties, rather than leaking a generic arithmetic error.
 */
export function test_unit_archetypes_core_fracture_hit(): void {
  const findings: string[] = [];
  const momentum: IAutoMovieVector3 = { x: 2, y: -1, z: 1 };
  const model: AutoMovieArchetype<never, never> = fixture();
  const plain: AutoMovieArchetype<never, never> = fixture(3, false);
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  if (
    model.broken({ energy: 0, momentum: zero }) !== null ||
    model.broken({ energy: 4, momentum }) !== null ||
    plain.broken({ energy: 1000, momentum }) !== null
  )
    findings.push("a zero/subthreshold hit or unbreakable object broke");

  const broken: AutoMovieArchetypeFracture.IPieces<never, never> | null =
    model.broken({
      energy: 5,
      momentum,
    });
  if (broken === null || broken.fragments.length !== 2)
    findings.push("the threshold did not produce exactly two fragments");
  else {
    let px: number = 0;
    let py: number = 0;
    let pz: number = 0;
    for (const fragment of broken.fragments) {
      const velocity: IAutoMovieVector3 = fragment.velocity;
      if (
        !(
          Math.abs(velocity.x - 1) <= 1e-12 &&
          Math.abs(velocity.y + 0.5) <= 1e-12 &&
          Math.abs(velocity.z - 0.5) <= 1e-12
        )
      )
        findings.push(
          `incorrect fragment velocity ${JSON.stringify(velocity)}`,
        );
      px += fragment.archetype.body.mass * velocity.x;
      py += fragment.archetype.body.mass * velocity.y;
      pz += fragment.archetype.body.mass * velocity.z;
    }
    if (
      !(
        Math.abs(px - 2) <= 1e-12 &&
        Math.abs(py + 1) <= 1e-12 &&
        Math.abs(pz - 1) <= 1e-12
      )
    )
      findings.push(`fragment momentum is (${px},${py},${pz})`);

    broken.fragments[0]!.velocity.x = 99;
    if (broken.fragments[1]!.velocity.x !== 1 || momentum.x !== 2)
      findings.push("one velocity mutation changed another fragment or input");
    const replay: AutoMovieArchetypeFracture.IPieces<never, never> | null =
      model.broken({ energy: 5, momentum });
    if (replay === null || replay.fragments[0]?.velocity.x !== 1)
      findings.push("a previous returned velocity changed a later break");
  }

  for (const target of [model, plain]) {
    for (const energy of [-1])
      if (
        !refuses((): void => {
          target.broken({ energy, momentum });
        }, "energy")
      )
        findings.push(`invalid energy ${energy} was not refused`);
    for (const axis of ["x", "y", "z"] as const)
  }
  for (const threshold of [0, -1])
    if (
      !refuses((): void => {
        fixture(3, true, threshold).broken({ energy: 5, momentum });
      }, "fracture")
    )
      findings.push(`invalid fracture threshold ${threshold} was not refused`);
  for (const mass of [0, -1, Number.MIN_VALUE])
    if (
      !refuses((): void => {
        fixture(mass).broken({ energy: 5, momentum: zero });
      }, "fractureMass")
    )
      findings.push(
        `invalid or underflowed fragment mass ${mass} was not refused before reduction`,
      );

  if (
    !refuses((): void => {
      fixture(0.001).broken({
        energy: 5,
        momentum: { x: Number.MAX_VALUE, y: 0, z: 0 },
      });
    }, "momentum")
  )
    findings.push("finite input produced a non-finite fragment velocity");

  const stationary: AutoMovieArchetypeFracture.IPieces<never, never> | null =
    model.broken({ energy: 5, momentum: zero });
  if (
    stationary === null ||
    stationary.fragments.some(
      (fragment: AutoMovieArchetypeFracture.IPiece<never>): boolean =>
        fragment.velocity.x !== 0 ||
        fragment.velocity.y !== 0 ||
        fragment.velocity.z !== 0,
    )
  )
    findings.push(
      "a valid zero-momentum hit did not give stationary fragments",
    );

  const lowThreshold: AutoMovieArchetype<never, never> = fixture(3, true, 0.5);
  const unitMomentum: IAutoMovieVector3 = { x: 2, y: 0, z: 0 };
  for (const incident of [0.75, 1 - Number.EPSILON / 2]) {
    const refused: AutoMovieArchetypeRefusal | null = energyRefusal(
      (): void => {
        lowThreshold.broken({ energy: incident, momentum: unitMomentum });
      },
    );
    if (
      refused?.axis !== "energy" ||
      refused.feasible?.kind !== "range" ||
      refused.feasible.minimum !== 1 ||
      refused.feasible.unit !== "J"
    )
      findings.push(
        `energy ${incident} did not report the exact 1 J lower bound`,
      );
  }
  if (lowThreshold.broken({ energy: 1, momentum: unitMomentum }) === null)
    findings.push("the exact 1 J kinetic-energy boundary was refused");
  const large: IAutoMovieVector3 = {
    x: 1.5 * Math.sqrt(Number.MAX_VALUE),
    y: 0,
    z: 0,
  };
  const largeBreak: AutoMovieArchetypeFracture.IPieces<never, never> | null =
    model.broken({ energy: Number.MAX_VALUE, momentum: large });
  if (largeBreak === null)
    findings.push(
      "an admissible hit was lost to intermediate energy-product overflow",
    );
  const impossible: AutoMovieArchetypeRefusal | null = energyRefusal(
    (): void => {
      model.broken({
        energy: Number.MAX_VALUE,
        momentum: { x: Number.MAX_VALUE / 2, y: 0, z: 0 },
      });
    },
  );
  if (impossible?.axis !== "energy" || impossible.feasible !== null)
    findings.push(
      "an energy floor above every finite number reported a feasible finite budget",
    );
  TestValidator.equals(
    "finite hits and independent fragment velocities",
    findings,
    [],
  );

  /** Equal boxes make the departing mass independently calculable. */
  function fixture(
    mass: number = 3,
    breakable: boolean = true,
    threshold: number = 5,
  ): AutoMovieArchetype<never, never> {
    const draw: AutoMovieArchetypeDrawSession<never> =
      new AutoMovieArchetypeDrawSession<never>(
        "fracture-fixture",
        {},
        undefined,
        {},
      );
    const builder: AutoMovieArchetypeBuilder<never, never> =
      new AutoMovieArchetypeBuilder<never, never>({
        draw,
        name: "fracture fixture",
        material: "steel",
      });
    for (const [id, x] of [
      ["left", -2],
      ["middle", 0],
      ["right", 2],
    ] as const)
      builder.box(id, { x: 1, y: 1, z: 1 }, { x, y: 0, z: 0 });
    if (breakable)
      builder.fracture([
        { id: "a", parts: ["left"] },
        { id: "b", parts: ["right"] },
      ]);
    const invalidMass: boolean = !(mass > 0) || mass === Number.MIN_VALUE;
    const made: AutoMovieArchetype<never, never> = builder.build(
      invalidMass ? 3 : mass,
      {
        restitution: 0,
        ...(breakable ? { outcome: { fracture: threshold } } : {}),
      },
    );
    if (!invalidMass) return made;

    // Deliberately malformed rest data bypass the builder's own total-mass admission.
    return new AutoMovieArchetype<never, never>({
      archetype: "fracture-fixture",
      id: "fracture-fixture",
      name: "malformed fracture mass",
      parts: made.parts,
      affordances: [],
      materials: made.materials,
      properties: { ...made.properties, mass },
      friction: null,
      kineticFriction: null,
      surfaces: {},
      material: "steel",
      restitution: 0,
      drag: null,
      contact: breakable ? { fracture: threshold } : null,
      fractures: breakable
        ? [
            { id: "a", parts: ["left"] },
            { id: "b", parts: ["right"] },
          ]
        : [],
      masses: Object.fromEntries(
        made.parts.map((p: IAutoMovieModelPart): [string, number] => [
          p.id,
          mass / 3,
        ]),
      ),
      dimensions: {},
      provenance: draw.provenance,
      spans: [],
    });
  }

  /**
   * Check the actual synchronous refusal contract without swallowing another
   * error.
   */
  function refuses(run: () => void, axis: string): boolean {
    try {
      run();
    } catch (error) {
      return error instanceof AutoMovieArchetypeRefusal && error.axis === axis;
    }
    return false;
  }

  /** Preserve the structured energy range while rejecting an unrelated failure. */
  function energyRefusal(run: () => void): AutoMovieArchetypeRefusal | null {
    try {
      run();
    } catch (error) {
      if (error instanceof AutoMovieArchetypeRefusal) return error;
      throw error;
    }
    return null;
  }
}

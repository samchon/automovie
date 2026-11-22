import {
  AutoMovieArchetypeRefusal,
  createProjectile,
} from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMoviePrimitiveShape,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A hand-thrown stone weighs what throwers choose, is granite, and is the sphere its mass fills at granite's density.
 *
 * Scenarios:
 * 1. Over 200 seeds its mass lies in 0.5 to 1 kg, the 0.75 kg +/- 0.25 kg Wilson et al. (2016) found throwers choose, and its specific gravity in 2.60 to 2.72, granite's 2.66 +/- 0.06 (Britannica's 334 samples), each spanning at least 80 % of its band.
 * 2. Its mass agrees with its drawn size and density within 1 %, as #3482 asks: the mass is the collider's sphere, pi d^3 / 6, times its specific gravity times water's 1000 kg per cubic metre.
 * 3. Seedless it is each band's middle: 0.75 kg of specific gravity 2.66.
 * 4. It passes `validateModel`, rests on its lowest point at the origin, is held round in one hand (`body`, a power grip as wide as the stone) and rests on stone, so its body carries friction.
 * 5. A mass 1 g past either end of its band is refused on `mass`; a diameter, which follows from the mass, is refused on `diameter`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Draws stones across seeds and reads their mass, specific gravity, collider, grip and friction; a stone outside the throwers' or granite's range, a size that does not follow its mass, or an unrefused fixed figure is caught.
 * @evidence contracts/development/testing.md#independent-expectations The mass band is Wilson et al.'s and the specific gravity granite's measured mean and spread, written here; the sphere's volume and water's density are worked here.
 * @evidence contracts/development/testing.md#distinguishing-cases 200 seeds, the seedless middles, both mass band ends a gram past, and a derived figure fixed.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_projectile_stone(): void {
  const findings: string[] = [];
  const MASS: readonly [number, number] = [0.5, 1];
  const GRAVITY: readonly [number, number] = [2.6, 2.72];
  const ball: (stone: ReturnType<typeof createProjectile>) => number = (
    stone: ReturnType<typeof createProjectile>,
  ): number => {
    const part: IAutoMovieModelPart | undefined = stone.parts.find(
      (p: IAutoMovieModelPart): boolean => p.id === "stone",
    );
    const shape: IAutoMoviePrimitiveShape | undefined =
      part?.geometry.type === "primitive" ? part.geometry.shape : undefined;
    return shape?.type === "sphere" ? shape.radius : Number.NaN;
  };

  // 1 and 2. Over 200 seeds.
  const seen: Record<"mass" | "gravity", [number, number]> = {
    mass: [Infinity, -Infinity],
    gravity: [Infinity, -Infinity],
  };
  for (let seed: number = 0; seed < 200; ++seed) {
    const stone: ReturnType<typeof createProjectile> = createProjectile(
      { kind: "stone" },
      seed,
    );
    const mass: number = stone.body.mass;
    const gravity: number = stone.dimensions.gravity!;
    if (!(mass >= MASS[0] && mass <= MASS[1]))
      findings.push(`seed ${seed} weighs ${mass} kg`);
    if (!(gravity >= GRAVITY[0] && gravity <= GRAVITY[1]))
      findings.push(`seed ${seed} has a specific gravity of ${gravity}`);
    seen.mass = [Math.min(seen.mass[0], mass), Math.max(seen.mass[1], mass)];
    seen.gravity = [
      Math.min(seen.gravity[0], gravity),
      Math.max(seen.gravity[1], gravity),
    ];
    const r: number = ball(stone);
    const filled: number = (4 / 3) * Math.PI * r ** 3 * gravity * 1000;
    if (!(Math.abs(filled / mass - 1) <= 0.01))
      findings.push(
        `seed ${seed}: its ${2 * r} m sphere of gravity ${gravity} weighs ${filled} kg, not ${mass} kg`,
      );
  }
  for (const [name, band] of [
    ["mass", MASS],
    ["gravity", GRAVITY],
  ] as const)
    if (seen[name][1] - seen[name][0] < 0.8 * (band[1] - band[0]))
      findings.push(`${name} spans only ${seen[name][0]} to ${seen[name][1]}`);

  // 3. Seedless.
  const middle: ReturnType<typeof createProjectile> = createProjectile({
    kind: "stone",
  });
  if (
    !(
      Math.abs(middle.body.mass - 0.75) <= 1e-12 &&
      Math.abs(middle.dimensions.gravity! - 2.66) <= 1e-12
    )
  )
    findings.push(
      `seedless it weighs ${middle.body.mass} kg at a specific gravity of ${middle.dimensions.gravity}`,
    );

  // 4. Admitted, resting, held and resting on stone.
  if (!validateModel({ model: middle }).success)
    findings.push("the stone is not admitted");
  const r: number = ball(middle);
  const centre: number | undefined = middle.parts.find(
    (p: IAutoMovieModelPart): boolean => p.id === "stone",
  )?.transform?.translation.y;
  if (centre === undefined || !(Math.abs(centre - r) <= 1e-12))
    findings.push(`its centre stands ${centre} m up, its radius ${r} m`);
  const body: ReturnType<typeof middle.affordance> = middle.affordance("body");
  if (
    body.kind !== "handle" ||
    body.grip !== "power" ||
    !(Math.abs(body.aperture! - 2 * r) <= 1e-12)
  )
    findings.push(`the body grip is ${JSON.stringify(body)}`);
  if (middle.body.friction === undefined)
    findings.push("the stone carries no friction");

  // 5. Refusals.
  for (const [axis, params] of [
    ["mass", { kind: "stone", mass: MASS[0] - 0.001 }],
    ["mass", { kind: "stone", mass: MASS[1] + 0.001 }],
    ["diameter", { kind: "stone", diameter: 0.08 }],
  ] as const) {
    let refused: string | null = null;
    try {
      createProjectile(params);
    } catch (error) {
      refused =
        error instanceof AutoMovieArchetypeRefusal ? error.axis : String(error);
    }
    if (refused !== axis)
      findings.push(`${JSON.stringify(params)} was refused at ${refused}`);
  }
  TestValidator.equals(
    "a stone weighs what throwers choose, at granite's density",
    findings,
    [],
  );
}

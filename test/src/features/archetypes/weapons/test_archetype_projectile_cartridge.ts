import { AutoMovieArchetypeRefusal, AutoMovieArchetypeProjectile } from "@automovie/archetypes";
import { AutoMovieEngineValidation } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A musket's paper cartridge is the US Ordnance Manual's: its size and weight,
 * pinched in the middle and torn at its powder end.
 *
 * Scenarios, for the cartridge at its seedless draw:
 *
 * 1. It passes `validateModel`.
 * 2. It is 2.6 in long, the bundle of ten's length that the 1862 manual gives as
 *    the cartridge's (p. 268, p. 270), and .65 in across, the ball the paper is
 *    rolled on (Mordecai 1850, p. 246); it weighs a tenth of its ten's 13.2 oz
 *    (1862, p. 270).
 * 3. `grip` is a precision pinch of the paper's width at the middle of its length,
 *    and `end` the powder end at its top, `+Y` out along it, where the teeth
 *    bite it off.
 * 4. Each band is the one read figure, so three seeds draw the same cartridge, and
 *    a length, a diameter or a mass fixed a micro-unit off its figure is
 *    refused on that dimension.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scenic prop's size, mass and the local grip and seam contact locations.
 * @evidence contracts/development/testing.md#behavioral-verification Builds and reads the public prop geometry and named contacts. Tests the emitted extents, weight and opposite contact positions.
 * @evidence contracts/development/testing.md#independent-expectations Uses the fixture's literal reference sizes and mass and measures the named positions against the actual model extents.
 */
export function test_archetype_projectile_cartridge(): void {
  const findings: string[] = [];
  const inch: number = 0.0254;
  const ounce: number = 0.45359237 / 16;
  const cartridge: ReturnType<typeof AutoMovieArchetypeProjectile.create> = AutoMovieArchetypeProjectile.create({
    kind: "cartridge",
  });
  if (!AutoMovieEngineValidation.validateModel({ model: cartridge }).success)
    findings.push("the cartridge is not admitted");
  const length: number = cartridge.dimensions.length!;
  if (!(Math.abs(length - 2.6 * inch) <= 1e-12))
    findings.push(`the cartridge is ${length} m long`);
  if (!(Math.abs(cartridge.dimensions.diameter! - 0.65 * inch) <= 1e-12))
    findings.push(`the cartridge is ${cartridge.dimensions.diameter} m across`);
  if (!(Math.abs(cartridge.body.mass - (13.2 * ounce) / 10) <= 1e-12))
    findings.push(`the cartridge weighs ${cartridge.body.mass} kg`);
  const grip: ReturnType<typeof cartridge.affordance> =
    cartridge.affordance("grip");
  if (
    grip.kind !== "handle" ||
    grip.grip !== "precision" ||
    !(Math.abs(grip.frame.translation.y - length / 2) <= 1e-12)
  )
    findings.push(`the grip is ${JSON.stringify(grip)}`);
  const end: ReturnType<typeof cartridge.affordance> =
    cartridge.affordance("end");
  if (!(Math.abs(end.frame.translation.y - length) <= 1e-12))
    findings.push(`the torn end is at ${end.frame.translation.y} m`);
  // 4. Every band is the one read figure: any seed draws the same cartridge, and a figure fixed a step off it is refused on that dimension.
  for (const seed of [0, 1, 1046])
    if (
      JSON.stringify(AutoMovieArchetypeProjectile.create({ kind: "cartridge" }, seed)) !==
      JSON.stringify(cartridge)
    )
      findings.push(`seed ${seed} draws another cartridge`);
  for (const [axis, value] of [
    ["length", 2.6 * inch + 1e-6],
    ["diameter", 0.65 * inch - 1e-6],
    ["mass", (13.2 * ounce) / 10 + 1e-6],
  ] as const) {
    let refused: string | null = null;
    try {
      AutoMovieArchetypeProjectile.create({ kind: "cartridge", [axis]: value });
    } catch (error) {
      refused =
        error instanceof AutoMovieArchetypeRefusal ? error.axis : String(error);
    }
    if (refused !== axis)
      findings.push(
        `a cartridge's ${axis} of ${value} was refused at ${refused}`,
      );
  }
  TestValidator.equals(
    "a paper cartridge is the manual's, pinched and torn",
    findings,
    [],
  );
}

import { type AutoMovieArchetype, createHandgun } from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/** The Single Action Army's chambers, "Check each of six chambers" (Colt's instruction manual, 1993, Section 4). */
const CHAMBERS: number = 6;

/**
 * A revolver's cylinder turns one chamber for each full cock of its hammer.
 *
 * Scenarios, at four seeds of each read revolver:
 * 1. Cocking the hammer by its whole travel turns the cylinder by a sixth of a turn, 360 degrees over Colt's six chambers, by `follows`; half the hammer's travel turns it half as far.
 * 2. There are six chamber sockets, each riding the cylinder, and the gate opens on its hinge.
 * 3. The cocked pose and the open gate are admitted models.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Articulates the hammer and reads the cylinder's resolved travel; a cylinder that does not follow, turns by another angle, or a missing chamber is caught.
 * @evidence contracts/development/testing.md#independent-expectations The chamber count is Colt's manual's, written here; the expected turn is worked from it, not from the producer's ratio.
 * @evidence contracts/development/testing.md#distinguishing-cases Both read revolvers, four seeds each, a full and a half cock.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_weapon_revolver_cylinder(): void {
  const findings: string[] = [];
  for (const model of ["saa75", "vaquero5104"] as const)
    for (const seed of [0, 3, 7, 12]) {
      const revolver: AutoMovieArchetype<
        createHandgun.Affordance,
        createHandgun.Dimension
      > = createHandgun({ frame: "revolver", model }, seed);
      const label: string = `${model}@${seed}`;
      const full: number = revolver.affordance("hammer").travel!;
      for (const [share, expected] of [
        [1, 360 / CHAMBERS],
        [0.5, 180 / CHAMBERS],
      ] as const) {
        const cocked: AutoMovieArchetype<
          createHandgun.Affordance,
          createHandgun.Dimension
        > = revolver.articulate({ hammer: full * share });
        if (Math.abs(cocked.travel("cylinder") - expected) > 1e-9)
          findings.push(
            `${label}: at ${share} of a cock the cylinder turns ${cocked.travel("cylinder")}, not ${expected}`,
          );
        if (!validateModel({ model: cocked }).success)
          findings.push(`${label}: the cocked pose is refused`);
      }
      const chambers: number = revolver.affordances.filter(
        (a: { id: string; kind: string; rides?: string }): boolean =>
          a.id.startsWith("chamber") &&
          a.kind === "socket" &&
          a.rides === "cylinder",
      ).length;
      if (chambers !== CHAMBERS)
        findings.push(`${label}: ${chambers} chambers ride the cylinder`);
      const open: AutoMovieArchetype<
        createHandgun.Affordance,
        createHandgun.Dimension
      > = revolver.articulate({ gate: revolver.affordance("gate").travel! });
      if (!validateModel({ model: open }).success)
        findings.push(`${label}: the open gate is refused`);
    }
  TestValidator.equals("a revolver turns one chamber per cock", findings, []);
}

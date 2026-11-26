import {
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeJavelin,
  createPolearm,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * A javelin balances in the hand that grips its cord, and a couched lance carries its point forward of the hand.
 *
 * Scenarios:
 * 1. For the men's and the women's javelin, at each end of its length band and of its balance band (World Athletics Technical Rule 38: 2.60 to 2.70 m and 0.90 to 1.06 m for the men, 2.20 to 2.30 m and 0.80 to 0.92 m for the women), its centre of mass lies on its point-to-tail axis at the rule's balance distance from the point, within 1e-9 m, inside the cord's width around the `grip`; its mass is the rule's 800 g or 600 g and its length the drawn one.
 * 2. A lance's `grip` lies behind its centre of mass, toward the butt, so its steel head carries the point forward of the couching hand.
 * 3. A length or a balance a millimetre past either end of the rule's band is refused on that dimension, for both categories.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces javelins at every band end and a lance and reads their mass properties against their contacts; a javelin balanced off its cord, or a lance balanced behind its grip, is caught.
 * @evidence contracts/development/testing.md#independent-expectations The balance distances, lengths and masses are the rule's, written here; the centre of mass is read from the produced model's own mass properties.
 * @evidence contracts/development/testing.md#distinguishing-cases Both categories at all four band corners and a millimetre past each band end, and the lance.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_weapon_javelin(): void {
  const findings: string[] = [];
  const rule: Readonly<
    Record<
      AutoMovieArchetypeJavelin.Kind,
      {
        length: readonly [number, number];
        balance: readonly [number, number];
        mass: number;
      }
    >
  > = {
    men: { length: [2.6, 2.7], balance: [0.9, 1.06], mass: 0.8 },
    women: { length: [2.2, 2.3], balance: [0.8, 0.92], mass: 0.6 },
  };
  for (const kind of AutoMovieArchetypeJavelin.KINDS)
    for (const length of rule[kind].length)
      for (const balance of rule[kind].balance) {
        const javelin: ReturnType<typeof AutoMovieArchetypeJavelin.create> = AutoMovieArchetypeJavelin.create({
          kind,
          length,
          balance,
        });
        const centre: { x: number; y: number; z: number } =
          javelin.properties.centerOfMass;
        const grip: ReturnType<typeof javelin.affordance> =
          javelin.affordance("grip");
        const label: string = `the ${kind}'s javelin ${length} m long balanced at ${balance} m`;
        if (
          Math.abs(centre.y - balance) > 1e-9 ||
          Math.hypot(centre.x, centre.z) > 1e-9 ||
          Math.abs(grip.frame.translation.y - centre.y) > grip.length! / 2
        )
          findings.push(
            `${label}: its centre of mass is at ${JSON.stringify(centre)}, its grip at ${grip.frame.translation.y} m`,
          );
        if (Math.abs(javelin.body.mass - rule[kind].mass) > 1e-12)
          findings.push(`${label}: ${javelin.body.mass} kg`);
        if (Math.abs(javelin.dimensions.length! - length) > 1e-12)
          findings.push(`${label}: ${javelin.dimensions.length} m long`);
      }
  // 3. A millimetre past either end of either band is refused on that dimension.
  for (const kind of AutoMovieArchetypeJavelin.KINDS)
    for (const axis of ["length", "balance"] as const)
      for (const value of [
        rule[kind][axis][0] - 0.001,
        rule[kind][axis][1] + 0.001,
      ]) {
        let refused: string | null = null;
        try {
          AutoMovieArchetypeJavelin.create({ kind, [axis]: value });
        } catch (error) {
          refused =
            error instanceof AutoMovieArchetypeRefusal
              ? error.axis
              : String(error);
        }
        if (refused !== axis)
          findings.push(
            `the ${kind}'s javelin with a ${axis} of ${value} m was refused at ${refused}`,
          );
      }

  const lance: ReturnType<typeof createPolearm> = createPolearm({
    kind: "lance",
  });
  if (
    !(
      lance.affordance("grip").frame.translation.y <
      lance.properties.centerOfMass.y
    )
  )
    findings.push(
      `a lance's grip at ${lance.affordance("grip").frame.translation.y} m is not behind its centre of mass at ${lance.properties.centerOfMass.y} m`,
    );
  TestValidator.equals(
    "a javelin balances at its grip, a lance ahead of it",
    findings,
    [],
  );
}

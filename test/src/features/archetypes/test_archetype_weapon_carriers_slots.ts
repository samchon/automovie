import { ArchetypeRefusal, createHolster } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A quiver's slots are the places its arrows stand: one per arrow, on the mouth, inside the tube and apart from one another.
 *
 * Scenarios:
 * 1. A quiver of 12 slots, the default, and of 1, 24 and 50: as many `slot` sockets as asked, each facing up on the mouth's plane and inside the tube's radius, every two at least the spacing an even packing of that many in the mouth gives apart, half the mouth's diameter over the square root of the count.
 * 2. A count of 0, 51, 2.5 or any count on a holster is refused with the axis `slots`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces quivers with given counts and reads their slot frames and colliders; a slot missing, outside the mouth, crowded onto another or tilted, or a count accepted out of range is caught.
 * @evidence contracts/development/testing.md#independent-expectations The spacing bound is the even packing of n points in a disc, whose cell is the disc's area over n, so neighbours are about the radius over the square root of n apart; the 50 is the producer's cited capacity.
 * @evidence contracts/development/testing.md#distinguishing-cases Singleton, default and limit counts, a malformed count, and a kind without slots; the arrows themselves belong to the projectile's specs.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_weapon_carriers_slots(): void {
  const findings: string[] = [];
  const slotsOf = (
    carrier: ReturnType<typeof createHolster>,
  ): IAutoMovieAffordance[] =>
    carrier.affordances.filter((a: IAutoMovieAffordance): boolean =>
      a.id.startsWith("slot"),
    );
  const upright = (a: IAutoMovieAffordance): boolean =>
    Math.abs(Math.abs(a.frame.rotation.w) - 1) < 1e-12;

  // 1. A quiver's slots spread over its mouth.
  for (const count of [undefined, 1, 24, 50] as const) {
    const quiver: ReturnType<typeof createHolster> = createHolster(
      { kind: "quiver", slots: count },
      3,
    );
    const n: number = count ?? 12;
    const slots: IAutoMovieAffordance[] = slotsOf(quiver);
    const r: number = quiver.dimensions.diameter! / 2;
    const mouth: number = quiver.affordance("socket").frame.translation.y;
    if (slots.length !== n)
      findings.push(`quiver of ${n}: ${slots.length} slots`);
    for (const slot of slots) {
      const at: IAutoMovieVector3 = slot.frame.translation;
      if (
        Math.abs(at.y - mouth) > 1e-12 ||
        !(Math.hypot(at.x, at.z) < r) ||
        !upright(slot)
      )
        findings.push(`quiver of ${n}: ${slot.id} is off the mouth`);
    }
    for (let i: number = 0; i < slots.length; i++)
      for (let j: number = i + 1; j < slots.length; j++)
        if (
          !(
            Vector3.length(
              Vector3.subtract(
                slots[i]!.frame.translation,
                slots[j]!.frame.translation,
              ),
            ) >=
            r / Math.sqrt(n)
          )
        )
          findings.push(`quiver of ${n}: ${slots[i]!.id} crowds ${slots[j]!.id}`);
  }

  // 2. Counts out of range, malformed, or on a kind without slots.
  for (const [kind, slots] of [
    ["quiver", 0],
    ["quiver", 51],
    ["quiver", 2.5],
    ["holster", 3],
  ] as const) {
    let refused: ArchetypeRefusal | null = null;
    try {
      createHolster({ kind, slots });
    } catch (error) {
      refused = error instanceof ArchetypeRefusal ? error : null;
    }
    if (refused === null || refused.axis !== "slots")
      findings.push(`a ${kind} of ${slots} slots was not refused`);
  }
  TestValidator.equals("carriers place their items' slots", findings, []);
}

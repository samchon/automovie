import { ArchetypeRefusal, createHolster } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * A quiver's and a pouch's slots are the places their arrows and cartridges stand: one per item, on the opening, inside the container's outline and apart from one another, and a pouch's lid opens its flap.
 *
 * Scenarios:
 * 1. A quiver of 12 slots, the default, and of 1, 24 and 50: as many `slot` sockets as asked, each facing up on the mouth's plane and inside the tube's radius, every two at least the spacing an even packing of that many in the mouth gives apart, half the mouth's diameter over the square root of the count.
 * 2. A pouch of 26 slots, the default, and of 1 and 7: as many sockets, each facing up on the box's top inside its outline, in two rows across its depth.
 * 3. A pouch's `lid` turned by its whole travel of 180 degrees lays its flap on the box's far side of the hinge, standing no lower than the box's top, and back at 0 covers the top.
 * 4. A count of 0, 51, 2.5 or any count on a holster is refused with the axis `slots`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces quivers and pouches with given counts and reads their slot frames, colliders and the flap's articulation; a slot missing, outside the opening, crowded onto another or tilted, a flap that opens into the box, or a count accepted out of range is caught.
 * @evidence contracts/development/testing.md#independent-expectations The spacing bound is the even packing of n points in a disc, whose cell is the disc's area over n, so neighbours are about the radius over the square root of n apart; the 50 and the 26 are the producer's cited capacities; a flap opening upward is a lid's purpose.
 * @evidence contracts/development/testing.md#distinguishing-cases Singleton, default and limit counts, a malformed count, and a kind without slots; the arrows themselves belong to the projectile's specs.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
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

  // 2. A pouch's slots on the box's top, in two rows.
  for (const count of [undefined, 1, 7] as const) {
    const pouch: ReturnType<typeof createHolster> = createHolster(
      { kind: "pouch", slots: count },
      3,
    );
    const n: number = count ?? 26;
    const slots: IAutoMovieAffordance[] = slotsOf(pouch);
    const box: Readonly<
      Record<"x" | "y" | "z", ReturnType<typeof archetypeExtent>>
    > = {
      x: archetypeExtent(pouch, "x", ["box"]),
      y: archetypeExtent(pouch, "y", ["box"]),
      z: archetypeExtent(pouch, "z", ["box"]),
    };
    if (slots.length !== n) findings.push(`pouch of ${n}: ${slots.length} slots`);
    const rows: Set<number> = new Set();
    for (const slot of slots) {
      const at: IAutoMovieVector3 = slot.frame.translation;
      rows.add(Math.round(at.x * 1e9));
      if (
        Math.abs(at.y - box.y.high) > 1e-12 ||
        !(at.x > box.x.low && at.x < box.x.high) ||
        !(at.z > box.z.low && at.z < box.z.high) ||
        !upright(slot)
      )
        findings.push(`pouch of ${n}: ${slot.id} is off the box's top`);
    }
    if (rows.size !== Math.min(n, 2))
      findings.push(`pouch of ${n}: ${rows.size} rows`);
  }

  // 3. The lid opens the flap upward and over.
  const pouch: ReturnType<typeof createHolster> = createHolster(
    { kind: "pouch" },
    4,
  );
  const top: number = archetypeExtent(pouch, "y", ["box"]).high;
  const open: ReturnType<typeof createHolster> = pouch.articulate({
    lid: pouch.affordance("lid").travel!,
  });
  const hinge: number = pouch.affordance("lid").frame.translation.x;
  const flap: ReturnType<typeof archetypeExtent> = archetypeExtent(
    open,
    "x",
    ["flap"],
  );
  if (
    pouch.affordance("lid").travel !== 180 ||
    !(flap.high <= hinge + 1e-9) ||
    !(archetypeExtent(open, "y", ["flap"]).low >= top - 1e-9) ||
    !(archetypeExtent(pouch, "y", ["flap"]).low >= top - 1e-9)
  )
    findings.push("the pouch's lid does not open its flap up and over");

  // 4. Counts out of range, malformed, or on a kind without slots.
  for (const [kind, slots] of [
    ["quiver", 0],
    ["quiver", 51],
    ["pouch", 2.5],
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

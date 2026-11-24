import { AutoMovieArchetypeFrame, createHolster } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../../internal/archetypeExtent";
import { vclose } from "../../../internal/predicates";

/**
 * A holster asked for without a kind is the belt holster it was before the carrier kinds: the same model, contacts and sizes.
 *
 * Scenarios:
 * 1. `createHolster({})` and `createHolster({}, 7)` serialise byte for byte as `createHolster({ kind: "holster" })` with the same seed.
 * 2. Without a seed its mouth stands at mid-ride, level with the belt line, with the belt loop's middle at the origin facing the wearer on `-X`.
 * 3. It declares exactly its two contacts, `socket` and `belt`, and its two parts, `loop` and `pouch`, the pouch hanging the drawn depth below the mouth.
 */
export function test_unit_archetypes_weapons_weapon_holster_unchanged(): void {
  const findings: string[] = [];
  for (const seed of [undefined, 7])
    if (
      JSON.stringify(createHolster({}, seed)) !==
      JSON.stringify(createHolster({ kind: "holster" }, seed))
    )
      findings.push(`seed ${String(seed)}: the default is not the holster`);
  const holster: ReturnType<typeof createHolster> = createHolster();
  const belt: ReturnType<typeof holster.affordance> =
    holster.affordance("belt");
  if (Math.abs(holster.affordance("socket").frame.translation.y) > 1e-12)
    findings.push("the mouth is off the belt line at mid-ride");
  if (
    Math.hypot(
      belt.frame.translation.x,
      belt.frame.translation.y,
      belt.frame.translation.z,
    ) > 1e-12 ||
    !vclose(
      AutoMovieArchetypeFrame.axis(belt.frame, "y"),
      { x: -1, y: 0, z: 0 },
      1e-12,
    )
  )
    findings.push("the belt loop is off the origin or not facing the wearer");
  TestValidator.equals(
    "the holster's contacts and parts",
    [
      holster.affordances.map((a: { id: string }): string => a.id).join(","),
      holster.parts.map((p: { id: string }): string => p.id).join(","),
    ],
    ["socket,belt", "loop,pouch"],
  );
  if (
    Math.abs(
      archetypeExtent(holster, "y", ["pouch"]).size - holster.dimensions.depth!,
    ) > 1e-12
  )
    findings.push("the pouch is not the drawn depth");
  TestValidator.equals("the default holster is unchanged", findings, []);
}

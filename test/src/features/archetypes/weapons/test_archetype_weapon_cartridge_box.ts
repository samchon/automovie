import { type AutoMovieArchetype, AutoMovieArchetypeRefusal, AutoMovieArchetypeHolster } from "@automovie/archetypes";
import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";

/** An inch, metres. */
const IN: number = 0.0254;

/**
 * A cartridge box is the 1841 Ordnance Manual's infantry box: its size, its two tins' cartridge places and its flap.
 *
 * Scenarios:
 * 1. The box is 7.7 in long, 1.6 in wide and 5.8 in deep, its flap 8.5 in wide, as the manual reads; its mass band is marked provisional.
 * 2. It holds 20 loose cartridges by default, `slot1` to `slot20`, each a socket facing up at the box's top and inside its outline; no two closer than the tightest square cell the read parts allow, six in 2 by 1.35 in three along by two across, so 2 in over 3; a box asked for 6 has `slot1` to `slot6` only.
 * 3. Asking for 0 or 21 cartridges, or 2.5, is refused at `slots`.
 * 4. The `lid` hinge opens to its travel and back, each pose an admitted model, and the opened flap stands higher than the shut one; the box has a `strap` and a `belt` hook.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines scenic box dimensions, slot count, contact positions, over-capacity refusal and opening lid pose.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the public scene prop and measures actual box colliders, the slot count and placement and the lid's articulated pose.
 * @evidence contracts/development/testing.md#independent-expectations Uses the fixture's literal box and cell sizes. Cell spacing and the measured box extent independently locate the slots.
 */
export function test_archetype_weapon_cartridge_box(): void {
  const findings: string[] = [];
  const close = (a: number, b: number, tolerance: number = 1e-9): boolean =>
    Math.abs(a - b) <= tolerance;
  const box: AutoMovieArchetype<
    AutoMovieArchetypeHolster.Affordance,
    AutoMovieArchetypeHolster.Dimension
  > = AutoMovieArchetypeHolster.create({ kind: "pouch" }, 1);
  const d: Readonly<Partial<Record<AutoMovieArchetypeHolster.Dimension, number>>> =
    box.dimensions;
  for (const [name, inches] of [
    ["length", 7.7],
    ["thickness", 1.6],
    ["depth", 5.8],
    ["width", 8.5],
  ] as const)
    if (!close(d[name]!, inches * IN))
      findings.push(`${name} is ${d[name]}, not ${inches} in`);
  if (box.provenance.bands.mass?.provisional !== true)
    findings.push("the mass band is not marked provisional");
  if (
    !close(archetypeExtent(box, "z", ["box"]).size, 7.7 * IN) ||
    !close(archetypeExtent(box, "y", ["box"]).size, 5.8 * IN)
  )
    findings.push("the box's collider is not the manual's size");

  const slots: IAutoMovieAffordance[] = box.affordances.filter(
    (a: IAutoMovieAffordance): boolean => a.id.startsWith("slot"),
  );
  if (slots.length !== 20) findings.push(`${slots.length} slots, not 20`);
  for (const slot of slots) {
    const at: IAutoMovieVector3 = slot.frame.translation;
    if (slot.kind !== "socket") findings.push(`${slot.id} is a ${slot.kind}`);
    if (
      !close(at.y, 5.8 * IN) ||
      !(at.x > 0 && at.x < 1.6 * IN) ||
      !(Math.abs(at.z) < (7.7 * IN) / 2)
    )
      findings.push(
        `${slot.id} stands at ${JSON.stringify(at)}, off the box's top`,
      );
  }
  // The tightest square cell the read parts allow: six in a 2 by 1.35 in part at best three along by two across, 2 in over 3; four in a 1.35 in square two by two, 1.35 in over 2.
  const cell: number = Math.min((2 * IN) / 3, (1.35 * IN) / 2);
  for (let a: number = 0; a < slots.length; a++)
    for (let b: number = a + 1; b < slots.length; b++) {
      const p: IAutoMovieVector3 = slots[a]!.frame.translation;
      const q: IAutoMovieVector3 = slots[b]!.frame.translation;
      if (Math.hypot(p.x - q.x, p.z - q.z) < cell - 1e-9)
        findings.push(`${slots[a]!.id} and ${slots[b]!.id} overlap`);
    }
  const six: number = AutoMovieArchetypeHolster.create(
    { kind: "pouch", slots: 6 },
    1,
  ).affordances.filter((a: IAutoMovieAffordance): boolean =>
    a.id.startsWith("slot"),
  ).length;
  if (six !== 6) findings.push(`a box asked for 6 has ${six} slots`);
  for (const count of [0, 21, 2.5]) {
    let refused: unknown = null;
    try {
      AutoMovieArchetypeHolster.create({ kind: "pouch", slots: count }, 1);
    } catch (error) {
      refused = error;
    }
    if (
      !(
        refused instanceof AutoMovieArchetypeRefusal && refused.axis === "slots"
      )
    )
      findings.push(`${count} cartridges are not refused`);
  }

  const lid: IAutoMovieAffordance = box.affordance("lid");
  if (lid.kind !== "hinge" || !(lid.travel! > 0))
    findings.push(`the lid is a ${lid.kind} of travel ${lid.travel}`);
  const open: AutoMovieArchetype<
    AutoMovieArchetypeHolster.Affordance,
    AutoMovieArchetypeHolster.Dimension
  > = box.articulate({ lid: lid.travel! });
  for (const posed of [box, open])
    if (!AutoMovieEngineValidation.validateModel({ model: posed }).success)
      findings.push("a lid pose is refused");
  if (
    !(
      archetypeExtent(open, "y", ["lid"]).high >
      archetypeExtent(box, "y", ["lid"]).high
    )
  )
    findings.push("the opened lid does not rise");
  for (const id of ["strap", "belt"] as const)
    if (box.affordance(id).kind !== "hook") findings.push(`no ${id} hook`);
  TestValidator.equals("a cartridge box is the manual's", findings, []);
}

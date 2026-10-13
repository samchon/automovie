import { formationSlotRecord } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";

const UNIT = { id: "levy", modelRecipe: "member", facingDeg: 30, seed: 42 };
const AT = { x: 1, y: 2.5, z: -3 };

/**
 *
 * One formation slot regenerates to the member record its identity law names.
 *
 * The node, actor, recipe, heading and position are each computed here from the
 * slot and the inputs handed over. The motion phase is checked by its law, not
 * by its value: the seeding domain is the kernel's private constant, so the
 * phase must repeat for one slot and seed, move with either, and ignore the rest.
 *
 * Scenarios:
 *
 * 1. An anonymous slot is named by the formation id and six-digit slot and
 *    carries the base recipe, the heading, the position it was handed and the
 *    phase a separate call drew for the same slot and seed.
 * 2. The same slot with an actor is named by that actor and keeps the same phase.
 * 3. Slot 0 pads to six digits and slot 1234567 keeps all seven.
 * 4. The phase follows the slot and the seed: the neighbouring slot and another
 *    seed draw different phases, while another actor, position, recipe or heading
 *    at the same slot and seed leaves it unchanged, and it lies in [0, 1).
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `formationSlotRecord` for anonymous and hero members and asserts the whole record and the phase relations; it catches a hero named by its slot instead of its actor, an anonymous node padded to the wrong width or truncated past six digits, a recipe, heading or position not carried through, a phase that changes between calls, differs between hero and anonymous spellings of one slot, ignores the slot or seed, or is perturbed by actor, position, recipe or heading.
 * @evidence contracts/testing.md#independent-expectations Node strings, recipe, heading and position are written from the record law in `formationSlotRecord`'s doc comment and the literal inputs; the phase is never compared to a value computed with the kernel's seeding domain, only to itself across calls and inputs and to the [0, 1) range of a normalized phase, so a wrong but stable domain constant would pass and is out of this oracle's reach.
 * @evidence contracts/testing.md#distinguishing-cases Anonymous and hero spellings of slot 7, slot 0 for padding and slot 1,234,567 as the first width past six digits, neighbour slot 8 and seed 43 as the inputs that must move the phase, and a changed recipe, heading, actor and position as the inputs that must not; agreement of design and compiled regenerators belongs to test_engine_compiled_formation_slot.
 */
export const test_engine_formation_slot_record = (): void => {
  const phase = formationSlotRecord(UNIT, 7, {
    actor: null,
    position: AT,
  }).motionPhase;
  TestValidator.equals(
    "an anonymous slot is named by its formation and slot",
    formationSlotRecord(UNIT, 7, { actor: null, position: AT }),
    {
      slot: 7,
      node: "formation:levy:slot:000007",
      actor: null,
      modelRecipe: "member",
      position: { x: 1, y: 2.5, z: -3 },
      facingDeg: 30,
      motionPhase: phase,
    },
  );
  TestValidator.equals(
    "a hero slot is named by its actor and keeps the slot's phase",
    formationSlotRecord(UNIT, 7, { actor: "captain", position: AT }),
    {
      slot: 7,
      node: "captain",
      actor: "captain",
      modelRecipe: "member",
      position: { x: 1, y: 2.5, z: -3 },
      facingDeg: 30,
      motionPhase: phase,
    },
  );

  const recordPhase = (
    unit: typeof UNIT,
    slot: number,
    member: { actor: string | null; position: typeof AT },
  ): number => formationSlotRecord(unit, slot, member).motionPhase;
  TestValidator.equals(
    "the node pads the slot and the phase follows only slot and seed",
    namedFacts([
      [
        "padded",
        () =>
          formationSlotRecord(UNIT, 0, { actor: null, position: AT }).node ===
          "formation:levy:slot:000000",
      ],
      [
        "wide",
        () =>
          formationSlotRecord(UNIT, 1_234_567, { actor: null, position: AT })
            .node === "formation:levy:slot:1234567",
      ],
      [
        "neighbourDiffers",
        () => recordPhase(UNIT, 8, { actor: null, position: AT }) !== phase,
      ],
      [
        "seedDiffers",
        () =>
          recordPhase({ ...UNIT, seed: 43 }, 7, {
            actor: null,
            position: AT,
          }) !== phase,
      ],
      [
        "unmovedByTheRest",
        () =>
          recordPhase({ ...UNIT, modelRecipe: "other", facingDeg: 90 }, 7, {
            actor: "banner",
            position: { x: 9, y: 9, z: 9 },
          }) === phase,
      ],
      ["unitInterval", () => phase >= 0 && phase < 1],
    ]),
    {
      padded: true,
      wide: true,
      neighbourDiffers: true,
      seedDiffers: true,
      unmovedByTheRest: true,
      unitInterval: true,
    },
  );
};

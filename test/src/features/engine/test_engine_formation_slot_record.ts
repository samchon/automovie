import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { formationSlotRecord } from "@automovie/engine";
import { namedFacts, nclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

const UNIT: Parameters<typeof formationSlotRecord>[0] = {
  id: "levy",
  modelRecipe: "member",
  facingDeg: 30,
  seed: 42,
};
const AT: IAutoMovieVector3 = { x: 1, y: 2.5, z: -3 };

/**
 * One formation slot regenerates to the member record its identity law names.
 *
 * Literal node names and carried actor, recipe, heading and position are checked separately from phase. The phase checks repeatability, selected seed/slot differences and invariance under other record edits; they do not reconstruct the kernel's seeded numeric value.
 *
 * Scenarios:
 *
 * 1. An anonymous slot is named by the formation id and six-digit slot and carries the base recipe, heading, supplied position and phase observed for the same slot and seed.
 * 2. The same slot with an actor is named by that actor and keeps the same phase.
 * 3. Slot 0 pads to six digits and slot 1234567 keeps all seven.
 * 4. The selected neighbouring slot and changed seed draw different phases, while another actor, position, recipe or heading at the same slot and seed leaves the phase unchanged within [0, 1).
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes the actual record owner and observes actor-or-padded-slot identity, carried recipe/position/heading and phase laws; wrong carrier fields, padding, actor override or seed/slot dependence changes the result.
 * @evidence contracts/testing.md#independent-expectations Literal node names and supplied record fields define the carrier oracle. The phase is read once from the owner to isolate carrier consistency, then checked by repeatability, selected seed/slot differences, unrelated-input invariance and interval bounds; this does not independently certify its exact seeded numeric value.
 * @evidence contracts/testing.md#distinguishing-cases Keeps anonymous/promoted members, slot zero, six-digit padding, a seven-digit slot, adjacent-slot/seed twins and changed actor/position/recipe/heading; placement admission and malformed/out-of-range slots belong to the owning slot-placement suites.
 * @evidence contracts/testing.md#execution-ownership The named synchronous test_engine_formation_slot_record directly imports its portable source owner, owns every named fact and starts no renderer, process or native build.
 */
export function test_engine_formation_slot_record(): void {
  const phase: number = formationSlotRecord(UNIT, 7, {
    actor: null,
    position: AT,
  }).motionPhase;
  TestValidator.predicate(
    "an anonymous slot is named by its formation and slot",
    test12ValuesClose(
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
    ),
  );
  TestValidator.predicate(
    "a hero slot is named by its actor and keeps the slot's phase",
    test12ValuesClose(
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
    ),
  );

  const recordPhase: (
    unit: typeof UNIT,
    slot: number,
    member: { actor: string | null; position: typeof AT },
  ) => number = (
    unit: typeof UNIT,
    slot: number,
    member: { actor: string | null; position: typeof AT },
  ): number => formationSlotRecord(unit, slot, member).motionPhase;
  TestValidator.equals(
    "the node pads the slot and the phase follows only slot and seed",
    namedFacts([
      [
        "padded",
        (): boolean =>
          formationSlotRecord(UNIT, 0, { actor: null, position: AT }).node ===
          "formation:levy:slot:000000",
      ],
      [
        "wide",
        (): boolean =>
          formationSlotRecord(UNIT, 1_234_567, { actor: null, position: AT })
            .node === "formation:levy:slot:1234567",
      ],
      [
        "neighbourDiffers",
        (): boolean =>
          recordPhase(UNIT, 8, { actor: null, position: AT }) !== phase,
      ],
      [
        "seedDiffers",
        (): boolean =>
          recordPhase({ ...UNIT, seed: 43 }, 7, {
            actor: null,
            position: AT,
          }) !== phase,
      ],
      [
        "unmovedByTheRest",
        (): boolean =>
          nclose(
            recordPhase({ ...UNIT, modelRecipe: "other", facingDeg: 90 }, 7, {
              actor: "banner",
              position: { x: 9, y: 9, z: 9 },
            }),
            phase,
            0,
          ),
      ],
      ["unitInterval", (): boolean => phase >= 0 && phase < 1],
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
}

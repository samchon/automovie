import { AutoMovieEnginePopulationFormation } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

const UNIT: Parameters<typeof AutoMovieEnginePopulationFormation.formationSlotRecord>[0] = {
  id: "levy",
  model: "member",
  facingDeg: 30,
  seed: 42,
};
const AT: IAutoMovieVector3 = { x: 1, y: 2.5, z: -3 };

/**
 * One formation slot regenerates to the member record its identity law names.
 *
 * Literal node names and carried actor, model, heading and position are checked separately from phase. The phase checks repeatability, selected seed/slot differences and invariance under other record edits; they do not reconstruct the kernel's seeded numeric value.
 *
 * Scenarios:
 *
 * 1. An anonymous slot is named by the formation id and six-digit slot and carries the base model, heading, supplied position and phase observed for the same slot and seed.
 * 2. The same slot with an actor is named by that actor and keeps the same phase.
 * 3. Slot 0 pads to six digits and slot 1234567 keeps all seven.
 * 4. The selected neighbouring slot and changed seed draw different phases, while another actor, position, model or heading at the same slot and seed leaves the phase unchanged within [0, 1).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Invokes the actual record owner and observes actor-or-padded-slot identity, carried model/position/heading and phase laws; wrong carrier fields, padding, actor override or seed/slot dependence changes the result.
 * @evidence contracts/development/testing.md#independent-expectations Literal node names and supplied record fields define the carrier oracle. The phase is read once from the owner to isolate carrier consistency, then checked by repeatability, selected seed/slot differences, unrelated-input invariance and interval bounds; this does not independently certify its exact seeded numeric value.
 * @evidence contracts/development/common.md#meaningful-documentation Anonymous and hero slots carry their authored identity and share phase. Slot padding, a neighbouring slot, a changed seed and placement-only changes distinguish name construction from phase identity.
 */
export function test_engine_formation_slot_record(): void {
  const phase: number = AutoMovieEnginePopulationFormation.formationSlotRecord(UNIT, 7, {
    actor: null,
    position: AT,
  }).motionPhase;
  TestValidator.predicate(
    "an anonymous slot is named by its formation and slot",
    test12ValuesClose(
      AutoMovieEnginePopulationFormation.formationSlotRecord(UNIT, 7, { actor: null, position: AT }),
      {
        slot: 7,
        node: "formation:levy:slot:000007",
        actor: null,
        model: "member",
        position: { x: 1, y: 2.5, z: -3 },
        facingDeg: 30,
        motionPhase: phase,
      },
    ),
  );
  TestValidator.predicate(
    "a hero slot is named by its actor and keeps the slot's phase",
    test12ValuesClose(
      AutoMovieEnginePopulationFormation.formationSlotRecord(UNIT, 7, { actor: "captain", position: AT }),
      {
        slot: 7,
        node: "captain",
        actor: "captain",
        model: "member",
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
  ): number => AutoMovieEnginePopulationFormation.formationSlotRecord(unit, slot, member).motionPhase;
  TestValidator.equals(
    "the node pads the slot and the phase follows only slot and seed",
    namedFacts([
      [
        "padded",
        (): boolean =>
          AutoMovieEnginePopulationFormation.formationSlotRecord(UNIT, 0, { actor: null, position: AT }).node ===
          "formation:levy:slot:000000",
      ],
      [
        "wide",
        (): boolean =>
          AutoMovieEnginePopulationFormation.formationSlotRecord(UNIT, 1_234_567, { actor: null, position: AT })
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
            recordPhase({ ...UNIT, model: "other", facingDeg: 90 }, 7, {
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

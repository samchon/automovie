import {
  compiledFormationSlot,
  formationSlot,
  materializeCompiledFormation,
  worldRamp,
} from "@automovie/engine";
import type {
  IAutoMovieCompiledFormation,
  IAutoMovieFormationDesign,
  IAutoMovieFormationSlot,
  IAutoMovieWorldSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, throwsError } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/** Thirty dressed members in five files, two of them promoted to heroes. */
const unit: () => IAutoMovieFormationDesign =
  (): IAutoMovieFormationDesign => ({
    id: "levy",
    model: "member",
    count: 30,
    layout: {
      kind: "line",
      files: 5,
      ranks: 6,
      spacing: { lateral: 2, depth: 3 },
      dressing: { lateral: 0.3, depth: 0.2 },
    },
    anchor: { x: 4, y: 1, z: 2 },
    facingDeg: 30,
    seed: 42,
    capabilities: [],
    heroOverrides: [
      { slot: 7, actor: "captain" },
      { slot: 22, actor: "standard" },
    ],
  });

/** A bank rising half a metre per metre toward +z under the whole unit. */
const bank: IAutoMovieWorldSurface = worldRamp({
  id: "bank",
  from: { x: 0, z: -20 },
  to: { x: 0, z: 40 },
  width: 80,
  baseHeight: 1 - 11,
  rise: 30,
  walkable: true,
});

/**
 * A member regenerated from a compiled formation is the member the grounded
 * design places, hero or anonymous.
 *
 * The compiled record spells a hero as a promoted slot and carries its terrain
 * as a snapshot, so the regenerator reads both from the record. The design
 * regenerator is the other spelling of the same identity law; this pins the two
 * equal on every authored slot. Because both paths share their placement and
 * record helpers, parity is supplemented by the independently authored bank
 * equation and literal hero/anonymous identity expectations.
 *
 * Scenarios:
 *
 * 1. Every slot of a dressed, turned unit on a bank regenerates from the compiled
 *    record exactly as the design regenerates it with the same terrain, down to
 *    node, actor, model, position, heading and motion phase.
 * 2. A hero slot is named by its actor and an anonymous slot by the formation id
 *    and six-digit slot, from the compiled record and from the design alike.
 * 3. The design without its terrain places a member up the bank at the anchor's
 *    own height, which is the flat answer a compiled record does not give.
 * 4. A slot outside the formation refuses.
 *
 * @evidence contracts/testing.md#behavioral-verification Materializes the existing dressed/turned 30-member design on a ramp, regenerates every compiled slot and compares its full record to the grounded design path, then checks hero/anonymous identity, terrain relief versus an ungrounded twin, and outside-slot refusal.
 * @evidence contracts/testing.md#independent-expectations The authored bank rises 30 metres over 60 starting at z=-20,y=-10, giving world height y=z/2 independently of formation helpers; all 30 regenerated points must satisfy it. Explicit captain and formation:levy:slot:000003 identities anchor promotion/naming, while an ungrounded member must retain anchor y=1. Design/compiled record parity alone shares formationSlotPosition/formationSlotRecord and is not an independent oracle for their seed or placement formula.
 * @evidence contracts/testing.md#distinguishing-cases Promoted slot 7 and anonymous slot 3 distinguish actor/node mapping; highest-z terrain placement must differ from the ungrounded anchor-height answer. The full array comparison retains every slot's fields and length, and slot 30 must refuse outside the 0..29 range.
 * @evidence contracts/testing.md#execution-ownership Uses local immutable design/ramp records and synchronous compiler/regenerator calls, with existing structural numeric and Error predicates. Formation ground caches may retain weak per-record datum entries, but this case opens no renderer/resources/clock or global replacement; it does not execute viewer/shot-source application or independently certify phase hashing.
 */
export function test_engine_compiled_formation_slot(): void {
  const design: IAutoMovieFormationDesign = unit();
  const compiled: IAutoMovieCompiledFormation = materializeCompiledFormation({
    formation: design,
    surfaces: [bank],
  });
  const regenerated: IAutoMovieFormationSlot[] = Array.from(
    { length: design.count },
    (_: unknown, slot: number): IAutoMovieFormationSlot =>
      compiledFormationSlot(compiled, slot),
  );

  TestValidator.predicate(
    "a compiled member is the member the grounded design places",
    test12ValuesClose(
      regenerated,
      Array.from(
        { length: design.count },
        (_: unknown, slot: number): IAutoMovieFormationSlot =>
          formationSlot({ ...design, ground: compiled.ground }, slot),
      ),
    ),
  );

  TestValidator.predicate(
    "every compiled member stands on the independently authored bank y=z/2",
    regenerated.length === 30 &&
      regenerated.every((member: IAutoMovieFormationSlot): boolean =>
        nclose(member.position.y, member.position.z / 2, 1e-9),
      ),
  );
  const upTheBank: IAutoMovieFormationSlot = regenerated.reduce(
    (
      highest: IAutoMovieFormationSlot,
      member: IAutoMovieFormationSlot,
    ): IAutoMovieFormationSlot =>
      member.position.z > highest.position.z ? member : highest,
  );
  TestValidator.equals(
    "a compiled member keeps its identity and stands on its terrain",
    namedFacts([
      [
        "hero",
        (): boolean =>
          regenerated[7]!.node === "captain" &&
          regenerated[7]!.actor === "captain",
      ],
      [
        "anonymous",
        (): boolean =>
          regenerated[3]!.node === "formation:levy:slot:000003" &&
          regenerated[3]!.actor === null,
      ],
      [
        "onTheBank",
        (): boolean =>
          compiled.ground.length === 1 &&
          upTheBank.position.y > design.anchor.y + 1,
      ],
      [
        "flatWithoutTerrain",
        (): boolean =>
          nclose(
            formationSlot(design, upTheBank.slot).position.y,
            design.anchor.y,
            1e-12,
          ),
      ],
      [
        "designHero",
        (): boolean =>
          formationSlot(design, 7).node === "captain" &&
          formationSlot(design, 7).actor === "captain",
      ],
      [
        "designAnonymous",
        (): boolean =>
          formationSlot(design, 3).node === "formation:levy:slot:000003" &&
          formationSlot(design, 3).actor === null,
      ],
      [
        "outside",
        (): boolean =>
          throwsError(
            (): IAutoMovieFormationSlot => compiledFormationSlot(compiled, 30),
            'Formation "levy" slot 30 is outside 0..29',
          ),
      ],
    ]),
    {
      hero: true,
      anonymous: true,
      onTheBank: true,
      flatWithoutTerrain: true,
      designHero: true,
      designAnonymous: true,
      outside: true,
    },
  );
}

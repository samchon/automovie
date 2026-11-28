import { AutoMovieEnginePopulationFormation } from "@automovie/engine";
import type {
  IAutoMovieFormationPlacement,
  IAutoMovieVector3,
  IAutoMovieWorldSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../../internal/predicates";

/** A short rank has three files at -4, 0 and 4 m on the formation's X axis. */
const rank: IAutoMovieFormationPlacement = {
  id: "rank",
  count: 3,
  layout: {
    kind: "line",
    ranks: 1,
    files: 3,
    spacing: { lateral: 4, depth: 3 },
  },
  anchor: { x: 0, y: 0, z: 0 },
  facingDeg: 0,
  seed: 7,
};

/**
 * A formation slot applies bounded seeded dressing, yaw and terrain relief.
 *
 * Scenarios:
 *
 * 1. Omitted or zero dressing preserves the lattice. A declared bound produces a
 *    reproducible offset across separate records. Changing the seed varies it.
 * 2. Constant ground keeps the anchor. On sloping ground, the relative height
 *    comes from the turned member's world position and retains clearance.
 * 3. A nonplanar ridge, an uncovered member and a missing anchor datum distinguish
 *    per-member relief from a shared or extrapolated offset.
 * 4. A fractional or NaN slot raises a safe-integer error.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names seed-based dressing, the relation between unit heading and the world slope, the terrain coverage required at the anchor and member, and invalid slot indices.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `formationSlotPosition` on a twelve-slot line and a three-slot rank with literal ground records. Cloned inputs check replay, a different seed must move slot zero, and the terrain assertions check absolute placement or preserved staging where a datum is absent. Separate fractional and NaN inputs must throw a RangeError before placement.
 * @evidence contracts/development/testing.md#independent-expectations The lattice has X values -4, 0, and 4 m and increases Z by 3 m per rank. Dressing is bounded by 0.25 m laterally and 0.4 m in depth. A quarter turn maps the outer files to Z ±4 m, yielding Y ±2 m on a 0.5 slope within 1e-12 m for rotation roundoff. The ridge samples 4, 5, and 4 m give 4.5 m halfway between adjacent knots.
 */
export function test_engine_space_formation_slot_position(): void {
  const layout: Extract<
    IAutoMovieFormationPlacement["layout"],
    { kind: "line" }
  > = {
    kind: "line",
    ranks: 4,
    files: 3,
    spacing: { lateral: 4, depth: 3 },
  };
  const formation: IAutoMovieFormationPlacement = {
    ...rank,
    count: 12,
    layout,
  };
  for (const slot of [0.5, NaN]) {
    let refused: boolean = false;
    try {
      AutoMovieEnginePopulationFormation.formationSlotPosition(formation, slot);
    } catch (error) {
      refused =
        error instanceof RangeError && error.message.includes("safe integer");
    }
    TestValidator.predicate(`malformed slot ${slot}`, refused);
  }
  const zero: IAutoMovieFormationPlacement = {
    ...formation,
    layout: { ...layout, dressing: { lateral: 0, depth: 0 } },
  };
  const dressed: IAutoMovieFormationPlacement = {
    ...formation,
    layout: { ...layout, dressing: { lateral: 0.25, depth: 0.4 } },
  };
  const lateral: IAutoMovieFormationPlacement = {
    ...formation,
    layout: { ...layout, dressing: { lateral: 0.25, depth: 0 } },
  };
  const replayed: IAutoMovieFormationPlacement = structuredClone(dressed);
  const slots: number[] = Array.from(
    { length: formation.count },
    (_, slot): number => slot,
  );
  for (const slot of slots) {
    const lattice: IAutoMovieVector3 = {
      x: ((slot % 3) - 1) * 4,
      y: 0,
      z: Math.floor(slot / 3) * 3,
    };
    const point: IAutoMovieVector3 = AutoMovieEnginePopulationFormation.formationSlotPosition(dressed, slot);
    const laterally: IAutoMovieVector3 = AutoMovieEnginePopulationFormation.formationSlotPosition(lateral, slot);
    TestValidator.predicate(
      `slot ${slot} keeps its lattice without dressing and varies only as authored`,
      vclose(AutoMovieEnginePopulationFormation.formationSlotPosition(formation, slot), lattice, 0) &&
        vclose(AutoMovieEnginePopulationFormation.formationSlotPosition(zero, slot), lattice, 0) &&
        !vclose(point, lattice, 1e-12) &&
        Math.abs(point.x - lattice.x) <= 0.25 &&
        Math.abs(point.z - lattice.z) <= 0.4 &&
        vclose(point, AutoMovieEnginePopulationFormation.formationSlotPosition(replayed, slot), 0) &&
        nclose(laterally.z, lattice.z, 0) &&
        nclose(laterally.x, point.x, 0),
    );
  }
  TestValidator.predicate(
    "a different seed changes the same slot's dressing",
    !vclose(
      AutoMovieEnginePopulationFormation.formationSlotPosition(dressed, 0),
      AutoMovieEnginePopulationFormation.formationSlotPosition({ ...dressed, seed: 8 }, 0),
      1e-12,
    ),
  );

  const floor: IAutoMovieWorldSurface = {
    id: "flat",
    polygon: [
      { x: -20, z: -20 },
      { x: 20, z: -20 },
      { x: 20, z: 20 },
      { x: -20, z: 20 },
    ],
    height: { kind: "constant", value: 7.25 },
    walkable: true,
  };
  const ground: IAutoMovieWorldSurface = {
    ...floor,
    height: { kind: "constant", value: 0 },
  };
  const slope: IAutoMovieWorldSurface = {
    ...floor,
    id: "bank",
    height: { kind: "plane", originHeight: 0, slopeX: 0, slopeZ: 0.5 },
  };
  for (const slot of slots) {
    const x: number = ((slot % 3) - 1) * 4;
    const z: number = Math.floor(slot / 3) * 3;
    TestValidator.predicate(
      `slot ${slot} uses its own slope height and retains any raised clearance`,
      vclose(
        AutoMovieEnginePopulationFormation.formationSlotPosition({ ...formation, ground: [ground] }, slot),
        { x, y: 0, z },
        0,
      ) &&
        vclose(
          AutoMovieEnginePopulationFormation.formationSlotPosition({ ...formation, ground: [floor] }, slot),
          { x, y: 0, z },
          0,
        ) &&
        vclose(
          AutoMovieEnginePopulationFormation.formationSlotPosition({ ...formation, ground: [slope] }, slot),
          { x, y: z / 2, z },
          0,
        ) &&
        vclose(
          AutoMovieEnginePopulationFormation.formationSlotPosition(
            {
              ...formation,
              ground: [slope],
              anchor: { x: 0, y: 2.5, z: 0 },
            },
            slot,
          ),
          { x, y: z / 2 + 2.5, z },
          0,
        ),
    );
  }
  const turned: IAutoMovieFormationPlacement = {
    ...rank,
    ground: [slope],
    facingDeg: 90,
  };
  TestValidator.predicate(
    "the world Z half-slope affects a rotated rank but not an unturned one",
    vclose(AutoMovieEnginePopulationFormation.formationSlotPosition(turned, 0), { x: 0, y: 2, z: 4 }, 1e-12) &&
      vclose(AutoMovieEnginePopulationFormation.formationSlotPosition(turned, 1), { x: 0, y: 0, z: 0 }, 1e-12) &&
      vclose(AutoMovieEnginePopulationFormation.formationSlotPosition(turned, 2), { x: 0, y: -2, z: -4 }, 1e-12) &&
      nclose(AutoMovieEnginePopulationFormation.formationSlotPosition({ ...turned, facingDeg: 0 }, 0).y, 0, 0),
  );

  const ridge: IAutoMovieWorldSurface = {
    ...floor,
    id: "ridge",
    height: {
      kind: "heightfield",
      originX: -4,
      originZ: 0,
      spacingX: 4,
      spacingZ: 10,
      columns: 3,
      rows: 2,
      samples: [4, 5, 4, 4, 5, 4],
    },
  };
  const crest: IAutoMovieFormationPlacement = {
    ...rank,
    layout: {
      kind: "line",
      ranks: 1,
      files: 3,
      spacing: { lateral: 2, depth: 3 },
    },
    anchor: { x: 0, y: 5, z: 0 },
    ground: [ridge],
  };
  TestValidator.predicate(
    "the ridge peaks between symmetric lower files",
    nclose(AutoMovieEnginePopulationFormation.formationSlotPosition(crest, 0).y, 4.5, 0) &&
      nclose(AutoMovieEnginePopulationFormation.formationSlotPosition(crest, 1).y, 5, 0) &&
      nclose(AutoMovieEnginePopulationFormation.formationSlotPosition(crest, 2).y, 4.5, 0) &&
      nclose(
        AutoMovieEnginePopulationFormation.formationSlotPosition({ ...crest, layout: rank.layout }, 2).y,
        4,
        0,
      ) &&
      nclose(
        AutoMovieEnginePopulationFormation.formationSlotPosition({ ...crest, layout: rank.layout }, 0).y,
        4,
        0,
      ),
  );

  const near: IAutoMovieWorldSurface = {
    ...slope,
    polygon: [
      { x: -20, z: -20 },
      { x: 20, z: -20 },
      { x: 20, z: 4 },
      { x: -20, z: 4 },
    ],
  };
  const distant: IAutoMovieWorldSurface = {
    ...slope,
    polygon: [
      { x: -20, z: 5 },
      { x: 20, z: 5 },
      { x: 20, z: 20 },
      { x: -20, z: 20 },
    ],
  };
  TestValidator.predicate(
    "covered slots rise, while missing ground or a missing datum preserves staging",
    nclose(
      AutoMovieEnginePopulationFormation.formationSlotPosition({ ...formation, ground: [near] }, 3).y,
      1.5,
      0,
    ) &&
      nclose(
        AutoMovieEnginePopulationFormation.formationSlotPosition({ ...formation, ground: [near] }, 6).y,
        0,
        0,
      ) &&
      nclose(
        AutoMovieEnginePopulationFormation.formationSlotPosition(
          {
            ...formation,
            ground: [distant],
            anchor: { x: 0, y: 1.5, z: 0 },
          },
          6,
        ).y,
        1.5,
        0,
      ) &&
      nclose(
        AutoMovieEnginePopulationFormation.formationSlotPosition(
          {
            ...formation,
            ground: [floor],
            anchor: { x: 0, y: 0.75, z: 40 },
          },
          0,
        ).y,
        0.75,
        0,
      ),
  );
}

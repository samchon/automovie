import { AutoMovieArchetypeDrinkware } from "@automovie/archetypes";
import {
  AutoMovieArchetypeEnvironment
} from "../../../../packages/archetypes/src/environments/AutoMovieArchetypeEnvironment";
import {
  AutoMovieArchetypeEnvironmentFurnishing
} from "../../../../packages/archetypes/src/environments/AutoMovieArchetypeEnvironmentFurnishing";
import type {
  IAutoMovieEnvironment,
  IAutoMovieEnvironmentItem,
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * Stage furnished rooms, a supported table prop and sound layout refusals.
 *
 * Scenarios:
 *
 * 1. A quarter-turned cafe with four dining groups and a two-station gym emit
 *    unique matching stage, model and prop identities. A cup authoring entry
 *    precedes its host and still rests on the scoped table.
 * 2. A chosen chair keeps its independently predicted world position after
 *    reseeding. Explicitly retaining the original table position leaves its
 *    automatic partner chair unmoved. The seated contact and the gym's floor
 *    weight preserve their contacts.
 * 3. A named door swing refuses an overlapping chair override, a shallow gym
 *    refuses its station count and a cup placed beyond the table cannot claim
 *    its support.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Checks café and gym kit populations, explicit overrides across seeds and a turned layout. Exercises table and cup support, invalid layout capacity, a reserved door swing and a narrow gym aisle.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public environment and producer exports, reads the staged and runtime records, and observes layout and bearing refusals through ordinary construction.
 * @evidence contracts/development/testing.md#independent-expectations Counts one counter plus four sets of three, two stations with three pieces each and one cup. The literal quarter-turn oracle maps room X to negative world Z and room Z to positive world X. The dining table height range comes from the table producer's documented bounds. The reserved swing covers the overridden chair centre and the narrow gym leaves less than one 915 mm aisle at each end.
 */
export function test_environment_furnishing(): void {
  const cafeLayout: Parameters<
    typeof AutoMovieArchetypeEnvironmentFurnishing.cafeKit
  >[0] = {
    room: { width: 10, depth: 10 },
    tables: 4,
    keepClear: { entry: { x: -0.5, z: 4, width: 1, depth: 1 } },
    overrides: { "table-1/chair-near": { at: { x: 3, z: 3 }, heading: 90 } },
  };
  const cup: IAutoMovieEnvironmentItem = {
    at: { anchor: "cafe/table-1/stack" },
    use: AutoMovieArchetypeEnvironmentFurnishing.prop({
      model: AutoMovieArchetypeDrinkware.create({ kind: "cup" }),
      placement: {
        relations: [
          {
            kind: "on-support",
            target: {
              kind: "prop-affordance",
              prop: "facility/cafe/table-1",
              affordance: "stack",
            },
          },
        ],
        footprint: null,
        clearance: [],
      },
    }),
  };
  const items: Readonly<Record<string, IAutoMovieEnvironmentItem>> = {
    cup,
    cafe: {
      at: { x: 10, y: 2, z: 4 },
      rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
      use: AutoMovieArchetypeEnvironmentFurnishing.cafeKit(cafeLayout),
    },
    gym: {
      at: { x: -10, y: 0, z: 0 },
      use: AutoMovieArchetypeEnvironmentFurnishing.gymKit({
        room: { width: 6, depth: 5 },
        stations: 2,
      }),
    },
  };
  const plan: IAutoMovieEnvironment = AutoMovieArchetypeEnvironment.create({
    id: "facility",
    seed: 1,
    items,
  });
  const propIds: Set<string> = new Set(
    plan.runtime.props.map((prop: IAutoMoviePropSpec): string => prop.node),
  );
  const pieces: Map<string, IAutoMovieStageSetPiece> = new Map(
    plan.stage.set?.map(
      (part: IAutoMovieStageSetPiece): [string, IAutoMovieStageSetPiece] => [
        part.node,
        part,
      ],
    ),
  );
  TestValidator.predicate(
    "two kits use one staged model and prop per named object",
    propIds.size === 20 &&
      pieces.size === 20 &&
      plan.runtime.models.length === 20 &&
      plan.runtime.props.every(
        (prop: IAutoMoviePropSpec): boolean =>
          pieces.get(prop.node)?.model === prop.node &&
          prop.model.id === prop.node,
      ),
  );
  const table: IAutoMovieVector3 = pieces.get(
    "facility/cafe/table-1",
  )!.position;
  const cupPoint: IAutoMovieVector3 = pieces.get("facility/cup")!.position;
  TestValidator.predicate(
    "cup base is on the turn-transformed table at dining height",
    nclose(cupPoint.x, table.x) &&
      nclose(cupPoint.z, table.z) &&
      cupPoint.y >= 2.71 &&
      cupPoint.y <= 2.762 &&
      vclose(plan.anchors["cafe/table-1/stack"]!.translation, cupPoint),
  );
  const reseeded: IAutoMovieEnvironment = AutoMovieArchetypeEnvironment.create({
    id: "facility",
    seed: 2,
    items,
  });
  const role: string = "cafe/table-1/chair-near";
  const automatic: string = "cafe/table-1/chair-far";
  const pinnedTable: IAutoMovieEnvironment = AutoMovieArchetypeEnvironment.create({
    id: "facility",
    seed: 1,
    items: {
      ...items,
      cafe: {
        ...items.cafe!,
        use: AutoMovieArchetypeEnvironmentFurnishing.cafeKit({
          ...cafeLayout,
          overrides: {
            ...cafeLayout.overrides,
            "table-1": { at: { x: 4 - table.z, z: table.x - 10 } },
          },
        }),
      },
    },
  });
  const seat: IAutoMovieVector3 = plan.anchors[`${role}/seat`]!.translation;
  const dumbbell: IAutoMovieVector3 = pieces.get(
    "facility/gym/bench-1/dumbbell-left",
  )!.position;
  TestValidator.predicate(
    "hero override follows the room without phantom occupancy and the gym keeps its grip",
    vclose(plan.anchors[role]!.translation, { x: 13, y: 2, z: 1 }) &&
      vclose(reseeded.anchors[role]!.translation, { x: 13, y: 2, z: 1 }) &&
      vclose(
        pinnedTable.anchors[automatic]!.translation,
        plan.anchors[automatic]!.translation,
      ) &&
      seat.y > 2 &&
      dumbbell.y > 0 &&
      vclose(
        plan.anchors["gym/bench-1/dumbbell-left/grip"]!.translation,
        dumbbell,
      ),
  );
  TestValidator.predicate(
    "room capacity, a door swing and table bearing have distinct refusals",
    throwsError(
      (): IAutoMovieEnvironment =>
        AutoMovieArchetypeEnvironment.create({
          id: "small",
          items: {
            gym: {
              use: AutoMovieArchetypeEnvironmentFurnishing.gymKit({
                room: { width: 2, depth: 2 },
                stations: 3,
              }),
            },
          },
        }),
      ["small/gym", "stations cannot fit 3"],
    ) &&
      throwsError(
        (): IAutoMovieEnvironment =>
          AutoMovieArchetypeEnvironment.create({
            id: "door",
            items: {
              cafe: {
                use: AutoMovieArchetypeEnvironmentFurnishing.cafeKit({
                  room: { width: 8, depth: 7 },
                  tables: 1,
                  keepClear: { swing: { x: -0.5, z: 0.5, width: 1, depth: 1 } },
                  overrides: { "table-1/chair-near": { at: { x: 0, z: 1 } } },
                }),
              },
            },
          }),
        ["overrides.table-1/chair-near", "keepClear.swing"],
      ) &&
      throwsError(
        (): IAutoMovieEnvironment =>
          AutoMovieArchetypeEnvironment.create({
            id: "facility",
            seed: 1,
            items: {
              ...items,
              cup: {
                ...cup,
                at: {
                  anchor: "cafe/table-1/stack",
                  offset: { x: 2, y: 0, z: 0 },
                },
              },
            },
          }),
        [
          "props[0].placement.relations[0].target.affordance",
          "does not stand over",
          "facility/cafe/table-1",
        ],
      ),
  );
}

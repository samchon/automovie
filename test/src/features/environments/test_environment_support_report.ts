import { AutoMovieArchetypeSeat, AutoMovieArchetypeMoldedCrate, AutoMovieArchetypeMirror, AutoMovieArchetypeRock, AutoMovieArchetypeDrinkware, AutoMovieArchetypeTable } from "@automovie/archetypes";
import { AutoMovieEnvironment, AutoMovieEnvironmentFurnishing } from "@automovie/archetypes/environments";
import { AutoMovieEngineBuiltEnvironment, AutoMovieEngineBuiltEnvironmentWorkflow, AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltFloatingBody,
  IAutoMovieBuiltSupportSweepReport,
  IAutoMovieEnvironment,
  IAutoMovieEnvironmentItem,
  IAutoMovieEnvironmentSupportReport,
  IAutoMovieModel,
  IAutoMoviePropBox,
  IAutoMovieSetPieceSupport,
  IAutoMovieStageSetPiece,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

/**
 * A composed environment reports how every staged set piece is supported,
 * without refusing a floating or sunk one.
 *
 * Scenarios:
 *
 * 1. A furnished cafe on a terrain pad: every table, chair and the counter is
 *    `resting` on the terrain's ground surface.
 * 2. A crate placed 0.8 m above level ground with no placement is `floating` with
 *    gap 0.8 within 1e-9 m.
 * 3. A crate sunk 0.3 m into the ground is `sunk` with gap -0.3 within 1e-9 m.
 * 4. A cup attached at a table's `stack` anchor with no placement is `resting` on
 *    that table.
 * 5. A cup with a declared `on-support` placement is `declared`.
 * 6. A wall mirror placed by a furnishing `wall` relation is `wall-borne`, naming
 *    its wall; the same mirror placed by coordinates 0.1 m off that wall is
 *    `floating`.
 * 7. A composed building's bodies each appear once, with the verdict
 *    `builtEnvironmentSupportSweep` gives that building alone.
 * 8. Every node appears exactly once, in stage order.
 * 9. The report is a pure function of the other outputs: recomputing it from the
 *    environment's own stage and runtime gives the same findings, and the same
 *    recipe repeats every output byte for byte.
 * 10. A furnished interior with a sofa, a coffee table and a hung wall mirror, and
 *     an outdoor set of a wood, a trail, a rock and a bench on level ground,
 *     report no `floating` or `sunk` piece; the mirror is `wall-borne`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds environments through the public producers and reads `support`, which catches a floating or sunk piece reported resting, a tucked or attached piece judged against the wrong support, a hung piece not judged against its wall, a declared prop measured again, a building body judged differently from its own sweep and a duplicated or missing node.
 * @evidence contracts/development/testing.md#independent-expectations The 0.8 m and -0.3 m gaps are the authored placements plus the crate's rest-box underside measured through the engine; the building verdicts come from the building sweep run separately; the wall and table ids are the producers' documented names.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs a floating and a sunk crate, an attached and a declared cup, a mirror on its wall and 0.1 m off it, and furnished pieces against building bodies; `test_architecture_built_environment_placement` owns the building sweep's own cases.
 * @evidence contracts/development/testing.md#execution-ownership A CPU-only feature scenario over in-memory environments; it starts no renderer or host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists its ten scenarios with the input and expected behavior of each.
 */
export function test_environment_support_report(): void {
  const crate: IAutoMovieModel = AutoMovieArchetypeMoldedCrate.create({}, 1021);
  const crateRest: IAutoMoviePropBox = AutoMovieEngineFilm.computeModelRestExtent(crate)!;
  const level: () => IAutoMovieEnvironmentItem =
    (): IAutoMovieEnvironmentItem => ({
      at: { x: -10, y: 0, z: -10 },
      use: AutoMovieEnvironment.terrain({ size: [20, 20] }),
    });
  const cup: (
    declared: boolean,
    table: "table-1" | "table-2",
  ) => IAutoMovieEnvironmentItem = (
    declared: boolean,
    table: "table-1" | "table-2",
  ): IAutoMovieEnvironmentItem => ({
    at: { anchor: `cafe/${table}/stack` },
    use: AutoMovieEnvironmentFurnishing.prop({
      model: AutoMovieArchetypeDrinkware.create({ kind: "cup" }),
      ...(declared
        ? {
            placement: {
              relations: [
                {
                  kind: "on-support",
                  target: {
                    kind: "prop-affordance",
                    prop: `set/cafe/${table}`,
                    affordance: "stack",
                  },
                },
              ],
              footprint: null,
              clearance: [],
            },
          }
        : {}),
    }),
  });

  // Scenarios 1 to 5 and 7: a terrain with a pad, a cafe on it, two crates,
  // two cups and a building on level ground beside it.
  const set: IAutoMovieEnvironment = AutoMovieEnvironment.create({
    id: "set",
    seed: 5,
    items: {
      land: {
        at: { x: -10, y: 0, z: -10 },
        use: AutoMovieEnvironment.terrain({
          size: [40, 20],
          pads: {
            plaza: {
              outline: [
                [2, 2],
                [18, 2],
                [18, 18],
                [2, 18],
              ],
              height: 0.5,
            },
          },
          amenities: { cafe: [10, 10] },
        }),
      },
      cafe: {
        at: { anchor: "land/amenities/cafe" },
        use: AutoMovieEnvironmentFurnishing.cafeKit({ room: [10, 8], tables: 2 }),
      },
      cupLoose: cup(false, "table-1"),
      cupDeclared: cup(true, "table-2"),
      floatingCrate: {
        at: { x: 14, y: 0.8, z: -6 },
        use: AutoMovieEnvironmentFurnishing.prop({ model: crate }),
      },
      sunkCrate: {
        at: { x: 14, y: -0.3, z: 6 },
        use: AutoMovieEnvironmentFurnishing.prop({ model: crate }),
      },
      hall: {
        at: { x: 22, y: 0, z: -4 },
        use: AutoMovieEnvironment.building({
          levels: [{ id: "ground", rooms: { hall: [0, 0, 6, 6] } }],
        }),
      },
    },
  });
  const finding: (
    environment: IAutoMovieEnvironment,
    node: string,
  ) => IAutoMovieSetPieceSupport | undefined = (
    environment: IAutoMovieEnvironment,
    node: string,
  ): IAutoMovieSetPieceSupport | undefined =>
    environment.support.find(
      (entry: IAutoMovieSetPieceSupport): boolean => entry.node === node,
    );

  // Scenario 6: a mirror on wall +x of a furnished room, and the same mirror
  // 0.1 m off that wall by coordinates.
  const mirror: IAutoMovieModel = AutoMovieArchetypeMirror.create({ kind: "wall" }, 1019);
  const hung: IAutoMovieEnvironment = AutoMovieEnvironment.create({
    id: "home",
    seed: 5,
    items: {
      land: level(),
      room: {
        use: AutoMovieEnvironmentFurnishing.furnishedRoom({
          room: [4, 3.2],
          pieces: {
            mirror: {
              model: mirror,
              place: { kind: "wall", wall: "+x", offset: 1 },
            },
          },
        }),
      },
    },
  });
  const frame: IAutoMovieTransform = hung.anchors["room/mirror"]!;
  const loose: IAutoMovieEnvironment = AutoMovieEnvironment.create({
    id: "home",
    seed: 5,
    items: {
      land: level(),
      mirror: {
        at: {
          x: frame.translation.x - 0.1,
          y: frame.translation.y,
          z: frame.translation.z,
        },
        rotation: frame.rotation,
        use: AutoMovieEnvironmentFurnishing.prop({ model: mirror }),
      },
    },
  });

  // Scenario 7: the building's own sweep at its placement height.
  const building: IAutoMovieBuiltEnvironment = set.builtEnvironments[0]!;
  const sweep: IAutoMovieBuiltSupportSweepReport = AutoMovieEngineBuiltEnvironment.environmentSupportSweep(
    { environment: building, groundY: 0 },
  );
  const floatingIds: Set<string> = new Set(
    sweep.floating.map(
      (body: IAutoMovieBuiltFloatingBody): string => body.body.id,
    ),
  );

  // Scenario 10: a furnished interior with a hung mirror on a floor, and an
  // outdoor set of a wood, a trail, a rock and a bench on level ground.
  const interior: IAutoMovieEnvironment = AutoMovieEnvironment.create({
    id: "interior",
    seed: 5,
    items: {
      floor: level(),
      room: {
        use: AutoMovieEnvironmentFurnishing.furnishedRoom({
          room: [4, 3.2],
          pieces: {
            sofa: {
              model: AutoMovieArchetypeSeat.create({ kind: "sofa" }, 1022),
              place: { kind: "wall", wall: "-z", offset: 0.4 },
            },
            coffee: {
              model: AutoMovieArchetypeTable.create({ kind: "coffee" }, 1016),
              place: { kind: "facing", target: "sofa", distance: 0.45 },
            },
            mirror: {
              model: mirror,
              place: { kind: "wall", wall: "+x", offset: 1 },
            },
          },
        }),
      },
    },
  });
  const outdoor: IAutoMovieEnvironment = AutoMovieEnvironment.create({
    id: "outdoor",
    seed: 5,
    items: {
      land: {
        at: { x: -15, y: 0, z: -10 },
        use: AutoMovieEnvironment.terrain({
          size: [30, 20],
          paths: {
            trail: {
              points: [
                [2, 10],
                [28, 10],
              ],
              width: 2,
            },
          },
          woods: {
            stand: {
              outline: [
                [4, 3],
                [26, 3],
                [26, 17],
                [4, 17],
              ],
              spacing: 5,
            },
          },
          amenities: { rock: [3, 12], bench: [27, 8] },
        }),
      },
      rock: {
        at: { anchor: "land/amenities/rock" },
        use: AutoMovieEnvironmentFurnishing.prop({
          model: AutoMovieArchetypeRock.create({ kind: "boulder" }, 1023),
        }),
      },
      bench: {
        at: { anchor: "land/amenities/bench" },
        use: AutoMovieEnvironmentFurnishing.prop({
          model: AutoMovieArchetypeSeat.create({ kind: "bench" }, 1024),
        }),
      },
    },
  });

  const facts: Record<string, boolean> = namedFacts([
    [
      "every cafe table, chair and the counter rests on the terrain ground",
      (): boolean => {
        const cafe: IAutoMovieSetPieceSupport[] = set.support.filter(
          (entry: IAutoMovieSetPieceSupport): boolean =>
            entry.node.startsWith("set/cafe/"),
        );
        return (
          cafe.length === 7 &&
          cafe.every(
            (entry: IAutoMovieSetPieceSupport): boolean =>
              entry.status === "resting" && entry.support === "set/land/ground",
          )
        );
      },
    ],
    [
      "a crate 0.8 m above level ground floats 0.8 m above it",
      (): boolean => {
        const entry: IAutoMovieSetPieceSupport | undefined = finding(
          set,
          "set/floatingCrate",
        );
        return (
          entry?.status === "floating" &&
          nclose(entry.gap!, 0.8 + crateRest.min.y, 1e-9)
        );
      },
    ],
    [
      "a crate 0.3 m into the ground is sunk by 0.3 m",
      (): boolean => {
        const entry: IAutoMovieSetPieceSupport | undefined = finding(
          set,
          "set/sunkCrate",
        );
        return (
          entry?.status === "sunk" &&
          nclose(entry.gap!, -0.3 + crateRest.min.y, 1e-9)
        );
      },
    ],
    [
      "a cup at a table's stack with no placement rests on the table",
      (): boolean => {
        const entry: IAutoMovieSetPieceSupport | undefined = finding(
          set,
          "set/cupLoose",
        );
        return (
          entry?.status === "resting" && entry.support === "set/cafe/table-1"
        );
      },
    ],
    [
      "a cup with a declared placement is declared",
      (): boolean => {
        const entry: IAutoMovieSetPieceSupport | undefined = finding(
          set,
          "set/cupDeclared",
        );
        return (
          entry?.status === "declared" &&
          entry.gap === null &&
          entry.support === null
        );
      },
    ],
    [
      "a mirror hung by a wall relation is wall-borne on its wall",
      (): boolean => {
        const entry: IAutoMovieSetPieceSupport | undefined = finding(
          hung,
          "home/room/mirror",
        );
        return (
          entry?.status === "wall-borne" &&
          entry.support === "home/room/walls/+x" &&
          nclose(entry.gap!, 0, 1e-9)
        );
      },
    ],
    [
      "the same mirror 0.1 m off the wall by coordinates floats",
      (): boolean => finding(loose, "home/mirror")?.status === "floating",
    ],
    [
      "each building body appears once with its own sweep's verdict",
      (): boolean => {
        const bodies: IAutoMovieBuiltElement[] = building.elements.filter(
          (element: IAutoMovieBuiltElement): boolean => element.model !== null,
        );
        return (
          bodies.length > 0 &&
          bodies.every((element: IAutoMovieBuiltElement): boolean => {
            const entries: IAutoMovieSetPieceSupport[] = set.support.filter(
              (entry: IAutoMovieSetPieceSupport): boolean =>
                entry.node === `${building.id}/${element.id}`,
            );
            return (
              entries.length === 1 &&
              entries[0]!.status ===
                (floatingIds.has(element.id) ? "floating" : "resting")
            );
          })
        );
      },
    ],
    [
      "every staged node appears exactly once, in stage order",
      (): boolean =>
        [set, hung, loose].every(
          (environment: IAutoMovieEnvironment): boolean =>
            JSON.stringify(
              environment.support.map(
                (entry: IAutoMovieSetPieceSupport): string => entry.node,
              ),
            ) ===
            JSON.stringify(
              environment.stage.set.map(
                (piece: IAutoMovieStageSetPiece): string => piece.node,
              ),
            ),
        ),
    ],
    [
      "the report is recomputed from the other outputs, and a rebuild repeats them all",
      (): boolean => {
        const again: IAutoMovieEnvironment = AutoMovieEnvironment.create({
          id: "home",
          seed: 5,
          items: {
            land: level(),
            room: {
              use: AutoMovieEnvironmentFurnishing.furnishedRoom({
                room: [4, 3.2],
                pieces: {
                  mirror: {
                    model: mirror,
                    place: { kind: "wall", wall: "+x", offset: 1 },
                  },
                },
              }),
            },
          },
        });
        const recomputed: IAutoMovieSetPieceSupport[] =
          AutoMovieEngineBuiltEnvironmentWorkflow.environmentSupportReport({
            set: set.stage.set,
            models: set.runtime.models,
            props: set.runtime.props,
            ...(set.stage.space !== undefined
              ? { space: set.stage.space }
              : {}),
            buildings: set.builtEnvironments.map(
              (
                environment: IAutoMovieBuiltEnvironment,
              ): IAutoMovieEnvironmentSupportReport.IBuilding => ({
                environment,
                groundY: 0,
              }),
            ),
          });
        return (
          JSON.stringify(recomputed) === JSON.stringify(set.support) &&
          JSON.stringify(again) === JSON.stringify(hung)
        );
      },
    ],
    [
      "the furnished interior and the outdoor set have no floating or sunk piece",
      (): boolean =>
        [interior, outdoor].every(
          (environment: IAutoMovieEnvironment): boolean =>
            environment.support.length > 0 &&
            environment.support.every(
              (entry: IAutoMovieSetPieceSupport): boolean =>
                entry.status === "resting" ||
                entry.status === "declared" ||
                entry.status === "wall-borne",
            ),
        ) && finding(interior, "interior/room/mirror")?.status === "wall-borne",
    ],
  ]);
  TestValidator.predicate(
    `environment support report: ${Object.entries(facts)
      .filter(([, ok]: [string, boolean]): boolean => !ok)
      .map(([name]: [string, boolean]): string => name)
      .join("; ")}`,
    Object.values(facts).every((ok: boolean): boolean => ok) &&
      Object.keys(facts).length === 11,
  );
}

import { materializeCompiledFormation } from "@automovie/engine";
import type { IAutoMovieCompiledShotSource } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { GEOMETRY_FORMATION_TEST_LOOKING_AWAY as LOOKING_AWAY } from "../internal/GEOMETRY_FORMATION_TEST_LOOKING_AWAY";
import { GEOMETRY_FORMATION_TEST_WORLD as WORLD } from "../internal/GEOMETRY_FORMATION_TEST_WORLD";
import { geometryFormationTestCompiledShot as compiledShot } from "../internal/geometryFormationTestCompiledShot";
import { geometryFormationTestContract as contract } from "../internal/geometryFormationTestContract";
import { geometryFormationTestGroundAt as groundAt } from "../internal/geometryFormationTestGroundAt";
import { geometryFormationTestMeasure as measure } from "../internal/geometryFormationTestMeasure";
import { geometryFormationTestRemoveSlotFive as removeSlotFive } from "../internal/geometryFormationTestRemoveSlotFive";
import { geometryFormationTestUnit as unit } from "../internal/geometryFormationTestUnit";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

/**
 * A formation query reads a unit where its compiled runtime places it, and
 * checks its representative members against the ground under each of them.
 *
 * This pins the defect the query carried while it lived in the production
 * oracle: a representative member was placed from the formation design, which
 * has no terrain, so every member stood at its anchor's height and a unit
 * standing correctly on a rise was reported off its ground. The expected heights
 * come from the rise itself, `(z + 10) / 2`: the front rank at z = 0 stands on
 * 5 m and the rear rank at z = 3 on 6.5 m. The representative members of the one
 * chunk are slots 0, 2 and 5, and slot 5 is in the rear rank.
 *
 * Scenarios:
 *
 * 1. The unit staged on its ground compiles its rear rank at 6.5 m and reports no
 *    ground violation. Placed from the design instead, slot 5 would stand at 5 m
 *    under ground at 6.5 m and be reported.
 * 2. The same unit staged one metre above its ground reports all three
 *    representative members, one staged over ground nobody may stand on reports
 *    all three for walkability alone, and a representative member the shot has
 *    removed is not measured.
 * 3. The unit's counts, extent, centroid, heading, identity motion, route
 *    clearance and digest are reported; from in front its five anonymous members
 *    are drawn near and its banner is visible, and from behind all five are
 *    culled and the banner is not.
 * 4. A world without routes reports no clearance, a missing world reports no
 *    clearance and all three representative members over no ground, a shot
 *    without the banner's node counts no visible hero, and a second
 *    participating shot whose banner performs a root offset is selectable by
 *    name at an asked time.
 * 5. A missing formation, a unit no current shot fully materializes, a shot the
 *    unit is not in, a time outside the shot, a missing camera, and a missing
 *    production frame format each refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Materializes the actual compiled formation and queries representative ground contacts, bounds/centroid, identity motion, route clearance, analytic LOD/hero visibility and correction-bearing participation/time/camera/frame-format refusals.
 * @evidence contracts/testing.md#independent-expectations The authored ramp law, two-by-three layout, literal slots 0/2/5, route width and camera positions supply independent geometry/count expectations. The compiled digest comparison observes propagation, while visibility is the maintained CPU frustum/LOD classification rather than native rendered pixels or exhaustive member contact.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts grounded/raised/nonwalkable/removed representative members, front/back cameras, missing routes/world/banner, a selected second shot and performed hero, plus missing/inconsistent materialization and invalid query contexts. Former exact floating fields use zero tolerance and existing derived tolerances remain unchanged.
 * @evidence contracts/testing.md#execution-ownership This named synchronous entry owns caller-local formation runtimes, maps and query callbacks through the existing canonical fixtures; it opens no file, render host, browser or GPU and does not mutate installed consumers or replace foreign methods.
 */
export function test_engine_geometry_query_formation(): void {
  const grounded: ReturnType<typeof materializeCompiledFormation> = materializeCompiledFormation({
    formation: unit(),
    surfaces: WORLD.surfaces,
  });
  const march: Map<string, IAutoMovieCompiledShotSource> = new Map([
    ["march", compiledShot({ id: "march", runtime: grounded })],
  ]);
  const onGround: ReturnType<typeof measure> = measure({ compiled: march });

  TestValidator.equals(
    "a unit on its rise stands on it and reports no ground violation",
    namedFacts([
      [
        "frontRankHeight",
        (): boolean => nclose(grounded.bounds.min.y, groundAt(0), 1e-12),
      ],
      [
        "rearRankHeight",
        (): boolean => nclose(grounded.bounds.max.y, groundAt(3), 1e-12),
      ],
      ["representatives", (): boolean => onGround.representativeSlots === 3],
      ["noViolation", (): boolean => onGround.groundViolations === 0],
    ]),
    {
      frontRankHeight: true,
      rearRankHeight: true,
      representatives: true,
      noViolation: true,
    },
  );

  const raisedDesign: ReturnType<typeof unit> = unit({ anchor: { x: 0, y: groundAt(0) + 1, z: 0 } });
  const raised: ReturnType<typeof materializeCompiledFormation> = materializeCompiledFormation({
    formation: raisedDesign,
    surfaces: WORLD.surfaces,
  });
  const boggedDesign: ReturnType<typeof unit> = unit({ anchor: { x: 100, y: 0, z: 0 } });
  const bogged: ReturnType<typeof materializeCompiledFormation> = materializeCompiledFormation({
    formation: boggedDesign,
    surfaces: WORLD.surfaces,
  });
  TestValidator.equals(
    "a unit off its ground is reported and a removed member is not",
    namedFacts([
      [
        "raised",
        (): boolean =>
          measure({
            compiled: new Map([
              ["march", compiledShot({ id: "march", runtime: raised })],
            ]),
            design: raisedDesign,
          }).groundViolations === 3,
      ],
      [
        "notWalkable",
        (): boolean =>
          measure({
            compiled: new Map([
              ["march", compiledShot({ id: "march", runtime: bogged })],
            ]),
            design: boggedDesign,
          }).groundViolations === 3,
      ],
      [
        "removedNotMeasured",
        (): boolean =>
          measure({
            compiled: new Map([
              [
                "march",
                compiledShot({
                  id: "march",
                  runtime: raised,
                  slotMotions: [removeSlotFive],
                }),
              ],
            ]),
            design: raisedDesign,
          }).groundViolations === 2,
      ],
    ]),
    { raised: true, notWalkable: true, removedNotMeasured: true },
  );

  const fromBehind: ReturnType<typeof measure> = measure({
    compiled: new Map([
      [
        "march",
        compiledShot({
          id: "march",
          runtime: grounded,
          cameraRotation: LOOKING_AWAY,
        }),
      ],
    ]),
  });
  TestValidator.equals(
    "a formation query reports the unit's compiled measure and resolution",
    namedFacts([
      [
        "counts",
        (): boolean =>
          onGround.designCount === 6 &&
          onGround.materializedCount === 6 &&
          onGround.anonymousCount === 5 &&
          onGround.heroCount === 1,
      ],
      [
        "chunks",
        (): boolean => onGround.chunkCount === 1 && onGround.participatingShots === 1,
      ],
      ["extent", (): boolean => nclose(onGround.width as number, 4, 0) && nclose(onGround.depth as number, 3, 0)],
      [
        "centroid",
        (): boolean =>
          nclose(onGround.centroidX as number, 0, 1e-12) &&
          nclose(
            onGround.centroidY as number,
            (3 * groundAt(0) + 3 * groundAt(3)) / 6,
            1e-9,
          ) &&
          nclose(onGround.centroidZ as number, 1.5, 1e-12),
      ],
      [
        "identityMotion",
        (): boolean =>
          nclose(onGround.sampledTime as number, 0, 0) &&
          nclose(onGround.motionOffsetX as number, 0, 0) &&
          nclose(onGround.motionOffsetY as number, 0, 0) &&
          nclose(onGround.motionOffsetZ as number, 0, 0) &&
          nclose(onGround.motionFacingOffsetDeg as number, 0, 0) &&
          nclose(onGround.lateralSpacingScale as number, 1, 0) &&
          nclose(onGround.depthSpacingScale as number, 1, 0) &&
          nclose(onGround.facingDeg as number, 0, 0),
      ],
      ["routeClearance", (): boolean => nclose(onGround.routeClearance as number, 10 - 4, 0)],
      [
        "identity",
        (): boolean =>
          onGround.compiledDigest === grounded.digest &&
          onGround.state === "compiled",
      ],
      [
        "distance",
        (): boolean =>
          nclose(onGround.nearestDistance as number, onGround.farthestDistance as number, 0) &&
          nclose(
            onGround.nearestDistance as number,
            Math.hypot(0, 5.75 - 6, 1.5 - 20),
            1e-9,
          ),
      ],
      [
        "drawnNear",
        (): boolean =>
          onGround.nearVisible === 5 &&
          onGround.farVisible === 0 &&
          onGround.culled === 0,
      ],
      ["bannerVisible", (): boolean => onGround.heroVisible === 1],
      [
        "culledFromBehind",
        (): boolean =>
          fromBehind.culled === 5 &&
          fromBehind.nearVisible === 0 &&
          fromBehind.heroVisible === 0,
      ],
    ]),
    {
      counts: true,
      chunks: true,
      extent: true,
      centroid: true,
      identityMotion: true,
      routeClearance: true,
      identity: true,
      distance: true,
      drawnNear: true,
      bannerVisible: true,
      culledFromBehind: true,
    },
  );

  const parade: ReturnType<typeof compiledShot> = compiledShot({
    id: "parade",
    runtime: grounded,
    banner: "performed",
  });
  const twoShots: ReturnType<typeof measure> = measure({
    compiled: new Map([
      ["march", compiledShot({ id: "march", runtime: grounded })],
      ["parade", parade],
    ]),
    contracts: new Map([
      ["march", contract(true)],
      ["parade", contract(true)],
    ]),
    shot: "parade",
    time: 1,
  });
  TestValidator.equals(
    "a formation query follows the world, the banner node and the named shot",
    namedFacts([
      [
        "noRoutes",
        (): boolean =>
          nclose(measure({ compiled: march, world: { ...WORLD, routes: [] } })
            .routeClearance as number, 0, 0),
      ],
      [
        "noWorld",
        (): boolean => {
          const measured: ReturnType<typeof measure> = measure({ compiled: march, world: null });
          return (
            nclose(measured.routeClearance as number, 0, 0) && measured.groundViolations === 3
          );
        },
      ],
      [
        "noBannerNode",
        (): boolean =>
          measure({
            compiled: new Map([
              [
                "march",
                compiledShot({
                  id: "march",
                  runtime: grounded,
                  banner: "absent",
                }),
              ],
            ]),
          }).heroVisible === 0,
      ],
      [
        "twoParticipating",
        (): boolean => twoShots.participatingShots === 2 && nclose(twoShots.sampledTime as number, 1, 0),
      ],
      ["performedBanner", (): boolean => twoShots.heroVisible === 1],
    ]),
    {
      noRoutes: true,
      noWorld: true,
      noBannerNode: true,
      twoParticipating: true,
      performedBanner: true,
    },
  );

  const unmaterialized: string =
    'Formation "unit" is not fully materialized in every current participating shot';
  const other: ReturnType<typeof materializeCompiledFormation> = materializeCompiledFormation({
    formation: unit({ seed: 2 }),
    surfaces: WORLD.surfaces,
  });
  TestValidator.equals(
    "a formation query refuses what no current shot answers",
    namedFacts([
      [
        "missing",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> => measure({ compiled: march, formation: "ghost" }),
            'Formation "ghost" does not exist',
          ),
      ],
      [
        "noParticipant",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({
                compiled: march,
                contracts: new Map([["elsewhere", contract(false)]]),
              }),
            unmaterialized,
          ),
      ],
      [
        "noRuntime",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({
                compiled: new Map([
                  ["march", compiledShot({ id: "march", runtime: null })],
                ]),
              }),
            unmaterialized,
          ),
      ],
      [
        "noCompiledShot",
        (): boolean =>
          throwsError((): ReturnType<typeof measure> => measure({ compiled: new Map() }), unmaterialized),
      ],
      [
        "digestsDisagree",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({
                compiled: new Map([
                  ["march", compiledShot({ id: "march", runtime: grounded })],
                  ["parade", compiledShot({ id: "parade", runtime: other })],
                ]),
                contracts: new Map([
                  ["march", contract(true)],
                  ["parade", contract(true)],
                ]),
              }),
            unmaterialized,
          ),
      ],
      [
        "countDisagrees",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> => measure({ compiled: march, design: unit({ count: 7 }) }),
            unmaterialized,
          ),
      ],
      [
        "noChunks",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({
                compiled: new Map([
                  [
                    "march",
                    compiledShot({
                      id: "march",
                      runtime: { ...grounded, chunks: [] },
                    }),
                  ],
                ]),
              }),
            unmaterialized,
          ),
      ],
      [
        "notParticipating",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> => measure({ compiled: march, shot: "elsewhere" }),
            'Shot "elsewhere" does not participate in formation "unit". Select one of march.',
          ),
      ],
      [
        "late",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> => measure({ compiled: march, time: 5 }),
            'Formation sample time 5 is outside current shot "march"',
          ),
      ],
      [
        "early",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> => measure({ compiled: march, time: -1 }),
            'Formation sample time -1 is outside current shot "march"',
          ),
      ],
      [
        "noCamera",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> =>
              measure({
                compiled: new Map([
                  [
                    "march",
                    compiledShot({
                      id: "march",
                      runtime: grounded,
                      cameraId: "gone",
                    }),
                  ],
                ]),
              }),
            'Shot "march" has no current compiled camera "gone"',
          ),
      ],
      [
        "noProduction",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof measure> => measure({ compiled: march, production: null }),
            "Formation measurement requires current production frame format. Restore production design and compile.",
          ),
      ],
    ]),
    {
      missing: true,
      noParticipant: true,
      noRuntime: true,
      noCompiledShot: true,
      digestsDisagree: true,
      countDisagrees: true,
      noChunks: true,
      notParticipating: true,
      late: true,
      early: true,
      noCamera: true,
      noProduction: true,
    },
  );
}

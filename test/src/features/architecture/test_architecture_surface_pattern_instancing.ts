import { AutoMovieEngineQuaternion, AutoMovieEngineArchitecture, AutoMovieEngineSurfaceMaterial } from "@automovie/engine";
import type {
  IAutoMovieExplicitInstanceTransform,
  IAutoMoviePatternInstancing,
  IAutoMoviePatternPlacement,
  IAutoMoviePatternPoint,
  IAutoMovieQuaternion,
  IAutoMovieSurfacePatternResult,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { pattern, rectangle, zone } from "../internal/patternFixtures";
import {
  namedFacts,
  nclose,
  qclose,
  qunit,
  throwsError,
  vclose,
} from "../internal/predicates";

const WALL: {
  origin: { x: number; y: number; z: number };
  u: { x: number; y: number; z: number };
  v: { x: number; y: number; z: number };
} = {
  origin: { x: 0, y: 0, z: 0 },
  u: { x: 1, y: 0, z: 0 },
  v: { x: 0, y: 1, z: 0 },
};

const FLOOR: {
  origin: { x: number; y: number; z: number };
  u: { x: number; y: number; z: number };
  v: { x: number; y: number; z: number };
} = {
  origin: { x: 0, y: 0, z: 0 },
  u: { x: 0, y: 0, z: 1 },
  v: { x: 1, y: 0, z: 0 },
};

/**
 * Whole laid modules become numerical TRS slots; cut pieces return as ids.
 *
 * The occurrence id becomes the slot id, in-plane rotation becomes a quaternion,
 * and module dimensions plus thickness become per-axis scale. This instancer
 * returns cut piece ids for caller-built geometry instead of scaling a whole
 * module into a different outline.
 *
 * Scenarios:
 *
 * 1. Eight whole modules on a wall face become eight slots at the module centres,
 *    with identity rotation and a scale that is not uniform.
 * 2. On a floor face whose axes have a different orientation, the
 *    quaternion carries the prototype's local axes onto the module's own U
 *    axis, its V axis, and the face normal.
 * 3. A module rotated ninety degrees in the face plane turns its local X onto the
 *    face V axis, which a yaw about the world up axis could not express.
 * 4. Cut occurrences produce no slot and are returned by id.
 * 5. A prototype table is indexed by the occurrence's own seeded variant, the same
 *    variant twice for the same seed, and every variant stays inside the
 *    declared count. With one variant the draw is always zero.
 * 6. A frame that is not orthonormal, a non-positive thickness, and a prototype
 *    table that cannot cover a drawn variant are each refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Generates authored square modules and maps whole placements through patternInstanceTransforms on wall/floor frames, checking slot identities, translations, quaternion axes/norms, dimensions, cut exclusions, seeded prototype selection, and cause-specific refusals.
 * @evidence contracts/development/testing.md#independent-expectations A two-by-one field on a half-metre grid requires eight slots, from (0.25,0.25) to (1.75,0.75); literal wall/floor axes, identity quaternion, 0.5-by-0.5 dimensions and authored thickness anchor transforms independently. A 1.75-wide field has six whole slots and two named boundary cuts; prototype indexing is checked against the separately observed generated variant.
 * @evidence contracts/development/common.md#meaningful-documentation Wall and floor frames orient whole slots, and in-plane rotation changes local axes. Cuts return IDs, variants resolve prototypes, and malformed frames or dimensions are rejected.
 */
export function test_architecture_surface_pattern_instancing(): void {
  const laid: IAutoMovieSurfacePatternResult = AutoMovieEngineSurfaceMaterial.generateAutoMovieSurfacePattern({
    pattern: pattern({ variants: 3, seed: 20260810 }),
  });
  const wall: IAutoMoviePatternInstancing = AutoMovieEngineArchitecture.patternInstanceTransforms({
    result: laid,
    frame: WALL,
    thickness: 0.012,
  });

  TestValidator.equals(
    "every whole module becomes one slot carrying its own occurrence id",
    wall.transforms.map(
      (one: IAutoMovieExplicitInstanceTransform): string => one.id,
    ),
    laid.placements.map((one: IAutoMoviePatternPlacement): string => one.id),
  );
  TestValidator.equals(
    "a wall face places modules at their centres with a non-uniform scale",
    namedFacts([
      ["count", (): boolean => wall.transforms.length === 8],
      ["cut", (): boolean => wall.cut.length === 0],
      [
        "first",
        (): boolean =>
          vclose(wall.transforms[0]!.translation, { x: 0.25, y: 0.25, z: 0 }),
      ],
      [
        "last",
        (): boolean =>
          vclose(wall.transforms[7]!.translation, { x: 1.75, y: 0.75, z: 0 }),
      ],
      [
        "identity",
        (): boolean =>
          wall.transforms.every(
            (one: IAutoMovieExplicitInstanceTransform): boolean =>
              qclose(one.rotation, { x: 0, y: 0, z: 0, w: 1 }) &&
              vclose(
                AutoMovieEngineQuaternion.rotateVector(one.rotation, { x: 1, y: 0, z: 0 }),
                {
                  x: 1,
                  y: 0,
                  z: 0,
                },
              ),
          ),
      ],
      [
        "unit",
        (): boolean =>
          wall.transforms.every(
            (one: IAutoMovieExplicitInstanceTransform): boolean =>
              qunit(one.rotation),
          ),
      ],
      [
        "scale",
        (): boolean =>
          wall.transforms.every(
            (one: IAutoMovieExplicitInstanceTransform): boolean =>
              nclose(one.scale.x, 0.5, 1e-12) &&
              nclose(one.scale.y, 0.5, 1e-12) &&
              nclose(one.scale.z, 0.012, 1e-12),
          ),
      ],
      [
        "nonUniform",
        (): boolean =>
          !nclose(wall.transforms[0]!.scale.x, wall.transforms[0]!.scale.z, 0),
      ],
    ]),
    {
      count: true,
      cut: true,
      first: true,
      last: true,
      identity: true,
      unit: true,
      scale: true,
      nonUniform: true,
    },
  );

  const floor: IAutoMoviePatternInstancing = AutoMovieEngineArchitecture.patternInstanceTransforms(
    {
      result: laid,
      frame: FLOOR,
      thickness: 0.02,
    },
  );
  const floorRotation: IAutoMovieQuaternion = floor.transforms[0]!.rotation;
  TestValidator.equals(
    "the quaternion carries the prototype axes onto the face axes",
    namedFacts([
      [
        "translation",
        (): boolean =>
          vclose(floor.transforms[0]!.translation, { x: 0.25, y: 0, z: 0.25 }),
      ],
      [
        "localX",
        (): boolean =>
          vclose(AutoMovieEngineQuaternion.rotateVector(floorRotation, { x: 1, y: 0, z: 0 }), {
            x: 0,
            y: 0,
            z: 1,
          }),
      ],
      [
        "localY",
        (): boolean =>
          vclose(AutoMovieEngineQuaternion.rotateVector(floorRotation, { x: 0, y: 1, z: 0 }), {
            x: 1,
            y: 0,
            z: 0,
          }),
      ],
      [
        "localZ",
        (): boolean =>
          vclose(AutoMovieEngineQuaternion.rotateVector(floorRotation, { x: 0, y: 0, z: 1 }), {
            x: 0,
            y: 1,
            z: 0,
          }),
      ],
      ["unit", (): boolean => qunit(floorRotation)],
    ]),
    {
      translation: true,
      localX: true,
      localY: true,
      localZ: true,
      unit: true,
    },
  );

  const turned: IAutoMoviePatternInstancing =
    AutoMovieEngineArchitecture.patternInstanceTransforms({
      result: AutoMovieEngineSurfaceMaterial.generateAutoMovieSurfacePattern({
        pattern: pattern({
          zones: [
            zone({
              region: rectangle(0, 0, 1, 1),
              period: { u: 1, v: 1 },
              reach: { u: 0.7, v: 0.85 },
              generate: ({
                column,
                row,
                origin,
              }: {
                column: number;
                row: number;
                origin: IAutoMoviePatternPoint;
                period: { u: number; v: number };
              }): {
                id: string;
                center: { u: number; v: number };
                size: { u: number; v: number };
                rotationDeg: number;
                grainDeg: number;
                mirror: false;
              }[] => [
                {
                  id: `t-${column}-${row}`,
                  center: { u: origin.u + 0.5, v: origin.v + 0.5 },
                  size: { u: 0.6, v: 0.3 },
                  rotationDeg: 90,
                  grainDeg: 0,
                  mirror: false,
                },
              ],
            }),
          ],
        }),
      }),
      frame: WALL,
      thickness: 0.012,
    });
  TestValidator.equals(
    "an in-plane rotation is a real quaternion, not a yaw about world up",
    namedFacts([
      [
        "localX",
        (): boolean =>
          vclose(
            AutoMovieEngineQuaternion.rotateVector(turned.transforms[0]!.rotation, {
              x: 1,
              y: 0,
              z: 0,
            }),
            { x: 0, y: 1, z: 0 },
          ),
      ],
      [
        "localY",
        (): boolean =>
          vclose(
            AutoMovieEngineQuaternion.rotateVector(turned.transforms[0]!.rotation, {
              x: 0,
              y: 1,
              z: 0,
            }),
            { x: -1, y: 0, z: 0 },
          ),
      ],
      [
        "scale",
        (): boolean =>
          nclose(turned.transforms[0]!.scale.x, 0.6, 1e-12) &&
          nclose(turned.transforms[0]!.scale.y, 0.3, 1e-12),
      ],
    ]),
    { localX: true, localY: true, scale: true },
  );

  const narrow: IAutoMovieSurfacePatternResult =
    AutoMovieEngineSurfaceMaterial.generateAutoMovieSurfacePattern({
      pattern: pattern({
        zones: [zone({ region: rectangle(0, 0, 1.75, 1) })],
        minimumPiece: 0.4,
      }),
    });
  const partial: IAutoMoviePatternInstancing =
    AutoMovieEngineArchitecture.patternInstanceTransforms({
      result: narrow,
      frame: WALL,
      thickness: 0.012,
    });
  TestValidator.equals(
    "a cut piece produces no slot and is named for the caller to build",
    {
      slots: partial.transforms.length,
      cut: partial.cut,
    },
    { slots: 6, cut: ["field/t-3-0", "field/t-3-1"] },
  );

  const prototypes: string[] = ["worn", "clean", "chipped"];
  const varied: IAutoMoviePatternInstancing =
    AutoMovieEngineArchitecture.patternInstanceTransforms({
      result: laid,
      frame: WALL,
      thickness: 0.012,
      prototypes,
    });
  TestValidator.equals(
    "the seeded variant selects the prototype, the same way every run",
    namedFacts([
      [
        "inRange",
        (): boolean =>
          laid.placements.every(
            (one: IAutoMoviePatternPlacement): boolean =>
              one.variant >= 0 && one.variant < 3,
          ),
      ],
      [
        "indexed",
        (): boolean =>
          varied.transforms.every(
            (
              one: IAutoMovieExplicitInstanceTransform,
              index: number,
            ): boolean =>
              one.prototype === prototypes[laid.placements[index]!.variant],
          ),
      ],
      [
        "varies",
        (): boolean =>
          new Set(
            laid.placements.map(
              (one: IAutoMoviePatternPlacement): number => one.variant,
            ),
          ).size > 1,
      ],
      [
        "repeatable",
        (): boolean =>
          AutoMovieEngineSurfaceMaterial.generateAutoMovieSurfacePattern({
            pattern: pattern({ variants: 3, seed: 20260810 }),
          })
            .placements.map(
              (one: IAutoMoviePatternPlacement): number => one.variant,
            )
            .join() ===
          laid.placements
            .map((one: IAutoMoviePatternPlacement): number => one.variant)
            .join(),
      ],
      [
        "seedMatters",
        (): boolean =>
          AutoMovieEngineSurfaceMaterial.generateAutoMovieSurfacePattern({
            pattern: pattern({ variants: 3, seed: 20260811 }),
          })
            .placements.map(
              (one: IAutoMoviePatternPlacement): number => one.variant,
            )
            .join() !==
          laid.placements
            .map((one: IAutoMoviePatternPlacement): number => one.variant)
            .join(),
      ],
      [
        "single",
        (): boolean =>
          AutoMovieEngineSurfaceMaterial.generateAutoMovieSurfacePattern({
            pattern: pattern({ variants: 1 }),
          }).placements.every(
            (one: IAutoMoviePatternPlacement): boolean => one.variant === 0,
          ),
      ],
      [
        "noTable",
        (): boolean =>
          wall.transforms.every(
            (one: IAutoMovieExplicitInstanceTransform): boolean =>
              one.prototype === undefined,
          ),
      ],
    ]),
    {
      inRange: true,
      indexed: true,
      varies: true,
      repeatable: true,
      seedMatters: true,
      single: true,
      noTable: true,
    },
  );

  TestValidator.equals(
    "a frame that is not orthonormal and a table that cannot cover a variant are refused",
    namedFacts([
      [
        "thickness",
        (): boolean =>
          throwsError(
            (): IAutoMoviePatternInstancing =>
              AutoMovieEngineArchitecture.patternInstanceTransforms({
                result: laid,
                frame: WALL,
                thickness: 0,
              }),
            "pattern module thickness must be a finite number > 0",
          ),
      ],
      [
        "shortU",
        (): boolean =>
          throwsError(
            (): IAutoMoviePatternInstancing =>
              AutoMovieEngineArchitecture.patternInstanceTransforms({
                result: laid,
                frame: { ...WALL, u: { x: 2, y: 0, z: 0 } },
                thickness: 0.01,
              }),
            "pattern face frame u must be a unit vector",
          ),
      ],
      [
        "shortV",
        (): boolean =>
          throwsError(
            (): IAutoMoviePatternInstancing =>
              AutoMovieEngineArchitecture.patternInstanceTransforms({
                result: laid,
                frame: { ...WALL, v: { x: 0, y: 0.5, z: 0 } },
                thickness: 0.01,
              }),
            "pattern face frame v must be a unit vector",
          ),
      ],
      [
        "notPerpendicular",
        (): boolean =>
          throwsError(
            (): IAutoMoviePatternInstancing =>
              AutoMovieEngineArchitecture.patternInstanceTransforms({
                result: laid,
                frame: {
                  ...WALL,
                  v: { x: Math.SQRT1_2, y: Math.SQRT1_2, z: 0 },
                },
                thickness: 0.01,
              }),
            "pattern face frame axes must be perpendicular",
          ),
      ],
      [
        "emptyTable",
        (): boolean =>
          throwsError(
            (): IAutoMoviePatternInstancing =>
              AutoMovieEngineArchitecture.patternInstanceTransforms({
                result: laid,
                frame: WALL,
                thickness: 0.01,
                prototypes: [],
              }),
            ["which the 0 declared prototypes do not cover"],
          ),
      ],
    ]),
    {
      thickness: true,
      shortU: true,
      shortV: true,
      notPerpendicular: true,
      emptyTable: true,
    },
  );
}

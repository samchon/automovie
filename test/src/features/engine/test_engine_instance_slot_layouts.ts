import {
  type IAutoMovieInstanceSetPlacement,
  instanceSlot,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { INSTANCE_SLOT_TEST_ROAD as road } from "../internal/INSTANCE_SLOT_TEST_ROAD";
import { instanceSlotTestExplicit } from "../internal/instanceSlotTestExplicit";
import { instanceSlotTestLattice } from "../internal/instanceSlotTestLattice";
import { instanceSlotTestOnRoad as onRoad } from "../internal/instanceSlotTestOnRoad";
import { instanceSlotTestPlacement as placement } from "../internal/instanceSlotTestPlacement";
import { instanceSlotTestScatter as scatter } from "../internal/instanceSlotTestScatter";
import {
  namedFacts,
  nclose,
  qclose,
  throwsError,
  vclose,
} from "../internal/predicates";

/**
 * One instance member stands where its layout law puts it, from the compiled
 * shape alone.
 *
 * The member regenerator is the one law the compiled instance-set kernel and
 * the shot-source oracle share, so every placement below is read against hand
 * geometry rather than against another implementation. A local layout is laid
 * out in the set frame, turned by the heading about the anchor, and raised by
 * the anchor's height; a route member walks the route snapshot by arc length,
 * ignores the heading, and stands at the anchor's height.
 *
 * Scenarios:
 *
 * 1. A grid member at a quarter turn: column -1 of row 0 lands two metres toward
 *    +z of the anchor, and the middle column of row 1 lands three metres toward
 *    +x, which pins the rotation sense of the heading.
 * 2. A lattice member takes its layer, row and column from the slot index, with
 *    the layer rising along local Y.
 * 3. A scatter member stays inside its radius, and turning the heading rotates
 *    it about the anchor without changing its distance.
 * 4. An explicit member takes its authored translation, rotation, scale,
 *    palette, trait value and visibility, while a sibling that states none keeps
 *    the set's own values; a block missing a declared slot refuses that slot and
 *    only that slot.
 * 5. A route member is spaced by arc length on the leg that contains it: the
 *    first leg, the second leg reached after skipping the first, and the final
 *    leg reached after skipping both. The heading changes none of them, and a
 *    lateral jitter pushes a member only across its own leg, never along it.
 * 6. Refusals, each against a twin that is accepted: a slot outside the set, a
 *    missing, renamed or one-point route, a route without finite positive
 *    length, a non-finite scale, trait or anchor, and an empty palette that an
 *    explicit colour then satisfies.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual instance member regenerator over original grid/lattice/scatter/explicit/route laws, observing world placement, carried variation, prototype/default values and named slot/route/nonfinite/palette refusals.
 * @evidence contracts/testing.md#independent-expectations Hand-authored grid/lattice indices, quarter turns, explicit fields and thirty-metre route midpoints determine expected values independently. Scatter containment/rotation and trait intervals constrain generated values without independently reconstructing the seeded distribution; no rendered model or native scene is observed.
 * @evidence contracts/testing.md#distinguishing-cases Preserves every original six-scenario row including all 64 scatter twins, explicit/default/missing-slot cases, all three route legs and lateral jitter, plus accepted/refused slot/route/variation twins. Existing vclose/qclose/nclose tolerances and inclusive bounds remain unchanged; exact explicit trait uses zero tolerance.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns local member arrays and query callbacks through extracted existing canonical fixtures, borrowing the same road singleton and explicit rotation object. It opens no file, renderer, browser or GPU and replaces no foreign method or production consumer.
 */
export function test_engine_instance_slot_layouts(): void {
  // 1. Grid at a quarter turn.
  const grid: IAutoMovieInstanceSetPlacement = placement();
  TestValidator.equals(
    "a grid member is laid out in the set frame and turned about the anchor",
    namedFacts([
      [
        "firstColumn",
        (): boolean =>
          vclose(instanceSlot(grid, 0).position, { x: 10, y: 1, z: -3 }, 1e-12),
      ],
      [
        "secondRowMiddle",
        (): boolean =>
          vclose(instanceSlot(grid, 4).position, { x: 13, y: 1, z: -5 }, 1e-12),
      ],
      [
        "node",
        (): boolean =>
          instanceSlot(grid, 4).node === "instance:trees:slot:000004",
      ],
    ]),
    { firstColumn: true, secondRowMiddle: true, node: true },
  );

  // 2. Lattice layers rise along local Y.
  const lattice: IAutoMovieInstanceSetPlacement = instanceSlotTestLattice();
  TestValidator.equals(
    "a lattice member takes its layer, row and column from the slot",
    namedFacts([
      [
        "first",
        (): boolean =>
          vclose(
            instanceSlot(lattice, 0).position,
            { x: -0.5, y: 0, z: 0 },
            1e-12,
          ),
      ],
      [
        "last",
        (): boolean =>
          vclose(
            instanceSlot(lattice, 7).position,
            { x: 0.5, y: 2, z: 3 },
            1e-12,
          ),
      ],
    ]),
    { first: true, last: true },
  );

  // 3. Scatter stays in its disk; the heading only rotates it.
  const level: IAutoMovieVector3[] = Array.from(
    { length: 64 },
    (_: unknown, slot: number): IAutoMovieVector3 =>
      instanceSlot(scatter(0), slot).position,
  );
  const turned: IAutoMovieVector3[] = Array.from(
    { length: 64 },
    (_: unknown, slot: number): IAutoMovieVector3 =>
      instanceSlot(scatter(90), slot).position,
  );
  TestValidator.equals(
    "a scatter member stays inside its radius and turns about the anchor",
    namedFacts([
      [
        "insideRadius",
        (): boolean =>
          level.every(
            (point: IAutoMovieVector3): boolean =>
              Math.hypot(point.x - 3, point.z - 4) <= 5 + 1e-12,
          ),
      ],
      [
        "quarterTurn",
        (): boolean =>
          level.every((point: IAutoMovieVector3, slot: number): boolean =>
            vclose(
              turned[slot]!,
              { x: 3 + (point.z - 4), y: 0, z: 4 - (point.x - 3) },
              1e-9,
            ),
          ),
      ],
    ]),
    { insideRadius: true, quarterTurn: true },
  );

  // 4. Explicit members.
  const quarterAboutX: IAutoMovieQuaternion = {
    x: Math.SQRT1_2,
    y: 0,
    z: 0,
    w: Math.SQRT1_2,
  };
  const explicit: IAutoMovieInstanceSetPlacement =
    instanceSlotTestExplicit(quarterAboutX);
  const oak: ReturnType<typeof instanceSlot> = instanceSlot(explicit, 0);
  const elm: ReturnType<typeof instanceSlot> = instanceSlot(explicit, 1);
  TestValidator.equals(
    "an explicit member keeps what it states and a sibling keeps the set's values",
    namedFacts([
      ["node", (): boolean => oak.node === "instance:trees:oak"],
      [
        "position",
        (): boolean => vclose(oak.position, { x: 11, y: 2, z: 3 }, 1e-12),
      ],
      ["rotation", (): boolean => qclose(oak.rotation!, quarterAboutX, 1e-12)],
      ["scale", (): boolean => vclose(oak.scale3!, { x: 2, y: 3, z: 4 }, 0)],
      ["palette", (): boolean => oak.palette === "#aa0000"],
      ["trait", (): boolean => nclose(oak.traits.height!, 9, 0)],
      ["hidden", (): boolean => oak.visible === false],
      ["defaultPrototype", (): boolean => oak.prototype === "default"],
      ["siblingPalette", (): boolean => elm.palette === "#336633"],
      [
        "siblingTrait",
        (): boolean => elm.traits.height! >= 1 && elm.traits.height! <= 2,
      ],
      ["siblingVisible", (): boolean => elm.visible === true],
      [
        "siblingIdentity",
        (): boolean => qclose(elm.rotation!, { x: 0, y: 0, z: 0, w: 1 }, 1e-12),
      ],
      [
        "missingSlot",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof instanceSlot> => instanceSlot(explicit, 2),
            "slot 2 has no explicit transform",
          ),
      ],
    ]),
    {
      node: true,
      position: true,
      rotation: true,
      scale: true,
      palette: true,
      trait: true,
      hidden: true,
      defaultPrototype: true,
      siblingPalette: true,
      siblingTrait: true,
      siblingVisible: true,
      siblingIdentity: true,
      missingSlot: true,
    },
  );

  // 5. Route members by arc length. Total 30 m, four members at 3.75 m, 11.25
  // m, 18.75 m and 26.25 m along it.
  const route: IAutoMovieInstanceSetPlacement = onRoad();
  const turnedRoute: IAutoMovieInstanceSetPlacement = onRoad({ facingDeg: 45 });
  const jittered: IAutoMovieInstanceSetPlacement = onRoad({
    layout: { kind: "along-route", route: "road", lateralJitter: 1 },
  });
  TestValidator.equals(
    "a route member is spaced by arc length on the leg that contains it",
    namedFacts([
      [
        "firstLeg",
        (): boolean =>
          vclose(
            instanceSlot(route, 0).position,
            { x: 3.75, y: 2, z: 0 },
            1e-12,
          ),
      ],
      [
        "secondLeg",
        (): boolean =>
          vclose(
            instanceSlot(route, 1).position,
            { x: 10, y: 2, z: 1.25 },
            1e-12,
          ),
      ],
      [
        "secondLegLater",
        (): boolean =>
          vclose(
            instanceSlot(route, 2).position,
            { x: 10, y: 2, z: 8.75 },
            1e-12,
          ),
      ],
      [
        "finalLeg",
        (): boolean =>
          vclose(
            instanceSlot(route, 3).position,
            { x: 3.75, y: 2, z: 10 },
            1e-12,
          ),
      ],
      [
        "headingIgnored",
        (): boolean =>
          [0, 1, 2, 3].every((slot: number): boolean =>
            vclose(
              instanceSlot(turnedRoute, slot).position,
              instanceSlot(route, slot).position,
              0,
            ),
          ),
      ],
      [
        "jitterAcrossFirstLeg",
        (): boolean => {
          const point: IAutoMovieVector3 = instanceSlot(jittered, 0).position;
          return nclose(point.x, 3.75, 1e-12) && Math.abs(point.z) <= 1;
        },
      ],
      [
        "jitterAcrossSecondLeg",
        (): boolean => {
          const point: IAutoMovieVector3 = instanceSlot(jittered, 1).position;
          return nclose(point.z, 1.25, 1e-12) && Math.abs(point.x - 10) <= 1;
        },
      ],
    ]),
    {
      firstLeg: true,
      secondLeg: true,
      secondLegLater: true,
      finalLeg: true,
      headingIgnored: true,
      jitterAcrossFirstLeg: true,
      jitterAcrossSecondLeg: true,
    },
  );

  // 6. Refusals against accepted twins.
  const unavailable: string = 'references unavailable route "road"';
  const noLength: string = 'route "road" must have finite non-zero length';
  const nonFinite: string = "derived non-finite variation or an empty palette";
  TestValidator.equals(
    "an instance member refuses what it cannot place and accepts its twin",
    namedFacts([
      ["lastSlotAccepted", (): boolean => instanceSlot(grid, 5).slot === 5],
      [
        "pastCount",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof instanceSlot> => instanceSlot(grid, 6),
            "slot 6 is outside 0..5",
          ),
      ],
      [
        "negative",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof instanceSlot> => instanceSlot(grid, -1),
            "slot -1 is outside 0..5",
          ),
      ],
      [
        "fractional",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof instanceSlot> => instanceSlot(grid, 1.5),
            "slot 1.5 is outside 0..5",
          ),
      ],
      ["routeAccepted", (): boolean => instanceSlot(route, 0).slot === 0],
      [
        "routeMissing",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof instanceSlot> =>
              instanceSlot(onRoad({ route: null }), 0),
            unavailable,
          ),
      ],
      [
        "routeRenamed",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof instanceSlot> =>
              instanceSlot(onRoad({ route: { ...road, id: "lane" } }), 0),
            unavailable,
          ),
      ],
      [
        "routeOnePoint",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof instanceSlot> =>
              instanceSlot(
                onRoad({ route: { ...road, waypoints: [{ x: 0, z: 0 }] } }),
                0,
              ),
            unavailable,
          ),
      ],
      [
        "routeZeroLength",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof instanceSlot> =>
              instanceSlot(
                onRoad({
                  route: {
                    ...road,
                    waypoints: [
                      { x: 1, z: 1 },
                      { x: 1, z: 1 },
                    ],
                  },
                }),
                0,
              ),
            noLength,
          ),
      ],
      [
        "routeInfinite",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof instanceSlot> =>
              instanceSlot(
                onRoad({
                  route: {
                    ...road,
                    waypoints: [
                      { x: 0, z: 0 },
                      { x: Number.POSITIVE_INFINITY, z: 0 },
                    ],
                  },
                }),
                0,
              ),
            noLength,
          ),
      ],
      [
        "infiniteScale",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof instanceSlot> =>
              instanceSlot(
                placement({
                  variation: {
                    scale: { min: 1, max: Number.POSITIVE_INFINITY },
                    palette: ["#336633"],
                    traits: [],
                  },
                }),
                0,
              ),
            nonFinite,
          ),
      ],
      [
        "infiniteTrait",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof instanceSlot> =>
              instanceSlot(
                placement({
                  variation: {
                    scale: { min: 1, max: 1 },
                    palette: ["#336633"],
                    traits: [
                      { name: "height", min: 0, max: Number.POSITIVE_INFINITY },
                    ],
                  },
                }),
                0,
              ),
            nonFinite,
          ),
      ],
      [
        "infiniteAnchor",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof instanceSlot> =>
              instanceSlot(
                placement({
                  anchor: { x: Number.POSITIVE_INFINITY, y: 0, z: 0 },
                }),
                0,
              ),
            nonFinite,
          ),
      ],
      [
        "emptyPalette",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof instanceSlot> =>
              instanceSlot(
                placement({
                  variation: {
                    scale: { min: 1, max: 1 },
                    palette: [],
                    traits: [],
                  },
                }),
                0,
              ),
            nonFinite,
          ),
      ],
      [
        "explicitColourSatisfiesEmptyPalette",
        (): boolean =>
          instanceSlot(
            placement({
              count: 1,
              variation: { scale: { min: 1, max: 1 }, palette: [], traits: [] },
              layout: {
                kind: "explicit",
                transforms: [
                  {
                    id: "only",
                    translation: { x: 0, y: 0, z: 0 },
                    rotation: { x: 0, y: 0, z: 0, w: 1 },
                    scale: { x: 1, y: 1, z: 1 },
                    palette: "#123456",
                  },
                ],
              },
            }),
            0,
          ).palette === "#123456",
      ],
    ]),
    {
      lastSlotAccepted: true,
      pastCount: true,
      negative: true,
      fractional: true,
      routeAccepted: true,
      routeMissing: true,
      routeRenamed: true,
      routeOnePoint: true,
      routeZeroLength: true,
      routeInfinite: true,
      infiniteScale: true,
      infiniteTrait: true,
      infiniteAnchor: true,
      emptyPalette: true,
      explicitColourSatisfiesEmptyPalette: true,
    },
  );
}

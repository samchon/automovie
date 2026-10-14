import {
  instanceSlot,
  materializeCompiledInstanceSet,
} from "@automovie/engine";
import type {
  IAutoMovieCompiledInstanceSet,
  IAutoMovieInstanceSetDesign,
  IAutoMovieInstanceSlot,
} from "@automovie/interface";
import { regenerateInstanceSlot } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

import {
  namedFacts,
  nclose,
  qclose,
  throwsError,
  vclose,
} from "../internal/predicates";

const LANE: {
  id: string;
  waypoints: { x: number; z: number }[];
  allowedFormationWidth: number;
} = {
  id: "lane",
  waypoints: [
    { x: -6, z: 0 },
    { x: 4, z: 0 },
    { x: 4, z: 8 },
  ],
  allowedFormationWidth: 3,
};

/** The laws every set below shares: a seed and a two-swatch palette. */
const base: (
  props: Pick<IAutoMovieInstanceSetDesign, "id" | "count" | "layout">,
) => IAutoMovieInstanceSetDesign = (
  props: Pick<IAutoMovieInstanceSetDesign, "id" | "count" | "layout">,
): IAutoMovieInstanceSetDesign => ({
  model: "post",
  anchor: { x: 2, y: 0.25, z: -3 },
  facingDeg: 30,
  seed: 4_242,
  variation: {
    scale: { min: 0.75, max: 1.4 },
    palette: ["#224466", "#664422"],
    traits: [{ name: "lean", min: -1, max: 1 }],
  },
  ...props,
});

/** One set per layout, the scattered one declaring every optional law. */
const designs: () => IAutoMovieInstanceSetDesign[] =
  (): IAutoMovieInstanceSetDesign[] => [
    base({
      id: "fence",
      count: 6,
      layout: {
        kind: "grid",
        rows: 2,
        columns: 3,
        spacing: { x: 1.2, z: 0.8 },
      },
    }),
    {
      ...base({
        id: "crowd",
        count: 40,
        layout: { kind: "scatter", radius: 9 },
      }),
      prototypes: [
        { id: "tall", model: "tall", weight: 2 },
        { id: "short", model: "short", weight: 1 },
      ],
      variation: {
        scale: { min: 0.8, max: 1.2 },
        scale3: {
          min: { x: 0.9, y: 0.7, z: 0.9 },
          max: { x: 1.1, y: 1.5, z: 1.1 },
        },
        rotationDeg: {
          x: { min: -3, max: 3 },
          y: { min: 0, max: 360 },
          z: { min: -3, max: 3 },
        },
        visibleProbability: 0.8,
        palette: ["#aa3311", "#11aa33", "#3311aa"],
        traits: [{ name: "lean", min: -1, max: 1 }],
      },
    },
    base({
      id: "shelf",
      count: 12,
      layout: {
        kind: "lattice",
        rows: 2,
        columns: 3,
        layers: 2,
        spacing: { x: 0.5, y: 0.4, z: 0.6 },
      },
    }),
    {
      ...base({
        id: "statues",
        count: 3,
        layout: {
          kind: "explicit",
          transforms: [
            {
              id: "left",
              translation: { x: -2, y: 0, z: 1 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              scale: { x: 1, y: 2, z: 1 },
              prototype: "tall",
              palette: "#ffffff",
              traits: { lean: 0.5 },
              visible: false,
            },
            {
              id: "centre",
              translation: { x: 0, y: 0, z: 0 },
              rotation: {
                x: 0,
                y: 0.3826834323650898,
                z: 0,
                w: 0.9238795325112867,
              },
              scale: { x: 1.5, y: 1.5, z: 1.5 },
            },
            {
              id: "right",
              translation: { x: 2, y: 0, z: 1 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              scale: { x: 1, y: 1, z: 1 },
            },
          ],
        },
      }),
      prototypes: [{ id: "tall", model: "tall", weight: 1 }],
    },
    base({
      id: "lamps",
      count: 9,
      layout: { kind: "along-route", route: "lane", lateralJitter: 0.6 },
    }),
  ];

/**
 * The viewer regenerates an instance member with the engine's member law.
 *
 * Valid member records and malformed-law refusals are compared directly with the Engine regenerator. This is a delegation/parity oracle, not an independent proof of the numerical law or a rendered population.
 *
 * Scenarios:
 *
 * 1. Grid, scatter, lattice, explicit and route members preserve the Engine's field presence, identifiers, finite transforms, visibility and traits.
 * 2. Neighbouring members have different positions, distinguishing a constant-record replacement.
 * 3. Renamed/zero-length routes, nonfinite derived scale and an empty palette refuse like the Engine, while each original record regenerates.
 *
 * @evidence contracts/testing.md#behavioral-verification Materializes compact sets and calls the Viewer slot adapter across layouts, indices and malformed snapshots; catches a divergent permissive placement copy, changed deterministic slot output or lost Engine refusal propagation.
 * @evidence contracts/testing.md#independent-expectations Engine instanceSlot is the canonical delegation reference and is compared field by field with finite numerical predicates; it is deliberately not an independent proof of that shared member law. Different adjacent slot positions and literal refusal substrings distinguish indexing and malformed inputs.
 * @evidence contracts/testing.md#distinguishing-cases Covers grid/scatter/lattice/explicit/route sets, every admitted slot, adjacent positions, renamed/degenerate route snapshots, nonfinite variation and empty palette with valid twins; invalid indices and Three batch construction have separate coverage obligations.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit invokes portable Engine/Viewer source and authored numerical records directly, acquiring no browser, renderer, GPU, process or native artifact and registering no hidden cases.
 */
export function test_viewer_instance_slot_regeneration(): void {
  const world: {
    routes: {
      id: string;
      waypoints: { x: number; z: number }[];
      allowedFormationWidth: number;
    }[];
  } = { routes: [LANE] };
  const sets: IAutoMovieCompiledInstanceSet[] = designs().map(
    (instanceSet: IAutoMovieInstanceSetDesign): IAutoMovieCompiledInstanceSet =>
      materializeCompiledInstanceSet({ instanceSet, world }),
  );
  const [fence, , , , lamps]: [
    IAutoMovieCompiledInstanceSet,
    IAutoMovieCompiledInstanceSet,
    IAutoMovieCompiledInstanceSet,
    IAutoMovieCompiledInstanceSet,
    IAutoMovieCompiledInstanceSet,
  ] = sets as [
    IAutoMovieCompiledInstanceSet,
    IAutoMovieCompiledInstanceSet,
    IAutoMovieCompiledInstanceSet,
    IAutoMovieCompiledInstanceSet,
    IAutoMovieCompiledInstanceSet,
  ];

  TestValidator.predicate(
    "a viewer member is the engine's member on every slot",
    sets.every((set: IAutoMovieCompiledInstanceSet): boolean =>
      Array.from({ length: set.count }, (_: unknown, slot: number): boolean =>
        sameSlot(regenerateInstanceSlot(set, slot), instanceSlot(set, slot)),
      ).every((matches: boolean): boolean => matches),
    ),
  );

  TestValidator.predicate(
    "neighbouring viewer members stand apart",
    sets.every(
      (set: IAutoMovieCompiledInstanceSet): boolean =>
        !vclose(
          regenerateInstanceSlot(set, 0).position,
          regenerateInstanceSlot(set, 1).position,
          0,
        ),
    ),
  );

  const nonFinite: string =
    'Instance set "fence" slot 1 derived non-finite variation or an empty palette.';
  TestValidator.equals(
    "a viewer member refuses the records the engine refuses",
    namedFacts([
      [
        "routeRenamed",
        (): boolean =>
          throwsError(
            (): IAutoMovieInstanceSlot =>
              regenerateInstanceSlot(
                { ...lamps, route: { ...lamps.route!, id: "renamed" } },
                1,
              ),
            'Instance set "lamps" references unavailable route "lane".',
          ),
      ],
      [
        "routeWithoutLength",
        (): boolean =>
          throwsError(
            (): IAutoMovieInstanceSlot =>
              regenerateInstanceSlot(
                {
                  ...lamps,
                  route: {
                    ...lamps.route!,
                    waypoints: [
                      { x: 1, z: 1 },
                      { x: 1, z: 1 },
                    ],
                  },
                },
                1,
              ),
            'Instance set "lamps" route "lane" must have finite non-zero length.',
          ),
      ],
      [
        "nonFiniteScale",
        (): boolean =>
          throwsError(
            (): IAutoMovieInstanceSlot =>
              regenerateInstanceSlot(
                {
                  ...fence,
                  variation: {
                    ...fence.variation,
                    scale: { min: Number.NaN, max: 1 },
                  },
                },
                1,
              ),
            nonFinite,
          ),
      ],
      [
        "emptyPalette",
        (): boolean =>
          throwsError(
            (): IAutoMovieInstanceSlot =>
              regenerateInstanceSlot(
                { ...fence, variation: { ...fence.variation, palette: [] } },
                1,
              ),
            nonFinite,
          ),
      ],
      [
        "twinsRegenerate",
        (): boolean =>
          regenerateInstanceSlot(lamps, 1).slot === 1 &&
          regenerateInstanceSlot(fence, 1).slot === 1,
      ],
    ]),
    {
      routeRenamed: true,
      routeWithoutLength: true,
      nonFiniteScale: true,
      emptyPalette: true,
      twinsRegenerate: true,
    },
  );
}

/**
 * Compare canonical member fields with finite numerical predicates and preserved optional-field/trait-key presence.
 *
 * The existing regeneration scenario invokes this comparator for every compiled layout and slot, checking actual adapter output against the canonical Engine member.
 * Engine output supplies the delegation reference; this helper compares names, field presence, finite scalar/vector values, quaternion orientation and exact quaternion components rather than independently validating the shared slot derivation.
 * Existing legacy and enhanced layouts exercise absent/present rotation and scale axes plus varied trait keys; malformed member refusal is asserted by the calling scenario before comparison.
 * This private synchronous predicate belongs to the named portable scenario, uses no host or dynamic registration and acquires only temporary sorted key arrays.
 */
function sameSlot(
  actual: IAutoMovieInstanceSlot,
  expected: IAutoMovieInstanceSlot,
): boolean {
  const keys: string[] = Object.keys(actual.traits).sort(
    (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0),
  );
  const expectedKeys: string[] = Object.keys(expected.traits).sort(
    (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0),
  );
  const fields: string[] = Object.keys(actual).sort(
    (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0),
  );
  const expectedFields: string[] = Object.keys(expected).sort(
    (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0),
  );
  return (
    fields.length === expectedFields.length &&
    fields.every(
      (field: string, index: number): boolean =>
        field === expectedFields[index],
    ) &&
    actual.slot === expected.slot &&
    actual.node === expected.node &&
    actual.model === expected.model &&
    actual.prototype === expected.prototype &&
    actual.visible === expected.visible &&
    actual.palette === expected.palette &&
    vclose(actual.position, expected.position, 0) &&
    nclose(actual.facingDeg, expected.facingDeg, 0) &&
    nclose(actual.scale, expected.scale, 0) &&
    (actual.rotation === undefined
      ? expected.rotation === undefined
      : expected.rotation !== undefined &&
        qclose(actual.rotation, expected.rotation, 1e-12) &&
        nclose(actual.rotation.x, expected.rotation.x, 0) &&
        nclose(actual.rotation.y, expected.rotation.y, 0) &&
        nclose(actual.rotation.z, expected.rotation.z, 0) &&
        nclose(actual.rotation.w, expected.rotation.w, 0)) &&
    (actual.scale3 === undefined
      ? expected.scale3 === undefined
      : expected.scale3 !== undefined &&
        vclose(actual.scale3, expected.scale3, 0)) &&
    keys.length === expectedKeys.length &&
    keys.every(
      (key: string, index: number): boolean =>
        key === expectedKeys[index] &&
        nclose(actual.traits[key]!, expected.traits[key]!, 0),
    )
  );
}

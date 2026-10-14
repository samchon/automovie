import type { IAutoMovieBuiltEnvironment, IAutoMovieTransform, IAutoMoviePropBox, IAutoMoviePropSpec, IAutoMovieStageSetPiece } from "@automovie/interface";
import type { IAutoMoviePropClearanceBounds } from "../../../../packages/engine/src/film/IAutoMoviePropClearanceBounds";
import type { IAutoMoviePropSupportFace } from "../../../../packages/engine/src/film/IAutoMoviePropSupportFace";
import { footprintRing } from "../../../../packages/engine/src/space/footprintRing";
import { propAnchorFrame } from "../../../../packages/engine/src/film/propAnchorFrame";
import { propBoundsOverlap } from "../../../../packages/engine/src/film/propBoundsOverlap";
import { propClearanceBounds } from "../../../../packages/engine/src/film/propClearanceBounds";
import { propOccupancyBounds } from "../../../../packages/engine/src/film/propOccupancyBounds";
import { propSpaceContainsBounds } from "../../../../packages/engine/src/film/propSpaceContainsBounds";
import { propSupportFace } from "../../../../packages/engine/src/film/propSupportFace";
import { validatePropPlacements } from "../../../../packages/engine/src/film/validatePropPlacements";
import { TestValidator } from "@nestia/e2e";
import type { IFilmChairRing } from "../internal/IFilmChairRing";
import type { IFilmChairRingInput } from "../internal/IFilmChairRingInput";
import type { IFilmPropPatchInput } from "../internal/IFilmPropPatchInput";
import { assertFilmPropPassagesAndAnchors } from "../internal/assertFilmPropPassagesAndAnchors";
import { assertFilmPropSupportFaces } from "../internal/assertFilmPropSupportFaces";
import { createModel } from "../internal/fixtures";
import {
  namedFacts,
  nclose,
  throwsError,
  vclose,
} from "../internal/predicates";
import {
  inSpace,
  lamp,
  propEnvironment,
  propRegistry,
  propSet,
  sculpture,
  table,
} from "../internal/propPlacementFixtures";

/** Construct a literal axis-aligned box for independently authored geometric expectations. */
const box: (minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number) => IAutoMoviePropBox = (
  minX: number,
  minY: number,
  minZ: number,
  maxX: number,
  maxY: number,
  maxZ: number,
): IAutoMoviePropBox => ({
  min: { x: minX, y: minY, z: minZ },
  max: { x: maxX, y: maxY, z: maxZ },
});

/** Compare both bound vectors through the shared numerical predicate. */
const boxClose: (actual: IAutoMoviePropBox, expected: IAutoMoviePropBox) => boolean = (
  actual: IAutoMoviePropBox,
  expected: IAutoMoviePropBox,
): boolean =>
  vclose(actual.min, expected.min) && vclose(actual.max, expected.max);

const UNIT: IAutoMovieStageSetPiece = {
  node: "probe",
  model: "probe",
  position: { x: 0, y: 0, z: 0 },
};

/** A square support face whose height changes by `slopeZ` metres per metre of Z. */
const patch: (props: IFilmPropPatchInput) => IAutoMoviePropSupportFace = (props: IFilmPropPatchInput): IAutoMoviePropSupportFace => {
  const centre: number = props.atX ?? 0;
  return {
    polygon: {
      outer: footprintRing([
        { x: centre - props.half, y: 0, z: -props.half },
        { x: centre + props.half, y: 0, z: -props.half },
        { x: centre + props.half, y: 0, z: props.half },
        { x: centre - props.half, y: 0, z: props.half },
      ]),
      holes: [],
    },
    height: {
      height: {
        kind: "plane",
        originHeight: props.originHeight,
        slopeX: 0,
        slopeZ: props.slopeZ ?? 0,
      },
    },
  };
};

/** The table's own top face, read off the registry the room is staged with. */
const tableTop: (piece?: IAutoMovieStageSetPiece) => IAutoMoviePropSupportFace | null = (
  piece: IAutoMovieStageSetPiece = propSet()[0]!,
): IAutoMoviePropSupportFace | null =>
  propSupportFace({
    target: { kind: "prop-affordance", prop: "table", affordance: "top" },
    environments: [],
    props: propRegistry(),
    set: [piece],
  });

/** A measured bearing that landed on the face and reads as `expected`. */
const bearing: (gap: number | null, expected: number) => boolean = (gap: number | null, expected: number): boolean =>
  gap !== null && nclose(gap, expected);

/** A quaternion turning `deg` about `+X`, the axis that tips a top over. */
const tipped: (deg: number) => IAutoMovieStageSetPiece["rotation"] = (deg: number): IAutoMovieStageSetPiece["rotation"] => ({
  x: Math.sin((deg * Math.PI) / 360),
  y: 0,
  z: 0,
  w: Math.cos((deg * Math.PI) / 360),
});

/**
 * A ring of chairs authored the way a production would: one loop, one anchor, a declared seed, and no hand-typed world coordinate.
 *
 * The angular offset is drawn from a small integer hash of the seed and the slot index rather than from a global generator, so the layout depends on the inputs alone: the same seed and the same count reproduce byte for byte regardless of the order the slots are evaluated in.
 */
const chairRing: (props: IFilmChairRingInput) => IFilmChairRing = (props: IFilmChairRingInput): IFilmChairRing => {
  const environment: IAutoMovieBuiltEnvironment = propEnvironment();
  const anchor: IAutoMovieTransform = propAnchorFrame({
    target: { kind: "surface", environment: "house", surface: "floor" },
    environments: [environment],
  })!;
  const specs: IAutoMoviePropSpec[] = [];
  const set: IAutoMovieStageSetPiece[] = [];
  for (let slot: number = 0; slot < props.count; ++slot) {
    const node: string = `chair-${slot}`;
    const jitter: number = ((props.seed * 2654435761 + slot * 40503) % 360) / 3600;
    const angle: number = ((slot / props.count) * 2 + jitter) * Math.PI;
    specs.push({
      node,
      model: { ...createModel(null), id: node },
      articulation: null,
      placement: {
        relations: [
          inSpace("room"),
          {
            kind: "on-support",
            target: { kind: "surface", environment: "house", surface: "floor" },
          },
        ],
        footprint: null,
        clearance: [],
      },
    });
    set.push({
      node,
      model: node,
      position: {
        x: anchor.translation.x + Math.cos(angle) * 3,
        y: anchor.translation.y + 0.3,
        z: anchor.translation.z + Math.sin(angle) * 3,
      },
    });
  }
  return { specs, set };
};

/**
 * The pure placement predicates answer the questions the validator asks, so a source-side loop or search reaches the same verdict the builder will.
 *
 * Scenarios:
 *
 * 1. Occupancy comes from a declared footprint when there is one and from the
 * visible parts otherwise, through the full staged TRS; a prop with no vertices collapses to its staged origin instead of an empty bound.
 * 2. Clearance volumes transform with the same TRS, and a prop that declares no
 * placement declares no clearance.
 * 3. Overlap is strict on all six comparisons: a shared face is contact, one axis
 * of separation on either side is enough to say no.
 * 4. Containment tests every corner, is vacuously true inside a cell-less semantic
 * partition, and refuses an undeclared space by throwing.
 * 5. Blocked passages name the filled opening and the swept connector, and stay
 * silent for an open cut, an unmodelled fill, and a degenerate route.
 * 6. Every relation target that carries a frame answers with it and every one that
 * cannot answers `null`, including each way a citation can dangle.
 * 7. A support states one face however it was written: a patch answers from its
 * own polygon and height rule, a host's top from the extent it carries through the host's staged scale and tilt, and a citation that dangles, a contact with no face, an empty polygon, and a top staged edge-on state none. The bearing on that face is zero where the prop rests, signed where it floats or sinks, taken at the highest probe over a ramp, `null` where the prop does not stand over it on either side, and found from whichever side can answer when the face is smaller than the footprint, centred under it or not.
 * 8. Twelve chairs authored as one seeded loop validate and reproduce serialized records across repeated calls; changing the seed changes the placements and leaves them valid.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls real occupancy, clearance, overlap, containment, passage, anchor and support queries, and validates the existing seeded chair loop through shared delegated assertion groups.
 * @evidence contracts/testing.md#independent-expectations Literal TRS boxes, interval contact, fixture-authored plane heights and signed support gaps supply numerical expectations; repeated authored-loop equality is metamorphic input determinism and does not certify cross-host trigonometric bytes.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all original derived/declared/empty bounds, axis separations, absent/degenerate citations, support probes/tilts, and seeded/reseeded valid rings; the delegated passage/anchor/support helpers own their dynamically invoked predicates.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_prop_placement_utility and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_prop_placement_utility(): void {
  const environment: IAutoMovieBuiltEnvironment = propEnvironment();

  TestValidator.predicate(
    "occupancy, clearance, overlap and containment agree with hand math",
    Object.values(namedFacts([
      [
        "derivedOccupancy",
        (): boolean =>
          boxClose(
            propOccupancyBounds({
              prop: table(),
              piece: {
                node: "table",
                model: "table",
                position: { x: 0, y: 0.3, z: 0 },
              },
            }),
            box(-0.2, 0, -0.1, 0.2, 0.6, 0.1),
          ),
      ],
      [
        "declaredFootprintWins",
        (): boolean =>
          boxClose(
            propOccupancyBounds({
              prop: {
                ...table(),
                placement: {
                  ...table().placement!,
                  footprint: box(-1, 0, -1, 1, 2, 1),
                },
              },
              piece: { ...UNIT, scale: { x: 2, y: 1, z: 0.5 } },
            }),
            box(-2, 0, -0.5, 2, 2, 0.5),
          ),
      ],
      [
        "placementlessOccupancyIsDerived",
        (): boolean =>
          boxClose(
            propOccupancyBounds({
              prop: sculpture(),
              piece: {
                node: "sculpture",
                model: "sculpture",
                position: { x: -3, y: 0, z: 0 },
                rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
                scale: { x: 1, y: 2, z: 0.5 },
              },
            }),
            box(-3, 0, -1.1, -2.5, 2, -0.1),
          ),
      ],
      [
        "verticeslessPropCollapsesToItsOrigin",
        (): boolean =>
          boxClose(
            propOccupancyBounds({
              prop: {
                node: "empty",
                model: { ...createModel(null), id: "empty", parts: [] },
                articulation: null,
              },
              piece: { ...UNIT, position: { x: 1, y: 2, z: 3 } },
            }),
            box(1, 2, 3, 1, 2, 3),
          ),
      ],
      [
        "facingDegDrivesTheSameTransform",
        (): boolean =>
          boxClose(
            propOccupancyBounds({
              prop: sculpture(),
              piece: {
                node: "sculpture",
                model: "sculpture",
                position: { x: -3, y: 0, z: 0 },
                facingDeg: 90,
                scale: { x: 1, y: 2, z: 0.5 },
              },
            }),
            box(-3, 0, -1.1, -2.5, 2, -0.1),
          ),
      ],
      [
        "clearanceTransformsWithTheProp",
        (): boolean =>
          propClearanceBounds({
            prop: lamp(),
            piece: { ...UNIT, position: { x: 0, y: 0.9, z: 0 }, scale: 1.2 },
          }).length === 1 &&
          propClearanceBounds({
            prop: lamp(),
            piece: { ...UNIT, position: { x: 0, y: 0.9, z: 0 }, scale: 1.2 },
          }).every(
            (clearance: IAutoMoviePropClearanceBounds): boolean =>
              clearance.id === "shade-service" &&
              boxClose(clearance, box(1.2, 0.3, -0.6, 2.4, 1.5, 0.6)),
          ),
      ],
      [
        "placementlessPropDeclaresNoClearance",
        (): boolean =>
          propClearanceBounds({ prop: sculpture(), piece: UNIT }).length === 0,
      ],
      [
        "overlapIsTrueWhenVolumesIntersect",
        (): boolean =>
          propBoundsOverlap(box(0, 0, 0, 1, 1, 1), box(0.5, 0.5, 0.5, 2, 2, 2)),
      ],
      [
        "eachAxisSeparatesOnEitherSide",
        (): boolean =>
          (
            [
              box(1, 0, 0, 2, 1, 1),
              box(-2, 0, 0, -1, 1, 1),
              box(0, 1, 0, 1, 2, 1),
              box(0, -2, 0, 1, -1, 1),
              box(0, 0, 1, 1, 1, 2),
              box(0, 0, -2, 1, 1, -1),
            ] as const
          ).every(
            (other: IAutoMoviePropBox): boolean =>
              propBoundsOverlap(box(0, 0, 0, 1, 1, 1), other) === false,
          ),
      ],
      [
        "containedBoundsAreInside",
        (): boolean =>
          propSpaceContainsBounds({
            environment,
            space: "room",
            bounds: box(-1, 0, -1, 1, 1, 1),
          }),
      ],
      [
        "oneCornerOutsideIsOutside",
        (): boolean =>
          propSpaceContainsBounds({
            environment,
            space: "room",
            bounds: box(-1, 0, -1, 6, 1, 1),
          }) === false,
      ],
      [
        "cellLessPartitionExcludesNothing",
        (): boolean =>
          propSpaceContainsBounds({
            environment,
            space: "annex",
            bounds: box(900, 900, 900, 901, 901, 901),
          }),
      ],
      [
        "undeclaredSpaceThrows",
        (): boolean =>
          throwsError(
            (): boolean =>
              propSpaceContainsBounds({
                environment,
                space: "missing",
                bounds: box(0, 0, 0, 1, 1, 1),
              }),
            'no logical space "missing"',
          ),
      ],
    ])).every((fact: boolean): boolean => fact),
  );

  assertFilmPropPassagesAndAnchors({
    environment,
    box,
    UNIT,
    tableTop,
    bearing,
    tipped,
    patch,
  });

  assertFilmPropSupportFaces({
    environment,
    box,
    UNIT,
    tableTop,
    bearing,
    tipped,
    patch,
  });

  const first: IFilmChairRing = chairRing({ count: 12, seed: 7 });
  const again: IFilmChairRing = chairRing({ count: 12, seed: 7 });
  const reseeded: IFilmChairRing = chairRing({ count: 12, seed: 11 });
  TestValidator.equals(
    "a seeded loop of twelve chairs validates and reproduces",
    namedFacts([
      [
        "theRingValidates",
        (): boolean =>
          validatePropPlacements({
            props: first.specs,
            set: first.set,
            builtEnvironments: [environment],
          }).success,
      ],
      [
        "sameSeedSameBytes",
        (): boolean => JSON.stringify(first.set) === JSON.stringify(again.set),
      ],
      [
        "anotherSeedMovesTheRing",
        (): boolean => JSON.stringify(first.set) !== JSON.stringify(reseeded.set),
      ],
      [
        "theReseededRingAlsoValidates",
        (): boolean =>
          validatePropPlacements({
            props: reseeded.specs,
            set: reseeded.set,
            builtEnvironments: [environment],
          }).success,
      ],
      [
        "sameSeedSameSpecs",
        (): boolean => JSON.stringify(first.specs) === JSON.stringify(again.specs),
      ],
    ]),
    {
      theRingValidates: true,
      sameSeedSameBytes: true,
      anotherSeedMovesTheRing: true,
      theReseededRingAlsoValidates: true,
      sameSeedSameSpecs: true,
    },
  );
}

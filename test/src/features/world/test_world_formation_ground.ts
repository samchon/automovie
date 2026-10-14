import {
  IAutoMovieFormationGrounding,
  IAutoMovieFormationPlacement,
  formationSlot,
  formationSlotPosition,
  worldHeightfield,
  worldRamp,
  worldSurfaceHeight,
  worldTerrain,
} from "@automovie/engine";
import {
  IAutoMovieFormationDesign,
  IAutoMovieVector3,
  IAutoMovieWorldSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

const FILES: number = 5;
const RANKS: number = 4;
const COUNT: number = FILES * RANKS;

/**
 * One block of twenty, four ranks deep and five files wide, on stated terrain.
 *
 * The files span `x` in `[-4, 4]` and the ranks span `z` in `[0, 9]`, so every
 * member of it sits somewhere different on the ground plan and a surface that
 * varies in either axis moves them apart.
 */
const block: (props: { ground?: readonly IAutoMovieWorldSurface[]; anchor?: IAutoMovieVector3 }) => IAutoMovieFormationPlacement = (props: {
  ground?: readonly IAutoMovieWorldSurface[];
  anchor?: { x: number; y: number; z: number };
}): IAutoMovieFormationPlacement => ({
  id: "block",
  count: COUNT,
  layout: {
    kind: "line",
    ranks: RANKS,
    files: FILES,
    spacing: { lateral: 2, depth: 3 },
  },
  anchor: props.anchor ?? { x: 0, y: 0, z: 0 },
  facingDeg: 0,
  seed: 11,
  ...(props.ground === undefined ? {} : { ground: props.ground }),
});

/** A wide level floor the whole block stands inside. */
const floor: (height: number) => IAutoMovieWorldSurface = (height: number): IAutoMovieWorldSurface =>
  worldTerrain({
    id: "floor",
    polygon: [
      { x: -20, z: -20 },
      { x: 20, z: -20 },
      { x: 20, z: 20 },
      { x: -20, z: 20 },
    ],
    height,
    walkable: true,
  });

/** A slope climbing one metre for every two metres of `z`. */
const slope: () => IAutoMovieWorldSurface = (): IAutoMovieWorldSurface =>
  worldRamp({
    id: "slope",
    from: { x: 0, z: -20 },
    to: { x: 0, z: 20 },
    width: 60,
    baseHeight: -5,
    rise: 20,
    walkable: true,
  });

/** A ridge along `z`, highest on the centre file and falling to either side. */
const ridge: () => IAutoMovieWorldSurface = (): IAutoMovieWorldSurface =>
  worldHeightfield({
    id: "ridge",
    polygon: [
      { x: -20, z: -20 },
      { x: 20, z: -20 },
      { x: 20, z: 20 },
      { x: -20, z: 20 },
    ],
    origin: { x: -20, z: -20 },
    spacing: { x: 4, z: 40 },
    columns: 11,
    rows: 2,
    height: (point: { x: number; z: number }): number => 5 - Math.abs(point.x) * 0.25,
    walkable: true,
  });

/** Every member's placed position on stated terrain, in slot order. */
const placed: (ground?: readonly IAutoMovieWorldSurface[], anchor?: IAutoMovieVector3) => IAutoMovieVector3[] = (
  ground?: readonly IAutoMovieWorldSurface[],
  anchor?: { x: number; y: number; z: number },
): Array<{ x: number; y: number; z: number }> => {
  const formation: IAutoMovieFormationPlacement = block({ ground, anchor });
  return Array.from({ length: COUNT }, (_unused: unknown, slot: number): IAutoMovieVector3 =>
    formationSlotPosition(formation, slot),
  );
};

/**
 * A crowd stands on the ground under each of its members.
 *
 * Height is the ground under the member, read as relief against the ground
 * under the anchor. A unit staged on its terrain lands on it member by member;
 * a unit staged above its terrain keeps that clearance up the hill. Level
 * ground contributes zero relief and preserves the ungrounded placement.
 * Position and full-slot entry points must share that same relief law.
 *
 * Scenarios:
 *
 * 1. A flat floor places every member exactly where a formation with no terrain at
 *    all places it, for the authored zero and 7.25-metre floor heights.
 * 2. On a slope every member sits on the slope: its height is the terrain's own
 *    height at its own position, member by member, not one height for the
 *    unit.
 * 3. Two members standing on different ground stand at different heights, and the
 *    difference is the terrain's. A unit four ranks deep on a slope has four heights.
 * 4. A rise that is not a plane relieves a unit too: on a ridge the centre file
 *    stands above the flanking files, which no `constant` or `plane` surface
 *    can produce and which is the case the third height rule exists for.
 * 5. An anchor staged above its terrain keeps exactly that clearance everywhere,
 *    so the authored height is a height above the ground rather than a height
 *    the ground overrides.
 * 6. Terrain that does not reach a member leaves that member at the staged height
 *    rather than dropping it to the world origin, and terrain that does not
 *    reach the anchor leaves the whole unit at the staged height, because
 *    relief without a datum is not a rise but a guess.
 * 7. The full slot, not only the position, carries the relief, so a consumer
 *    reading a member's whole record sees the same height as one reading only
 *    where it stands.
 *
 * The ground owner caches the anchor datum by formation object. These cases
 * preserve the required immutable anchor and terrain after first placement;
 * they do not verify cache invalidation for a mutated record.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls position and full-slot placement over actual terrain records, observing per-member relief, retained anchor clearance, level-floor compatibility and staged height without ground/datum; group-wide flat height, pre-footprint extrapolation or disagreement between slot entry points fails.
 * @evidence contracts/testing.md#independent-expectations Authored three-meter rank spacing on a half-meter-per-meter slope gives distinct rank heights, ridge symmetry and a one-meter crest difference distinguish nonplanar placement, and explicit 2.5-meter clearance fixes the raised-anchor expectation. Calls to worldSurfaceHeight and ungrounded placement are shared-owner consistency oracles rather than independent proofs of their formulas.
 * @evidence contracts/testing.md#distinguishing-cases Covers absent terrain, zero/raised level floors, sloped ranks, a nonplanar ridge, raised anchor, partially covered slots, missing anchor datum, entirely uncovered formation and full-slot parity across 20 members; heading-dependent relief and asymmetric bilinear interpolation have separate units.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_world_formation_ground entry owns resident CPU terrain construction and placement facts with no renderer, browser, native artifact or Human asset; visual grounding and terrain admission are not inferred from these numeric observations.
 */
export function test_world_formation_ground(): void {
  const bare: IAutoMovieVector3[] = placed();
  TestValidator.equals(
    "a level floor places exactly where no terrain at all places",
    namedFacts([
      [
        "atZero",
        (): boolean =>
          placed([floor(0)]).every((point: IAutoMovieVector3, index: number): boolean =>
            nclose(point.y, bare[index]!.y, 1e-12),
          ),
      ],
      [
        "raised",
        (): boolean =>
          placed([floor(7.25)]).every((point: IAutoMovieVector3, index: number): boolean =>
            nclose(point.y, bare[index]!.y, 1e-12),
          ),
      ],
      [
        "plan",
        (): boolean =>
          placed([floor(7.25)]).every(
            (point: IAutoMovieVector3, index: number): boolean =>
              nclose(point.x, bare[index]!.x, 1e-12) &&
              nclose(point.z, bare[index]!.z, 1e-12),
          ),
      ],
      // "The unit with no terrain sits at zero" is not stated here. Its anchor
      // is at zero, so the claim reads the same whether placement keeps the
      // staged height or drops every member to the world origin. The case that
      // separates those is `noGroundAtAll` below, which stages at 0.75.
    ]),
    { atZero: true, raised: true, plan: true },
  );

  // The anchor stands on the slope, so the relief is the terrain itself and each
  // member's height is readable straight off the surface record.
  const hillside: IAutoMovieWorldSurface = slope();
  const anchorHeight: number = worldSurfaceHeight(hillside, { x: 0, z: 0 });
  const climbed: IAutoMovieVector3[] = placed([hillside], { x: 0, y: anchorHeight, z: 0 });
  TestValidator.predicate(
    "on a slope every member stands on the slope under itself",
    climbed.every((point: IAutoMovieVector3): boolean =>
      nclose(point.y, worldSurfaceHeight(hillside, point), 1e-9),
    ),
  );

  TestValidator.equals(
    "members on different ground stand at different heights",
    namedFacts([
      // Slot 0 is the front rank and slot 15 the rear one, three metres apart
      // per rank on a slope that climbs half a metre per metre.
      [
        "differ",
        (): boolean => nclose(climbed[0]!.y, climbed[COUNT - FILES]!.y, 1e-9) === false,
      ],
      [
        "byTheTerrain",
        (): boolean =>
          nclose(
            climbed[COUNT - FILES]!.y - climbed[0]!.y,
            (climbed[COUNT - FILES]!.z - climbed[0]!.z) * 0.5,
            1e-9,
          ),
      ],
      // Four ranks, four heights: a slope is not one number for the unit.
      [
        "fourHeights",
        (): boolean =>
          new Set<number>(climbed.map((point: IAutoMovieVector3): number => Math.round(point.y * 1e6) / 1e6))
            .size === RANKS,
      ],
      // Across a rank the slope is level, so the files share a height and the
      // difference above really is the terrain rather than slot index noise.
      ["acrossARank", (): boolean => nclose(climbed[0]!.y, climbed[FILES - 1]!.y, 1e-9)],
    ]),
    { differ: true, byTheTerrain: true, fourHeights: true, acrossARank: true },
  );

  const crest: IAutoMovieWorldSurface = ridge();
  const ridden: IAutoMovieVector3[] = placed([crest], {
    x: 0,
    y: worldSurfaceHeight(crest, { x: 0, z: 0 }),
    z: 0,
  });
  TestValidator.equals(
    "a rise that is not a plane relieves a unit across its own files",
    namedFacts([
      [
        "onTheRidge",
        (): boolean =>
          ridden.every((point: IAutoMovieVector3): boolean =>
            nclose(point.y, worldSurfaceHeight(crest, point), 1e-9),
          ),
      ],
      // Files run -4, -2, 0, 2, 4 in x; the centre one is the crest.
      ["crestHighest", (): boolean => ridden[2]!.y > ridden[1]!.y],
      // Not the rule's own evenness restated: the members stand BETWEEN
      // samples, so this is the stored lattice and the blend across it reading
      // the same at -2 and +2. A column index off by one would shift the whole
      // lattice and break exactly this, while `onTheRidge` — which measures the
      // placement against that same shifted reading — would not notice.
      ["symmetric", (): boolean => nclose(ridden[1]!.y, ridden[3]!.y, 1e-9)],
      ["flanksLower", (): boolean => ridden[0]!.y < ridden[1]!.y],
      // A plane through the two flanks would put the crest between them at
      // their own height. It stands a metre above that, so no plane holds it.
      [
        "noPlaneHoldsIt",
        (): boolean =>
          nclose(ridden[0]!.y, ridden[FILES - 1]!.y, 1e-9) &&
          nclose(ridden[2]!.y - ridden[0]!.y, 1, 1e-9),
      ],
    ]),
    {
      onTheRidge: true,
      crestHighest: true,
      symmetric: true,
      flanksLower: true,
      noPlaneHoldsIt: true,
    },
  );

  TestValidator.predicate(
    "an anchor staged above its terrain keeps that clearance everywhere",
    placed([hillside], { x: 0, y: anchorHeight + 2.5, z: 0 }).every(
      (point: IAutoMovieVector3, index: number): boolean => nclose(point.y, climbed[index]!.y + 2.5, 1e-9),
    ),
  );

  // A slope covering only the near half of the block: its front two ranks stand
  // on it and its rear two reach past the polygon's edge onto nothing. The rule
  // itself would happily extrapolate there, which is exactly why the footprint
  // and not the rule decides where a surface exists.
  const nearSlope: IAutoMovieWorldSurface = {
    id: "near-slope",
    polygon: [
      { x: -20, z: -20 },
      { x: 20, z: -20 },
      { x: 20, z: 4 },
      { x: -20, z: 4 },
    ],
    height: { kind: "plane", originHeight: 0, slopeX: 0, slopeZ: 0.5 },
    walkable: true,
  };
  const partial: IAutoMovieVector3[] = placed([nearSlope], { x: 0, y: 0, z: 0 });
  const offset: IAutoMovieWorldSurface = worldTerrain({
    id: "offset",
    polygon: [
      { x: -20, z: 5 },
      { x: 20, z: 5 },
      { x: 20, z: 20 },
      { x: -20, z: 20 },
    ],
    height: 3,
    walkable: true,
  });
  TestValidator.equals(
    "relief without a datum is not a rise, so the staged height is kept",
    namedFacts([
      // The rank on the covered ground rises with it: three metres of depth at
      // half a metre per metre.
      [
        "coveredRises",
        (): boolean =>
          partial
            .slice(FILES, 2 * FILES)
            .every((point: IAutoMovieVector3): boolean => nclose(point.y, 1.5, 1e-9)),
      ],
      // The ranks past the footprint keep the height the unit was staged at
      // rather than the 3 and 4.5 the rule would extrapolate to.
      [
        "uncoveredStaged",
        (): boolean => partial.slice(2 * FILES).every((point: IAutoMovieVector3): boolean => nclose(point.y, 0, 0)),
      ],
      // The anchor at the origin is over nothing here, so the unit has no datum
      // to measure a rise from and keeps the height it was staged at, even
      // though its rear ranks do stand over terrain.
      [
        "noDatum",
        (): boolean =>
          placed([offset], { x: 0, y: 1.5, z: 0 }).every(
            (point: IAutoMovieVector3): boolean => nclose(point.y, 1.5, 0),
          ),
      ],
      // And a unit whose terrain reaches none of it keeps it too.
      [
        "noGroundAtAll",
        (): boolean =>
          placed([floor(0)], { x: 0, y: 0.75, z: 40 }).every(
            (point: IAutoMovieVector3): boolean => nclose(point.y, 0.75, 0),
          ),
      ],
    ]),
    {
      coveredRises: true,
      uncoveredStaged: true,
      noDatum: true,
      noGroundAtAll: true,
    },
  );

  const design: IAutoMovieFormationDesign & IAutoMovieFormationGrounding = {
    id: "block",
    modelRecipe: "member",
    count: COUNT,
    layout: {
      kind: "line",
      ranks: RANKS,
      files: FILES,
      spacing: { lateral: 2, depth: 3 },
    },
    anchor: { x: 0, y: anchorHeight, z: 0 },
    facingDeg: 0,
    seed: 11,
    capabilities: [],
    heroOverrides: [],
    ground: [hillside],
  };
  TestValidator.predicate(
    "the whole slot carries the relief, not only the position query",
    Array.from({ length: COUNT }, (_unused: unknown, slot: number): number => slot).every((slot: number): boolean =>
      nclose(formationSlot(design, slot).position.y, climbed[slot]!.y, 1e-12),
    ),
  );
}

import {
  IAutoMovieDiagnostic,
  IAutoMovieFormationDesign,
  IAutoMovieFormationMotion,
  IAutoMovieFormationSlotMotion,
  IAutoMovieModel,
  IAutoMovieShotContract,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieFormationPlacement } from "../IAutoMovieFormationPlacement";
import {
  formationSlotPosition,
  placeFormationSlot,
  sampleFormationMotion,
  sampleFormationSlotMotion,
} from "../index";
import type { IAutoMovieFormationGrounding } from "./../IAutoMovieFormationGrounding";
import type { IAutoMovieFormationSlotPlacement } from "./../IAutoMovieFormationSlotPlacement";
import type { IAutoMovieSampledFormationMotion } from "./../IAutoMovieSampledFormationMotion";
import { IAutoMovieModelColumn } from "./IAutoMovieModelColumn";
import { autoMovieModelColumns } from "./autoMovieModelColumns";
import { engineDiagnostic } from "./engineDiagnostic";

/**
 * Round a diagnostic quantity to three decimals with Math.round(value*1000)/1000.
 *
 * The validateAutoMovieFormationOverlap owner applies presentation rounding after its actual predicate.
 *
 * Binary64 rounding is not an exact decimal serialization or decision tolerance.
 *
 * Only displayed metre/second quantities are rounded, leaving comparison arithmetic unchanged.
 *
 * Fixed scalar arithmetic takes constant work.
 *
 * Diagnostics reuse the same presentation rule within validateAutoMovieFormationOverlap, not cached measurements.
 *
 * Only a number returns and no sampled state is retained.
 */
const round: (value: number) => number = (value: number): number =>
  Math.round(value * 1_000) / 1_000;

/** Measure the first 4096 slots per unit; members beyond that prefix can overlap without being sampled. */
const FORMATION_OVERLAP_MEMBER_LIMIT: number = 4096;

/** Interior sample budget of 16; every authored endpoint remains even when endpoint count exceeds the budget. */
const FORMATION_OVERLAP_SAMPLE_LIMIT: number = 16;

/**
 * Describe one staged unit with source order, borrowed placement, selected members and every tier's columns.
 *
 * The row joins spatial placement to tier-aware clearance without a second runtime model.
 *
 * Member and column inventories are sampled proxies, not native geometry.
 *
 * Order index, rest points and tier column meanings are documented.
 *
 * Population depends on at most4096 members and authored tier/column counts.
 *
 * One unit row is shared by all its placements within the overlap call.
 *
 * The validation owns wrappers while placement/model owners retain borrowed source data.
 *
 * @author Samchon
 */
interface IFormationOverlapUnit {
  /** Position in the shot's own order, which is the order refusals come in. */
  index: number;

  /** The staged unit itself. */
  formation: IAutoMovieFormationPlacement & {
    lod: ReadonlyArray<{ runtimeModel: string }>;
  };

  /** Where each measured member stands at rest, with the slot it is. */
  members: ReadonlyArray<{ slot: number; point: IAutoMovieVector3 }>;

  /** Columns of every runtime one of its members may be drawn as. */
  tiers: ReadonlyArray<readonly IAutoMovieModelColumn[]>;
}

/**
 * Pair one sampled member world point with its unit and slot identity.
 *
 * The row lets the grid recover the same tier-aware unit pair.
 *
 * It represents one time sample rather than a swept collision trajectory.
 *
 * World-point, unit and zero-based slot meanings are stated.
 *
 * Each placed member adds one fixed wrapper plus a point.
 *
 * Grid neighbor comparisons reuse the same placement row.
 *
 * Per-time grid/row owners release it after that sample, with no native body retained.
 *
 * @author Samchon
 */
interface IFormationOverlapPlacement {
  /** Unit this member stands in. */
  unit: IFormationOverlapUnit;

  /** Zero-based slot it is. */
  slot: number;

  /** Where it stands at the sampled time. */
  point: IAutoMovieVector3;
}

/** Memoize rest points by unchanged placement identity; weak-key lifetime is not bounded to one compile. */
const formationOverlapMemberCache: WeakMap<
  IAutoMovieFormationPlacement,
  readonly { slot: number; point: IAutoMovieVector3 }[]
> = new WeakMap<
  IAutoMovieFormationPlacement,
  ReadonlyArray<{ slot: number; point: IAutoMovieVector3 }>
>();

/**
 * Enumerate the first min(count,4096) designed slot points and memoize by placement identity.
 *
 * This caps repeated crowd placement work while preserving slot identities.
 *
 * Counts beyond4096 are sampled incompletely and mutable placement changes are not invalidated.
 *
 * The returned rows describe rest points, not current cue-transformed positions.
 *
 * At most4096 slot queries/rows are produced per fresh identity.
 *
 * The WeakMap shares rows only under an unchanged placement-data premise.
 *
 * Live placement objects retain bounded cached member rows until their weak keys become collectible.
 */
const formationOverlapMembers: (
  formation: IAutoMovieFormationPlacement,
) => ReadonlyArray<{ slot: number; point: IAutoMovieVector3 }> = (
  formation: IAutoMovieFormationPlacement,
): ReadonlyArray<{ slot: number; point: IAutoMovieVector3 }> => {
  const remembered:
    | readonly { slot: number; point: IAutoMovieVector3 }[]
    | undefined = formationOverlapMemberCache.get(formation);
  if (remembered !== undefined) return remembered;
  const members: { slot: number; point: IAutoMovieVector3 }[] = Array.from(
    { length: Math.min(formation.count, FORMATION_OVERLAP_MEMBER_LIMIT) },
    (_: unknown, slot: number): { slot: number; point: IAutoMovieVector3 } => ({
      slot,
      point: formationSlotPosition(formation, slot),
    }),
  );
  formationOverlapMemberCache.set(formation, members);
  return members;
};

/**
 * Keep zero and every cue endpoint, then distribute remaining16-sample budget evenly among gaps.
 *
 * Authored endpoints retain precedence over interior density.
 *
 * More than16 distinct endpoints exceed the nominal budget; brief interior overlaps can be missed.
 *
 * Sorted unique seconds and endpoint preservation are documented.
 *
 * E endpoints cost O(E log E) sorting, with at most the endpoint population plus budgeted interiors.
 *
 * One set deduplicates unit/member cue endpoints within the request.
 *
 * Only a fresh scalar array escapes; no cue history or playback task is retained.
 */
const formationOverlapSampleTimes: (
  cues: readonly IAutoMovieFormationMotion[],
  slotCues: readonly IAutoMovieFormationSlotMotion[],
) => number[] = (
  cues: readonly IAutoMovieFormationMotion[],
  slotCues: readonly IAutoMovieFormationSlotMotion[],
): number[] => {
  const ends: number[] = [
    ...new Set([
      0,
      ...cues.flatMap((cue: IAutoMovieFormationMotion): number[] => [
        cue.start,
        cue.end,
      ]),
      ...slotCues.flatMap((cue: IAutoMovieFormationSlotMotion): number[] => [
        cue.start,
        cue.end,
      ]),
    ]),
  ].sort((left: number, right: number): number => left - right);
  const gaps: number = Math.max(1, ends.length - 1);
  const inside: number = Math.max(
    0,
    Math.floor((FORMATION_OVERLAP_SAMPLE_LIMIT - ends.length) / gaps),
  );
  return [
    ...new Set(
      ends.flatMap((time: number, index: number): number[] => {
        const next: number = ends[index + 1];
        return next === undefined
          ? [time]
          : [
              time,
              ...Array.from(
                { length: inside },
                (_: unknown, step: number): number =>
                  time + ((next - time) * (step + 1)) / (inside + 1),
              ),
            ];
      }),
    ),
  ];
};

/**
 * For every LOD tier pair, find the widest radius sum whose vertical intervals strictly overlap, then take the tier-pair minimum.
 *
 * Clearance must hold regardless of selected runtime tier, with vertical lift applied to the right columns.
 *
 * No overlapping columns yield zero; validity relies on the column owner's occupied-solid meaning.
 *
 * Vertical lift and returned horizontal clearance use model/world metres.
 *
 * All tier pairs and their column pairs are traversed, O(sum Lc*Rc), without mesh vertex reads.
 *
 * Tier arrays are shared by candidate comparisons, but the coordinator recomputes clearance rather than retaining a pair/lift cache.
 *
 * Only a scalar returns; tier arrays are borrowed and no collision world is retained.
 */
const formationOverlapClearance: (
  left: IFormationOverlapUnit,
  right: IFormationOverlapUnit,
  lift: number,
) => number = (
  left: IFormationOverlapUnit,
  right: IFormationOverlapUnit,
  lift: number,
): number => {
  let least: number = Number.POSITIVE_INFINITY;
  for (const near of left.tiers)
    for (const far of right.tiers) {
      let widest: number = 0;
      for (const one of near)
        for (const other of far)
          if (
            Math.max(one.bottom, other.bottom + lift) <
              Math.min(one.top, other.top + lift) &&
            one.radius + other.radius > widest
          )
            widest = one.radius + other.radius;
      least = Math.min(least, widest);
    }
  return least;
};

/**
 * Place sampled members in a spatial grid and compare both same-unit and cross-unit distances against height-overlapping runtime columns across every LOD pair.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Place sampled members in a spatial grid and compare same-unit and cross-unit distances against height-overlapping runtime columns across every LOD pair.
 * @evidence contracts/common.md#clear-and-simple-design autoMovieModelColumns owns occupied proxy dimensions and placeFormationSlot owns cue-aware placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the first 4096 slots and sampled times are checked. Primitive-core columns omit unsupported geometry, nonunit ancestral scales, nonisometric axial rotations and unrepresentable outer envelopes. Exact binary64 gain equality can omit mathematically unit rotations; GPU Float32 narrowing and animated deformation also remain outside this sampled rest-geometry gate.
 * @evidence contracts/common.md#meaningful-documentation Removed members are omitted, tier-pair minimum clearance is used, and unsupported/missing columns are not guessed.
 * @evidence contracts/performance.md#efficient-algorithms M models build the runtime index; each referenced runtime's B bones and P parts incur O(B^2+P) column measurement once per call. T times place at most 4096 members per unit; local density can cause quadratic pair checks traversing tier/column pairs, while cue sampling scans current cue lists.
 * @evidence contracts/performance.md#reuse-equivalent-work A lazy request-local runtime-id map shares pure column measurement through the current runtime table; member points still use identity WeakMap caching with an unchanged-placement premise. A found row suppresses later unit-pair checks, while unsuccessful clearance computations are not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Live formation identities retain bounded member arrays; the M-entry runtime index, referenced-runtime column arrays and unit wrappers are call-local. Per-time grids release after sampling and at most quadratic unit-pair findings remain during the call, with no native collision world acquired.
 */
export const validateAutoMovieFormationOverlap: (
  contract: Pick<IAutoMovieShotContract, "id">,
  value: {
    models: readonly IAutoMovieModel[];
    formations: ReadonlyArray<
      IAutoMovieFormationPlacement & { lod: ReadonlyArray<{ runtimeModel: string }> }
    >;
    formationMotions?: readonly IAutoMovieFormationMotion[];
    formationSlotMotions?: readonly IAutoMovieFormationSlotMotion[];
  },
) => IAutoMovieDiagnostic[] = (
  contract: Pick<IAutoMovieShotContract, "id">,
  value: {
    models: readonly IAutoMovieModel[];
    formations: ReadonlyArray<
      IAutoMovieFormationPlacement & {
        lod: ReadonlyArray<{ runtimeModel: string }>;
      }
    >;
    formationMotions?: readonly IAutoMovieFormationMotion[];
    formationSlotMotions?: readonly IAutoMovieFormationSlotMotion[];
  },
): IAutoMovieDiagnostic[] => {
  const runtimes: Map<string, IAutoMovieModel> = new Map(
    value.models.map((model: IAutoMovieModel): [string, IAutoMovieModel] => [
      model.id,
      model,
    ]),
  );
  const columnsByRuntime: Map<string, IAutoMovieModelColumn[]> = new Map();
  const columnsFor: (id: string) => IAutoMovieModelColumn[] = (
    id: string,
  ): IAutoMovieModelColumn[] => {
    const remembered: IAutoMovieModelColumn[] | undefined =
      columnsByRuntime.get(id);
    if (remembered !== undefined) return remembered;
    const runtime: IAutoMovieModel | undefined = runtimes.get(id);
    if (runtime === undefined) return [];
    const columns: IAutoMovieModelColumn[] = autoMovieModelColumns(runtime);
    columnsByRuntime.set(id, columns);
    return columns;
  };
  const units: IFormationOverlapUnit[] = value.formations.flatMap(
    (
      formation: Pick<
        IAutoMovieFormationDesign,
        "id" | "count" | "layout" | "anchor" | "facingDeg" | "seed"
      > &
        IAutoMovieFormationGrounding & {
          lod: ReadonlyArray<{ runtimeModel: string }>;
        },
      index: number,
    ): IFormationOverlapUnit[] => {
      const tiers: IAutoMovieModelColumn[][] = formation.lod.map(
        (tier: { runtimeModel: string }): IAutoMovieModelColumn[] =>
          columnsFor(tier.runtimeModel),
      );
      // A unit with a tier this shot does not carry, or one whose geometry fills
      // no column at all, has no size this gate can prove. Measuring it against
      // a stand-in number is how a gate starts refusing productions that were
      // correct, so it is left alone instead.
      return tiers.length === 0 ||
        tiers.some(
          (columns: IAutoMovieModelColumn[]): boolean => columns.length === 0,
        )
        ? []
        : [
            {
              index,
              formation,
              members: formationOverlapMembers(formation),
              tiers,
            },
          ];
    },
  );
  if (units.length === 0) return [];
  const cues: readonly IAutoMovieFormationMotion[] =
    value.formationMotions ?? [];
  const slotCues: readonly IAutoMovieFormationSlotMotion[] =
    value.formationSlotMotions ?? [];
  // One cell wide enough that no pair inside its own clearance can fall outside
  // the ring of cells around either of them. A height difference narrows a
  // clearance and never widens it, so twice the widest column in the shot bounds
  // every clearance there is.
  const cell: number =
    2 *
    Math.max(
      ...units.flatMap((unit: IFormationOverlapUnit): number[] =>
        unit.tiers.flatMap(
          (columns: readonly IAutoMovieModelColumn[]): number[] =>
            columns.map(
              (column: IAutoMovieModelColumn): number => column.radius,
            ),
        ),
      ),
    );
  const found: Map<
    string,
    {
      time: number;
      left: IFormationOverlapPlacement;
      right: IFormationOverlapPlacement;
      apart: number;
      clearance: number;
    }
  > = new Map<
    string,
    {
      time: number;
      left: IFormationOverlapPlacement;
      right: IFormationOverlapPlacement;
      apart: number;
      clearance: number;
    }
  >();
  for (const time of formationOverlapSampleTimes(cues, slotCues)) {
    const grid: Map<string, IFormationOverlapPlacement[]> = new Map<
      string,
      IFormationOverlapPlacement[]
    >();
    for (const unit of units) {
      const motion: IAutoMovieSampledFormationMotion = sampleFormationMotion(
        cues,
        unit.formation.id,
        time,
      );
      for (const member of unit.members) {
        // Where the design puts this member NOW: a re-forming unit is moving
        // its own arrangement, so the cached point is where the member stood
        // before the cue began. Members crossing each other mid-re-form is
        // exactly the collision this gate exists to catch.
        const designed: IAutoMovieVector3 =
          motion.reform === null
            ? member.point
            : formationSlotPosition(unit.formation, member.slot, motion.reform);
        const placed: IAutoMovieFormationSlotPlacement = placeFormationSlot({
          position: designed,
          facingDeg: unit.formation.facingDeg,
          anchor: unit.formation.anchor,
          baseFacingDeg: unit.formation.facingDeg,
          unit: motion,
          member: sampleFormationSlotMotion(
            slotCues,
            unit.formation.id,
            member.slot,
            time,
          ),
        });
        if (placed.present === false) continue;
        const here: IFormationOverlapPlacement = {
          unit,
          slot: member.slot,
          point: placed.position,
        };
        const column: number = Math.floor(placed.position.x / cell);
        const row: number = Math.floor(placed.position.z / cell);
        for (let across: number = -1; across <= 1; ++across)
          for (let along: number = -1; along <= 1; ++along)
            for (const other of grid.get(`${column + across}:${row + along}`) ??
              []) {
              // Ordered by the unit each stands in, and every member already in
              // the grid was placed by a unit no later than this one, so one
              // reading of a pair of units is the whole of what it reports.
              const pair: string = `${other.unit.index}:${unit.index}`;
              if (found.has(pair)) continue;
              const clearance: number = formationOverlapClearance(
                other.unit,
                unit,
                here.point.y - other.point.y,
              );
              const apart: number = Math.hypot(
                here.point.x - other.point.x,
                here.point.z - other.point.z,
              );
              if (apart >= clearance) continue;
              found.set(pair, {
                time,
                left: other,
                right: here,
                apart,
                clearance,
              });
            }
        const key: string = `${column}:${row}`;
        const neighbours: IFormationOverlapPlacement[] | undefined =
          grid.get(key);
        if (neighbours === undefined) grid.set(key, [here]);
        else neighbours.push(here);
      }
    }
  }
  return [...found.values()].map(
    (overlap: {
      time: number;
      left: IFormationOverlapPlacement;
      right: IFormationOverlapPlacement;
      apart: number;
      clearance: number;
    }): IAutoMovieDiagnostic =>
      engineDiagnostic(
        contract.id,
        `formation:${overlap.left.unit.formation.id}`,
        // Reported to the millimetre and the millisecond, the same as every other
        // reading a shot's author reads to find a place on a field. Only the
        // reading is rounded; the comparison above is not.
        `must not stand a member where another body already is, but at ${round(
          overlap.time,
        )}s ${
          overlap.left.unit === overlap.right.unit
            ? `its slots ${overlap.left.slot} and ${overlap.right.slot}`
            : `its slot ${overlap.left.slot} and slot ${overlap.right.slot} of "${overlap.right.unit.formation.id}"`
        } stand ${round(overlap.apart)}m apart at (${round(
          (overlap.left.point.x + overlap.right.point.x) / 2,
        )}, ${round(
          (overlap.left.point.z + overlap.right.point.z) / 2,
        )}), inside the ${round(overlap.clearance)}m their bodies fill`,
      ),
  );
};

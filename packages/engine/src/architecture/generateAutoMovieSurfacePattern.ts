import { positive } from "../geometry/positive";
import { Quaternion } from "../math/Quaternion";
import { seededValue } from "../math/seededValue";
import { IAutoMoviePatternCandidate } from "./IAutoMoviePatternCandidate";
import { IAutoMoviePatternExclusion } from "./IAutoMoviePatternExclusion";
import { IAutoMoviePatternPlacement } from "./IAutoMoviePatternPlacement";
import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";
import { IAutoMoviePatternQuantities } from "./IAutoMoviePatternQuantities";
import { IAutoMoviePatternZoneQuantities } from "./IAutoMoviePatternZoneQuantities";
import { IAutoMovieSurfacePattern } from "./IAutoMovieSurfacePattern";
import { IAutoMovieSurfacePatternResult } from "./IAutoMovieSurfacePatternResult";
import { IAutoMovieSurfacePatternZone } from "./IAutoMovieSurfacePatternZone";
import { autoMoviePatternFindings } from "./autoMoviePatternFindings";
import { autoMoviePatternPolygonArea } from "./autoMoviePatternPolygonArea";
import { canonicalAutoMoviePatternPolygon } from "./canonicalAutoMoviePatternPolygon";
import { clipAutoMoviePatternPolygon } from "./clipAutoMoviePatternPolygon";
import { AUTOMOVIE_MAX_PATTERN_CELLS } from "./constants/AUTOMOVIE_MAX_PATTERN_CELLS";

/** Domain constant separating variant draws from every other seeded decision. */
const VARIANT_DOMAIN: number = 0x7061_7474;

/** Smallest square metre area counted as real coverage. */
const AREA_EPSILON: number = 1e-12;

/**
 * The inclusive span of a face-local outline on both axes, in metres.
 *
 * @author Samchon
 */
interface IPatternSpan {
  /** Least U coordinate. */
  minU: number;

  /** Greatest U coordinate. */
  maxU: number;

  /** Least V coordinate. */
  minV: number;

  /** Greatest V coordinate. */
  maxV: number;
}

/**
 * Lay one pattern and measure exactly what was laid.
 *
 * With stable input and a pure generator, the fixed sequence is repeatable in the same numerical runtime: zones in declaration order, rows outermost, columns innermost and candidates in generator order. Engine code samples neither clock nor `Math.random`; variants use {@link seededValue} with the pattern seed and an FNV-1a occurrence-id hash. The callback's own purity is a caller premise.
 *
 * Every module is clipped to its own zone region, then measured against every
 * exclusion. A module the region rejects entirely is not a zero-area
 * occurrence, it is absent, and so is one an exclusion covers entirely. What
 * survives carries the coverage it kept, why it was cut, and the identity that
 * the mesh, the instance slot, the finish, and the take-off all cite, so a
 * quantity can be traced back to the exact piece it counted. Quantities are
 * reported per zone and in total, and quality is judged by
 * {@link autoMoviePatternFindings}.
 *
 * Coordinates are the surface's planar (u, v) metres and angles are degrees. A malformed declaration throws an `Error` naming the field: blank or duplicate ids, non-finite or non-positive sizes, a non-convex region or exclusion, overlapping zones or exclusions, ambiguous surviving occurrence ids, a zone spanning more than `AUTOMOVIE_MAX_PATTERN_CELLS` lattice cells, non-safe-integer derived lattice bounds, or a generated module reaching beyond its cell's declared reach. Quality defects are not thrown; they are returned as `findings` (sliver, unsupported-piece, module-overlap, joint-deviation, grain-break).
 *
 * @param props.pattern The declaration to lay.
 * @returns The pattern id, every surviving placement, the quantities, and the quality findings.
 *
 * @evidence contracts/common.md#principled-implementation Enumerates safe-integer lattice bounds, clips rectangles against canonical convex outlines and measures binary64 shoelace areas. Zone/exclusion overlap beyond tolerance is refused; smaller overlaps can affect accounting. A run-wide set refuses collisions in slash-composed surviving occurrence ids without restricting authored characters. FNV-1a hashing and `seededValue` stabilize variants, without asserting collision-free hashes or cross-platform transcendental bit identity.
 * @evidence contracts/common.md#clear-and-simple-design The run owns laying and quantities; clipping, canonical outlines and area live in `clipAutoMoviePatternPolygon`, `canonicalAutoMoviePatternPolygon` and `autoMoviePatternPolygonArea`, and quality judgement in `autoMoviePatternFindings`, and every zone region is canonicalized once and reused for the overlap check and the clip.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no zone, module or material. The shared cell cap refuses oversized enumerations, and derived safe-integer bounds ensure incrementing loop indexes advances. Area tolerances define accepted discrepancies rather than proving every floating-point error is bounded.
 * @evidence contracts/common.md#meaningful-documentation States the fixed run order and the only source of randomness, when a module is absent, what each placement carries, the units, every thrown refusal, and that quality defects are returned rather than thrown.
 * @evidence contracts/performance.md#efficient-algorithms Canonical hulls cost the sum of n log n over authored outline sizes. Performs Z² zone and E² exclusion clips, whose costs depend on outline vertices, then capped cell enumeration plus arbitrary generator work and one region/E exclusion clips per candidate. Adds id hashing, quantity folds and the full `autoMoviePatternFindings` partner/geometry/sort cost; candidate count and callback time are not bounded by the cell cap.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Lays one declaration per call; the generator is the author's code and may not be pure, so no earlier run's placements are reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Placements/outlines and the run-wide occurrence-id set grow with survivors; each zone's seen-id set grows with all generated candidates including discarded ones. Findings can grow quadratically and callback output has no fixed cap. Local sets/clip arrays are released after use; the caller owns returned records.
 */
export const generateAutoMovieSurfacePattern: (props: {
  pattern: IAutoMovieSurfacePattern;
}) => IAutoMovieSurfacePatternResult = (props: {
  pattern: IAutoMovieSurfacePattern;
}): IAutoMovieSurfacePatternResult => {
  const { pattern }: { pattern: IAutoMovieSurfacePattern } = props;
  const exclusions: IAutoMoviePatternPoint[][] = validatePattern(pattern);
  const regions: IAutoMoviePatternPoint[][] = pattern.zones.map(
    (
      zone: IAutoMovieSurfacePatternZone,
      index: number,
    ): IAutoMoviePatternPoint[] =>
      canonicalAutoMoviePatternPolygon(
        zone.region,
        `pattern zone[${index}] region`,
      ),
  );
  const placements: IAutoMoviePatternPlacement[] = [];
  const occurrenceIds: Set<string> = new Set();
  const zoneQuantities: IAutoMoviePatternZoneQuantities[] = [];

  pattern.zones.forEach(
    (zone: IAutoMovieSurfacePatternZone, zoneIndex: number): void => {
      const region: IAutoMoviePatternPoint[] = regions[zoneIndex]!;
      for (let other: number = 0; other < zoneIndex; ++other)
        if (overlapArea(region, regions[other]!) > AREA_EPSILON)
          throw new Error(
            `pattern zones "${pattern.zones[other]!.id}" and "${zone.id}" overlap`,
          );
      const start: number = placements.length;
      layZone(pattern, zone, region, exclusions, placements, occurrenceIds);
      zoneQuantities.push(
        summarize(
          zone.id,
          placements.slice(start),
          autoMoviePatternPolygonArea(region) -
            exclusions.reduce(
              (sum: number, exclusion: IAutoMoviePatternPoint[]): number =>
                sum + overlapArea(region, exclusion),
              0,
            ),
        ),
      );
    },
  );

  return {
    id: pattern.id,
    placements,
    quantities: totalQuantities(pattern, placements, zoneQuantities),
    findings: autoMoviePatternFindings(pattern, placements),
  };
};

/** Enumerate one zone's lattice and append every surviving piece. */
const layZone: (
  pattern: IAutoMovieSurfacePattern,
  zone: IAutoMovieSurfacePatternZone,
  region: readonly IAutoMoviePatternPoint[],
  exclusions: readonly IAutoMoviePatternPoint[][],
  placements: IAutoMoviePatternPlacement[],
  occurrenceIds: Set<string>,
) => void = (
  pattern: IAutoMovieSurfacePattern,
  zone: IAutoMovieSurfacePatternZone,
  region: readonly IAutoMoviePatternPoint[],
  exclusions: readonly IAutoMoviePatternPoint[][],
  placements: IAutoMoviePatternPlacement[],
  occurrenceIds: Set<string>,
): void => {
  const span: IPatternSpan = spanOf(region);
  const columns: { min: number; max: number } = latticeRange(
    span.minU,
    span.maxU,
    zone.origin.u,
    zone.period.u,
    zone.reach.u,
  );
  const rows: { min: number; max: number } = latticeRange(
    span.minV,
    span.maxV,
    zone.origin.v,
    zone.period.v,
    zone.reach.v,
  );
  const cells: number =
    (columns.max - columns.min + 1) * (rows.max - rows.min + 1);
  if (
    !Number.isSafeInteger(cells) ||
    cells < 1 ||
    cells > AUTOMOVIE_MAX_PATTERN_CELLS
  )
    throw new Error(
      `pattern zone "${zone.id}" spans ${cells} lattice cells, above the ${AUTOMOVIE_MAX_PATTERN_CELLS} cell limit`,
    );
  const seen: Set<string> = new Set();
  for (let row: number = rows.min; row <= rows.max; ++row)
    for (let column: number = columns.min; column <= columns.max; ++column) {
      const origin: IAutoMoviePatternPoint = {
        u: zone.origin.u + column * zone.period.u,
        v: zone.origin.v + row * zone.period.v,
      };
      for (const candidate of zone.generate({
        column,
        row,
        origin,
        period: { u: zone.period.u, v: zone.period.v },
      })) {
        const outline: IAutoMoviePatternPoint[] = clipAutoMoviePatternPolygon(
          validateCandidate(zone, candidate, origin, seen),
          region,
        );
        const clipped: number = autoMoviePatternPolygonArea(outline);
        if (clipped <= AREA_EPSILON) continue;
        const removed: number = exclusions.reduce(
          (sum: number, exclusion: IAutoMoviePatternPoint[]): number =>
            sum + overlapArea(outline, exclusion),
          0,
        );
        const area: number = clipped - removed;
        if (area <= AREA_EPSILON) continue;
        const moduleArea: number = candidate.size.u * candidate.size.v;
        const id: string = `${zone.id}/${candidate.id}`;
        if (occurrenceIds.has(id))
          throw new Error(
            `pattern occurrence id "${id}" is ambiguous across zones and modules`,
          );
        occurrenceIds.add(id);
        const boundaryCut: boolean = clipped < moduleArea - AREA_EPSILON;
        const punched: boolean = removed > AREA_EPSILON;
        placements.push({
          id,
          zone: zone.id,
          module: candidate.id,
          material: zone.material,
          center: { u: candidate.center.u, v: candidate.center.v },
          size: { u: candidate.size.u, v: candidate.size.v },
          rotationDeg: candidate.rotationDeg,
          grainDeg: candidate.grainDeg,
          mirror: candidate.mirror,
          area,
          coverage: area / moduleArea,
          cut:
            boundaryCut && punched
              ? "both"
              : boundaryCut
                ? "boundary"
                : punched
                  ? "exclusion"
                  : "none",
          variant: variantOf(pattern, id),
          outline,
          punchedArea: punched ? removed : 0,
        });
      }
    }
};

/** Check the declaration's own fields and canonicalize its exclusions. */
const validatePattern: (
  pattern: IAutoMovieSurfacePattern,
) => IAutoMoviePatternPoint[][] = (
  pattern: IAutoMovieSurfacePattern,
): IAutoMoviePatternPoint[][] => {
  nonBlank(pattern.id, "pattern id");
  if (pattern.zones.length === 0)
    throw new Error("a surface pattern needs at least one zone");
  atLeast(pattern.joint, 0, "pattern joint");
  atLeast(pattern.jointTolerance, 0, "pattern joint tolerance");
  atLeast(pattern.adjacency, 0, "pattern adjacency");
  if (
    !Number.isFinite(pattern.minimumPiece) ||
    pattern.minimumPiece <= 0 ||
    pattern.minimumPiece > 1
  )
    throw new Error("pattern minimum piece must be a finite number in (0, 1]");
  if (pattern.grainToleranceDeg !== null)
    atLeast(pattern.grainToleranceDeg, 0, "pattern grain tolerance");
  if (!Number.isSafeInteger(pattern.seed) || pattern.seed < 0)
    throw new Error("pattern seed must be a safe integer >= 0");
  if (!Number.isSafeInteger(pattern.variants) || pattern.variants < 1)
    throw new Error("pattern variants must be a safe integer >= 1");

  const zoneIds: Set<string> = new Set();
  pattern.zones.forEach(
    (zone: IAutoMovieSurfacePatternZone, index: number): void => {
      nonBlank(zone.id, `pattern zone[${index}] id`);
      if (zoneIds.has(zone.id))
        throw new Error(`pattern zone id "${zone.id}" must be unique`);
      zoneIds.add(zone.id);
      finitePoint(zone.origin, `pattern zone "${zone.id}" origin`);
      positive(zone.period.u, `pattern zone "${zone.id}" period u`);
      positive(zone.period.v, `pattern zone "${zone.id}" period v`);
      positive(zone.reach.u, `pattern zone "${zone.id}" reach u`);
      positive(zone.reach.v, `pattern zone "${zone.id}" reach v`);
    },
  );

  const exclusionIds: Set<string> = new Set();
  const exclusions: IAutoMoviePatternPoint[][] = pattern.exclusions.map(
    (
      exclusion: IAutoMoviePatternExclusion,
      index: number,
    ): IAutoMoviePatternPoint[] => {
      nonBlank(exclusion.id, `pattern exclusion[${index}] id`);
      if (exclusionIds.has(exclusion.id))
        throw new Error(
          `pattern exclusion id "${exclusion.id}" must be unique`,
        );
      exclusionIds.add(exclusion.id);
      return canonicalAutoMoviePatternPolygon(
        exclusion.polygon,
        `pattern exclusion "${exclusion.id}" polygon`,
      );
    },
  );
  for (let left: number = 0; left < exclusions.length; ++left)
    for (let right: number = left + 1; right < exclusions.length; ++right)
      if (overlapArea(exclusions[left]!, exclusions[right]!) > AREA_EPSILON)
        throw new Error(
          `pattern exclusions "${pattern.exclusions[left]!.id}" and "${pattern.exclusions[right]!.id}" overlap`,
        );
  return exclusions;
};

/**
 * Judge one generated module and hand back the corners the judgment used.
 *
 * The reach check has to build the module's corners anyway, and the clipper
 * needs exactly those corners next, so they are returned rather than built a
 * second time in the innermost loop of the whole run.
 */
const validateCandidate: (
  zone: IAutoMovieSurfacePatternZone,
  candidate: IAutoMoviePatternCandidate,
  origin: IAutoMoviePatternPoint,
  seen: Set<string>,
) => IAutoMoviePatternPoint[] = (
  zone: IAutoMovieSurfacePatternZone,
  candidate: IAutoMoviePatternCandidate,
  origin: IAutoMoviePatternPoint,
  seen: Set<string>,
): IAutoMoviePatternPoint[] => {
  nonBlank(candidate.id, `pattern zone "${zone.id}" module id`);
  if (seen.has(candidate.id))
    throw new Error(
      `pattern zone "${zone.id}" module id "${candidate.id}" must be unique`,
    );
  seen.add(candidate.id);
  const label: string = `pattern module "${zone.id}/${candidate.id}"`;
  finitePoint(candidate.center, `${label} center`);
  positive(candidate.size.u, `${label} size u`);
  positive(candidate.size.v, `${label} size v`);
  if (
    !Number.isFinite(candidate.rotationDeg) ||
    !Number.isFinite(candidate.grainDeg)
  )
    throw new Error(`${label} rotation and grain must be finite`);
  const corners: IAutoMoviePatternPoint[] = moduleCorners(candidate);
  for (const corner of corners)
    if (
      Math.abs(corner.u - origin.u) > zone.reach.u ||
      Math.abs(corner.v - origin.v) > zone.reach.v
    )
      throw new Error(
        `${label} reaches beyond the declared reach of its cell origin`,
      );
  return corners;
};

/**
 * The inclusive lattice range whose cells can still touch the region.
 *
 * A cell contributes when a module reaching `reach` from its origin can still
 * meet the region's own span, so the range is the region widened by the reach
 * and then divided by the pitch. Widening before dividing is what keeps a
 * module laid across a cell border from being lost at the region's edge.
 */
const latticeRange: (
  min: number,
  max: number,
  origin: number,
  period: number,
  reach: number,
) => { min: number; max: number } = (
  min: number,
  max: number,
  origin: number,
  period: number,
  reach: number,
): { min: number; max: number } => {
  const range: { min: number; max: number } = {
    min: Math.floor((min - reach - origin) / period),
    max: Math.ceil((max + reach - origin) / period),
  };
  if (
    !Number.isSafeInteger(range.min) ||
    !Number.isSafeInteger(range.max) ||
    range.min > range.max
  )
    throw new Error("pattern lattice bounds must be ordered safe integers");
  return range;
};

/** A module rectangle's four corners, counter-clockwise, turned in place. */
const moduleCorners: (
  candidate: IAutoMoviePatternCandidate,
) => IAutoMoviePatternPoint[] = (
  candidate: IAutoMoviePatternCandidate,
): IAutoMoviePatternPoint[] => {
  const angle: number = candidate.rotationDeg * Quaternion.DEG2RAD;
  const cosine: number = Math.cos(angle);
  const sine: number = Math.sin(angle);
  const halfU: number = candidate.size.u / 2;
  const halfV: number = candidate.size.v / 2;
  return [
    { u: -halfU, v: -halfV },
    { u: halfU, v: -halfV },
    { u: halfU, v: halfV },
    { u: -halfU, v: halfV },
  ].map(
    (corner: IAutoMoviePatternPoint): IAutoMoviePatternPoint => ({
      u: candidate.center.u + corner.u * cosine - corner.v * sine,
      v: candidate.center.v + corner.u * sine + corner.v * cosine,
    }),
  );
};

/** The seeded variant index of one occurrence id, in `[0, variants)`. */
const variantOf: (pattern: IAutoMovieSurfacePattern, id: string) => number = (
  pattern: IAutoMovieSurfacePattern,
  id: string,
): number =>
  Math.min(
    pattern.variants - 1,
    Math.floor(
      seededValue(pattern.seed, hashOf(id), VARIANT_DOMAIN) * pattern.variants,
    ),
  );

/** Fold an occurrence id into a 32-bit integer with FNV-1a. */
const hashOf: (id: string) => number = (id: string): number => {
  let hash: number = 0x811c9dc5;
  for (let index: number = 0; index < id.length; ++index) {
    hash = (hash ^ id.charCodeAt(index)) >>> 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
};

/** One zone's take-off from its own placements and net region area. */
const summarize: (
  zone: string,
  placements: readonly IAutoMoviePatternPlacement[],
  netRegionArea: number,
) => IAutoMoviePatternZoneQuantities = (
  zone: string,
  placements: readonly IAutoMoviePatternPlacement[],
  netRegionArea: number,
): IAutoMoviePatternZoneQuantities => {
  let coveredArea: number = 0;
  let consumedArea: number = 0;
  let whole: number = 0;
  for (const placement of placements) {
    coveredArea += placement.area;
    consumedArea += placement.size.u * placement.size.v;
    if (placement.cut === "none") ++whole;
  }
  return {
    zone,
    modules: placements.length,
    whole,
    cut: placements.length - whole,
    coveredArea,
    consumedArea,
    wasteArea: consumedArea - coveredArea,
    netRegionArea,
  };
};

/** The whole pattern's take-off, summed from its zones. */
const totalQuantities: (
  pattern: IAutoMovieSurfacePattern,
  placements: readonly IAutoMoviePatternPlacement[],
  zones: readonly IAutoMoviePatternZoneQuantities[],
) => IAutoMoviePatternQuantities = (
  pattern: IAutoMovieSurfacePattern,
  placements: readonly IAutoMoviePatternPlacement[],
  zones: readonly IAutoMoviePatternZoneQuantities[],
): IAutoMoviePatternQuantities => {
  const sum: (
    read: (zone: IAutoMoviePatternZoneQuantities) => number,
  ) => number = (
    read: (zone: IAutoMoviePatternZoneQuantities) => number,
  ): number =>
    zones.reduce(
      (total: number, zone: IAutoMoviePatternZoneQuantities): number =>
        total + read(zone),
      0,
    );
  const coveredArea: number = sum(
    (zone: IAutoMoviePatternZoneQuantities): number => zone.coveredArea,
  );
  const consumedArea: number = sum(
    (zone: IAutoMoviePatternZoneQuantities): number => zone.consumedArea,
  );
  const netRegionArea: number = sum(
    (zone: IAutoMoviePatternZoneQuantities): number => zone.netRegionArea,
  );
  const wasteArea: number = consumedArea - coveredArea;
  const jointArea: number = netRegionArea - coveredArea;
  return {
    modules: placements.length,
    whole: sum((zone: IAutoMoviePatternZoneQuantities): number => zone.whole),
    cut: sum((zone: IAutoMoviePatternZoneQuantities): number => zone.cut),
    coveredArea,
    consumedArea,
    wasteArea,
    wasteRatio: consumedArea === 0 ? 0 : wasteArea / consumedArea,
    netRegionArea,
    jointArea,
    jointLength: pattern.joint === 0 ? 0 : jointArea / pattern.joint,
    zones: [...zones],
  };
};

/** The area two convex outlines share, the second canonical. */
const overlapArea: (
  subject: readonly IAutoMoviePatternPoint[],
  clipper: readonly IAutoMoviePatternPoint[],
) => number = (
  subject: readonly IAutoMoviePatternPoint[],
  clipper: readonly IAutoMoviePatternPoint[],
): number =>
  autoMoviePatternPolygonArea(clipAutoMoviePatternPolygon(subject, clipper));

/** The extent of a non-empty outline on both face-local axes. */
const spanOf: (polygon: readonly IAutoMoviePatternPoint[]) => IPatternSpan = (
  polygon: readonly IAutoMoviePatternPoint[],
): IPatternSpan => {
  const span: IPatternSpan = {
    minU: Infinity,
    maxU: -Infinity,
    minV: Infinity,
    maxV: -Infinity,
  };
  for (const point of polygon) {
    span.minU = Math.min(span.minU, point.u);
    span.maxU = Math.max(span.maxU, point.u);
    span.minV = Math.min(span.minV, point.v);
    span.maxV = Math.max(span.maxV, point.v);
  }
  return span;
};

const finitePoint: (point: IAutoMoviePatternPoint, label: string) => void = (
  point: IAutoMoviePatternPoint,
  label: string,
): void => {
  if (!Number.isFinite(point.u) || !Number.isFinite(point.v))
    throw new Error(`${label} must be finite`);
};

const nonBlank: (value: string, label: string) => void = (
  value: string,
  label: string,
): void => {
  if (value.trim().length === 0) throw new Error(`${label} must be non-empty`);
};

const atLeast: (value: number, limit: number, label: string) => void = (
  value: number,
  limit: number,
  label: string,
): void => {
  if (!Number.isFinite(value) || value < limit)
    throw new Error(`${label} must be a finite number >= ${limit}`);
};

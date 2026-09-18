import { Quaternion } from "../math/Quaternion";
import { convexHull2D } from "../math/convexHull2D";
import { positiveModulo } from "../math/positiveModulo";
import { seededValue } from "../math/seededValue";
import { AUTOMOVIE_MAX_PATTERN_CELLS } from "./AUTOMOVIE_MAX_PATTERN_CELLS";
import { IAutoMoviePatternCandidate } from "./IAutoMoviePatternCandidate";
import { IAutoMoviePatternFinding } from "./IAutoMoviePatternFinding";
import { IAutoMoviePatternPlacement } from "./IAutoMoviePatternPlacement";
import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";
import { IAutoMoviePatternQuantities } from "./IAutoMoviePatternQuantities";
import { IAutoMoviePatternZoneQuantities } from "./IAutoMoviePatternZoneQuantities";
import { IAutoMovieSurfacePattern } from "./IAutoMovieSurfacePattern";
import { IAutoMovieSurfacePatternResult } from "./IAutoMovieSurfacePatternResult";
import { IAutoMovieSurfacePatternZone } from "./IAutoMovieSurfacePatternZone";

/** Domain constant separating variant draws from every other seeded decision. */
const VARIANT_DOMAIN = 0x7061_7474;

/** Smallest square metre area counted as real coverage. */
const AREA_EPSILON = 1e-12;

/** Smallest metre length counted as a real gap or overlap. */
const LENGTH_EPSILON = 1e-9;

/** Smallest surviving-fraction shortfall counted as a real sliver. */
const COVERAGE_EPSILON = 1e-12;

/**
 * Lay one pattern and measure exactly what was laid.
 *
 * The run is a fixed sequence so two runs of the same declaration produce
 * byte-identical output on every platform: zones in declaration order, lattice
 * rows outermost and columns innermost, and each cell's modules in the order
 * the author's generator returned them. Nothing samples a clock, a hash
 * iteration order, or `Math.random`; the only randomness is {@link seededValue},
 * drawn from the pattern seed and the occurrence id.
 *
 * Every module is clipped to its own zone region, then measured against every
 * exclusion. A module the region rejects entirely is not a zero-area
 * occurrence, it is absent. What survives carries the coverage it kept, why it
 * was cut, and the identity that the mesh, the instance slot, the finish, and
 * the take-off all cite, so a quantity can be traced back to the exact piece it
 * counted.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `generateAutoMovieSurfacePattern` lays one pattern and measures exactly what was laid. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `generateAutoMovieSurfacePattern` performs auto movie surface pattern generation when the engine resolves the declared physical-module pattern deterministically.
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-cuts-borders `generateAutoMovieSurfacePattern` clips lattice cells against zones and exclusions, distinguishes full, cut, and unsupported pieces, enforces minimum pieces, and reports exact waste.
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-deterministic-variation `generateAutoMovieSurfacePattern` derives each occurrence variant from the stable pattern seed and stable occurrence identity instead of draw order or frame time.
 * @evidence requirements/interior/grain-seams-and-continuity.md#interior-grain-continuity-evidence `generateAutoMovieSurfacePattern` returns each piece identity, outline, grain, mirror and variant together with measured grain-break findings.
 * @evidence requirements/interior/joints-edges-and-transitions.md#interior-joint-repetition-exception `generateAutoMovieSurfacePattern` applies explicit zone and exclusion overrides to the repeated joint lattice without changing unaffected occurrences.
 * @evidence requirements/interior/joints-edges-and-transitions.md#interior-joint-validation `generateAutoMovieSurfacePattern` emits overlap, joint-deviation, sliver, unsupported-piece, and grain-break findings at the exact affected occurrence.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-joint-edge-grain-continuity The result preserves piece-level grain and joint observations needed to validate the laid surface without claiming source-stock provenance.
 * @evidence requirements/building-exterior/patterns-and-instances.md#building-exterior-pattern-continuity `generateAutoMovieSurfacePattern` lays the same developed lattice through declared exterior facets, cuts, exclusions, and stable occurrence identities.
 * @evidence specifications/building-envelope/external-assets-patterns-and-instances.md#building-envelope-pattern-input-output The generator consumes the declared exterior pattern domain and returns deterministic pieces, cuts, variants, findings, and quantities.
 * @evidence requirements/asset-authoring/patterns-and-procedural-composition.md#asset-physical-module `generateAutoMovieSurfacePattern` expands the declared physical module, period, offset, reach, and host zones into measured piece geometry and quantities.
 * @evidence requirements/asset-authoring/patterns-and-procedural-composition.md#asset-procedural-rule `generateAutoMovieSurfacePattern` executes only the declared generator, zone, lattice, clipping, and exclusion rules rather than inferring a decorative layout.
 * @evidence requirements/asset-authoring/patterns-and-procedural-composition.md#asset-deterministic-variation `generateAutoMovieSurfacePattern` derives bounded variants from the stable seed and occurrence identity so traversal and frame order cannot change them.
 * @evidence requirements/asset-authoring/patterns-and-procedural-composition.md#asset-pattern-boundary-exception `generateAutoMovieSurfacePattern` retains clipped and excluded boundary occurrences as separately identified cut pieces or explicit unsupported findings.
 * @evidence requirements/asset-authoring/patterns-and-procedural-composition.md#asset-pattern-local-stability `generateAutoMovieSurfacePattern` preserves every unaffected stable occurrence identity when a local zone, exclusion, or cut changes.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-procedural-pattern-inputs The generator consumes explicit module, domain, seed, boundary, and exception inputs and returns deterministic occurrence identities, geometry, variants, and findings.
 * @evidence requirements/interior/groups-instances-and-repetition.md#interior-group-bounded-expansion `generateAutoMovieSurfacePattern` refuses a repeated surface expansion beyond its exported cell ceiling before materializing occurrences.
 * @evidence requirements/interior/groups-instances-and-repetition.md#interior-group-identity-preservation `generateAutoMovieSurfacePattern` derives stable occurrence identities and keeps clipped boundary exceptions distinct from full repeated pieces.
 * @evidence specifications/interior-space/external-assets-and-groups.md#interior-space-repeated-group-identity The generator implements the bounded repeated-piece identity subset without claiming arbitrary nested subject groups or room-storey repetition.
 */
export const generateAutoMovieSurfacePattern = (props: {
  pattern: IAutoMovieSurfacePattern;
}): IAutoMovieSurfacePatternResult => {
  const { pattern } = props;
  const exclusions = validatePattern(pattern);
  const placements: IAutoMoviePatternPlacement[] = [];
  const zoneQuantities: IAutoMoviePatternZoneQuantities[] = [];

  pattern.zones.forEach((zone, zoneIndex) => {
    const region = convexPolygon(
      zone.region,
      `pattern zone[${zoneIndex}] region`,
    );
    for (let other = 0; other < zoneIndex; ++other)
      if (
        polygonArea(
          clipConvex(
            region,
            convexPolygon(
              pattern.zones[other]!.region,
              `pattern zone[${other}] region`,
            ),
          ),
        ) > AREA_EPSILON
      )
        throw new Error(
          `pattern zones "${pattern.zones[other]!.id}" and "${zone.id}" overlap`,
        );
    const bounds = boundsOf(region);
    const columns = latticeRange(
      bounds.minU,
      bounds.maxU,
      zone.origin.u,
      zone.period.u,
      zone.reach.u,
    );
    const rows = latticeRange(
      bounds.minV,
      bounds.maxV,
      zone.origin.v,
      zone.period.v,
      zone.reach.v,
    );
    const cells = (columns.max - columns.min + 1) * (rows.max - rows.min + 1);
    if (cells > AUTOMOVIE_MAX_PATTERN_CELLS)
      throw new Error(
        `pattern zone "${zone.id}" spans ${cells} lattice cells, above the ${AUTOMOVIE_MAX_PATTERN_CELLS} cell limit`,
      );
    const netRegionArea =
      polygonArea(region) -
      exclusions.reduce(
        (sum, exclusion) => sum + polygonArea(clipConvex(region, exclusion)),
        0,
      );
    const seen = new Set<string>();
    const start = placements.length;
    for (let row = rows.min; row <= rows.max; ++row)
      for (let column = columns.min; column <= columns.max; ++column) {
        const origin = {
          u: zone.origin.u + column * zone.period.u,
          v: zone.origin.v + row * zone.period.v,
        };
        for (const candidate of zone.generate({
          column,
          row,
          origin,
          period: { u: zone.period.u, v: zone.period.v },
        })) {
          const outline = clipConvex(
            validateCandidate(zone, candidate, origin, seen),
            region,
          );
          const clipped = polygonArea(outline);
          if (clipped <= AREA_EPSILON) continue;
          const removed = exclusions.reduce(
            (sum, exclusion) =>
              sum + polygonArea(clipConvex(outline, exclusion)),
            0,
          );
          const area = clipped - removed;
          if (area <= AREA_EPSILON) continue;
          const moduleArea = candidate.size.u * candidate.size.v;
          const id = `${zone.id}/${candidate.id}`;
          const boundaryCut = clipped < moduleArea - AREA_EPSILON;
          const punched = removed > AREA_EPSILON;
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
    zoneQuantities.push(
      summarize(zone.id, placements.slice(start), netRegionArea),
    );
  });

  return {
    id: pattern.id,
    placements,
    quantities: totalQuantities(pattern, placements, zoneQuantities),
    findings: findingsOf(pattern, placements),
  };
};

const validatePattern = (
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

  const zoneIds = new Set<string>();
  pattern.zones.forEach((zone, index) => {
    nonBlank(zone.id, `pattern zone[${index}] id`);
    if (zoneIds.has(zone.id))
      throw new Error(`pattern zone id "${zone.id}" must be unique`);
    zoneIds.add(zone.id);
    finitePoint(zone.origin, `pattern zone "${zone.id}" origin`);
    positive(zone.period.u, `pattern zone "${zone.id}" period u`);
    positive(zone.period.v, `pattern zone "${zone.id}" period v`);
    positive(zone.reach.u, `pattern zone "${zone.id}" reach u`);
    positive(zone.reach.v, `pattern zone "${zone.id}" reach v`);
  });

  const exclusionIds = new Set<string>();
  const exclusions = pattern.exclusions.map((exclusion, index) => {
    nonBlank(exclusion.id, `pattern exclusion[${index}] id`);
    if (exclusionIds.has(exclusion.id))
      throw new Error(`pattern exclusion id "${exclusion.id}" must be unique`);
    exclusionIds.add(exclusion.id);
    return convexPolygon(
      exclusion.polygon,
      `pattern exclusion "${exclusion.id}" polygon`,
    );
  });
  for (let left = 0; left < exclusions.length; ++left)
    for (let right = left + 1; right < exclusions.length; ++right)
      if (
        polygonArea(clipConvex(exclusions[left]!, exclusions[right]!)) >
        AREA_EPSILON
      )
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
const validateCandidate = (
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
  const label = `pattern module "${zone.id}/${candidate.id}"`;
  finitePoint(candidate.center, `${label} center`);
  positive(candidate.size.u, `${label} size u`);
  positive(candidate.size.v, `${label} size v`);
  if (
    !Number.isFinite(candidate.rotationDeg) ||
    !Number.isFinite(candidate.grainDeg)
  )
    throw new Error(`${label} rotation and grain must be finite`);
  const corners = moduleCorners(candidate);
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
 * A cell contributes when a module reaching {@link reach} from its origin can
 * still meet the region's own span, so the range is the region widened by the
 * reach and then divided by the pitch. Widening before dividing is what keeps a
 * module laid across a cell border from being lost at the region's edge.
 */
const latticeRange = (
  min: number,
  max: number,
  origin: number,
  period: number,
  reach: number,
): { min: number; max: number } => ({
  min: Math.floor((min - reach - origin) / period),
  max: Math.ceil((max + reach - origin) / period),
});

const moduleCorners = (
  candidate: IAutoMoviePatternCandidate,
): IAutoMoviePatternPoint[] => {
  const angle = candidate.rotationDeg * Quaternion.DEG2RAD;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const halfU = candidate.size.u / 2;
  const halfV = candidate.size.v / 2;
  return [
    { u: -halfU, v: -halfV },
    { u: halfU, v: -halfV },
    { u: halfU, v: halfV },
    { u: -halfU, v: halfV },
  ].map((corner) => ({
    u: candidate.center.u + corner.u * cosine - corner.v * sine,
    v: candidate.center.v + corner.u * sine + corner.v * cosine,
  }));
};

const variantOf = (pattern: IAutoMovieSurfacePattern, id: string): number =>
  Math.min(
    pattern.variants - 1,
    Math.floor(
      seededValue(pattern.seed, hashOf(id), VARIANT_DOMAIN) * pattern.variants,
    ),
  );

/** Fold an occurrence id into a 32-bit integer with FNV-1a. */
const hashOf = (id: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; ++index) {
    hash = (hash ^ id.charCodeAt(index)) >>> 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
};

const summarize = (
  zone: string,
  placements: readonly IAutoMoviePatternPlacement[],
  netRegionArea: number,
): IAutoMoviePatternZoneQuantities => {
  const coveredArea = placements.reduce((sum, one) => sum + one.area, 0);
  const consumedArea = placements.reduce(
    (sum, one) => sum + one.size.u * one.size.v,
    0,
  );
  return {
    zone,
    modules: placements.length,
    whole: placements.filter((one) => one.cut === "none").length,
    cut: placements.filter((one) => one.cut !== "none").length,
    coveredArea,
    consumedArea,
    wasteArea: consumedArea - coveredArea,
    netRegionArea,
  };
};

const totalQuantities = (
  pattern: IAutoMovieSurfacePattern,
  placements: readonly IAutoMoviePatternPlacement[],
  zones: readonly IAutoMoviePatternZoneQuantities[],
): IAutoMoviePatternQuantities => {
  const coveredArea = zones.reduce((sum, one) => sum + one.coveredArea, 0);
  const consumedArea = zones.reduce((sum, one) => sum + one.consumedArea, 0);
  const netRegionArea = zones.reduce((sum, one) => sum + one.netRegionArea, 0);
  const wasteArea = consumedArea - coveredArea;
  const jointArea = netRegionArea - coveredArea;
  return {
    modules: placements.length,
    whole: zones.reduce((sum, one) => sum + one.whole, 0),
    cut: zones.reduce((sum, one) => sum + one.cut, 0),
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

/**
 * Measure every occurrence and every neighbouring pair against the declaration.
 *
 * Per-occurrence findings come first so a defect that belongs to one piece is
 * never buried under the pair findings its neighbours produced. The partner
 * list is then sorted, so a bucket map's insertion order can never reach the
 * output.
 *
 * Pairs are gathered through a uniform bucket grid rather than an all-pairs
 * sweep, and the grid is sized so the screen provably loses nothing. A piece
 * lies inside its own module rectangle, so it is never further than half that
 * rectangle's diagonal from the centre the grid buckets by. Two pieces whose
 * true separation is within the adjacency gap therefore have centres no further
 * apart than the largest module diagonal plus that gap, which is exactly the
 * cell size, so they always share a bucket or an adjacent one.
 *
 * What is then reported is the edge-normal joint, which is how a joint is read
 * and which never exceeds the true separation. A pair whose projections read
 * close while the pieces themselves sit diagonally further apart than the
 * adjacency gap is not scanned, and should not be: those two are not neighbours
 * on the surface.
 *
 * Neighbours are measured between the pieces as laid, not between the modules
 * as designed. Two zones that each cut their modules at the border they share
 * would otherwise be judged on rectangles that overlap across it and reported
 * as colliding when nothing on the surface does.
 */
const findingsOf = (
  pattern: IAutoMovieSurfacePattern,
  placements: readonly IAutoMoviePatternPlacement[],
): IAutoMoviePatternFinding[] => {
  const findings: IAutoMoviePatternFinding[] = [];
  for (const placement of placements) {
    if (placement.coverage < pattern.minimumPiece - COVERAGE_EPSILON)
      findings.push({
        kind: "sliver",
        occurrences: [placement.id],
        measured: placement.coverage,
        limit: pattern.minimumPiece,
        detail: `occurrence "${placement.id}" survives at ${placement.coverage} of a module, below the ${pattern.minimumPiece} minimum piece`,
      });
    if (placement.punchedArea > 0)
      findings.push({
        kind: "unsupported-piece",
        occurrences: [placement.id],
        measured: placement.punchedArea,
        limit: 0,
        detail: `occurrence "${placement.id}" is cut by an exclusion, so its true piece is the outline minus that area; the convex procedural kernel has no boolean difference and cannot build it`,
      });
  }
  if (placements.length === 0) return findings;

  const cellSize =
    placements.reduce(
      (largest, one) =>
        Math.max(
          largest,
          Math.sqrt(one.size.u * one.size.u + one.size.v * one.size.v),
        ),
      0,
    ) + pattern.adjacency;
  const buckets = new Map<string, number[]>();
  placements.forEach((placement, index) => {
    const key = bucketKey(placement, cellSize, 0, 0);
    const bucket = buckets.get(key);
    if (bucket === undefined) buckets.set(key, [index]);
    else bucket.push(index);
  });
  placements.forEach((placement, index) => {
    const partners = new Set<number>();
    for (let du = -1; du <= 1; ++du)
      for (let dv = -1; dv <= 1; ++dv)
        for (const candidate of buckets.get(
          bucketKey(placement, cellSize, du, dv),
        ) ?? [])
          if (candidate > index) partners.add(candidate);
    for (const partner of [...partners].sort((left, right) => left - right)) {
      const other = placements[partner]!;
      const gap = separation(placement.outline, other.outline);
      if (gap < -LENGTH_EPSILON) {
        findings.push({
          kind: "module-overlap",
          occurrences: [placement.id, other.id],
          measured: gap,
          limit: 0,
          detail: `occurrences "${placement.id}" and "${other.id}" overlap by ${-gap} m instead of leaving a joint`,
        });
        continue;
      }
      if (gap > pattern.adjacency + LENGTH_EPSILON) continue;
      if (
        Math.abs(gap - pattern.joint) >
        pattern.jointTolerance + LENGTH_EPSILON
      )
        findings.push({
          kind: "joint-deviation",
          occurrences: [placement.id, other.id],
          measured: gap,
          limit: pattern.joint,
          detail: `occurrences "${placement.id}" and "${other.id}" are ${gap} m apart, off the ${pattern.joint} m joint by more than the ${pattern.jointTolerance} m tolerance`,
        });
      if (pattern.grainToleranceDeg === null) continue;
      const deviation = grainDeviation(placement.grainDeg, other.grainDeg);
      if (deviation > pattern.grainToleranceDeg + LENGTH_EPSILON)
        findings.push({
          kind: "grain-break",
          occurrences: [placement.id, other.id],
          measured: deviation,
          limit: pattern.grainToleranceDeg,
          detail: `neighbouring occurrences "${placement.id}" and "${other.id}" run their grain ${deviation}° apart, above the ${pattern.grainToleranceDeg}° tolerance`,
        });
    }
  });
  return findings;
};

const bucketKey = (
  placement: IAutoMoviePatternPlacement,
  cellSize: number,
  du: number,
  dv: number,
): string =>
  `${Math.floor(placement.center.u / cellSize) + du},${Math.floor(placement.center.v / cellSize) + dv}`;

/** Smallest in-plane angle between two 180-periodic grain directions. */
const grainDeviation = (left: number, right: number): number => {
  const delta = positiveModulo(left - right, 180);
  return Math.min(delta, 180 - delta);
};

/**
 * The gap between two convex pieces, measured along their own edge normals.
 *
 * A joint is read perpendicular to the edges it separates, which is exactly the
 * separating-axis measurement: the largest projection gap over both pieces'
 * edge normals. A negative result is a real overlap, because no axis separated
 * them.
 */
const separation = (
  left: readonly IAutoMoviePatternPoint[],
  right: readonly IAutoMoviePatternPoint[],
): number => {
  let best = Number.NEGATIVE_INFINITY;
  for (const polygon of [left, right])
    for (let index = 0; index < polygon.length; ++index) {
      const from = polygon[index]!;
      const to = polygon[(index + 1) % polygon.length]!;
      const axis = { u: -(to.v - from.v), v: to.u - from.u };
      const length = Math.sqrt(axis.u * axis.u + axis.v * axis.v);
      const normal = { u: axis.u / length, v: axis.v / length };
      const a = project(left, normal);
      const b = project(right, normal);
      best = Math.max(best, Math.max(b.min - a.max, a.min - b.max));
    }
  return best;
};

const project = (
  polygon: readonly IAutoMoviePatternPoint[],
  axis: IAutoMoviePatternPoint,
): { min: number; max: number } => {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const point of polygon) {
    const value = point.u * axis.u + point.v * axis.v;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  return { min, max };
};

/**
 * Canonicalize an authored polygon to a counter-clockwise convex outline.
 *
 * The hull is taken and then compared with the input, so a reflex corner, an
 * interior point, a repeated point, and a point sitting on an edge are all
 * refused instead of being silently absorbed. That is the same refusal the
 * procedural profile kernel makes, for the same reason: a clipper fed a
 * non-convex outline reports areas the surface does not have.
 */
const convexPolygon = (
  polygon: readonly IAutoMoviePatternPoint[],
  label: string,
): IAutoMoviePatternPoint[] => {
  polygon.forEach((point, index) => finitePoint(point, `${label}[${index}]`));
  const hull = convexHull2D(
    polygon.map((point) => ({ x: point.u, y: 0, z: point.v })),
  ).map((point) => ({ u: point.x, v: point.z }));
  if (hull.length < 3)
    throw new Error(`${label} needs at least three non-collinear points`);
  if (hull.length !== polygon.length)
    throw new Error(`${label} must be convex and contain no interior points`);
  return hull;
};

/**
 * Clip one convex polygon by another with the Sutherland–Hodgman half-planes.
 *
 * A crossing is only cut where the corner it crosses to actually leaves the
 * line. A corner sitting exactly on a clip edge already _is_ the intersection,
 * so emitting one for it would put the same point in the outline twice, and a
 * repeated point makes a zero-length edge whose normal is undefined. That
 * outline still measures the right area, which is what makes the fault quiet:
 * the joint measurement between two pieces would divide by that zero, and every
 * comparison against the resulting `NaN` reads false, so the pair passes the
 * joint and overlap tests by never being judged at all.
 */
const clipConvex = (
  subject: readonly IAutoMoviePatternPoint[],
  clipper: readonly IAutoMoviePatternPoint[],
): IAutoMoviePatternPoint[] => {
  let output: IAutoMoviePatternPoint[] = [...subject];
  for (let index = 0; index < clipper.length && output.length > 0; ++index) {
    const from = clipper[index]!;
    const to = clipper[(index + 1) % clipper.length]!;
    const input = output;
    output = [];
    for (let corner = 0; corner < input.length; ++corner) {
      const current = input[corner]!;
      const previous = input[(corner + input.length - 1) % input.length]!;
      const currentSide = side(from, to, current);
      const previousSide = side(from, to, previous);
      if (currentSide >= 0) {
        if (previousSide < 0 && currentSide > 0)
          output.push(intersect(previous, current, from, to));
        output.push(current);
      } else if (previousSide > 0)
        output.push(intersect(previous, current, from, to));
    }
  }
  return output;
};

const side = (
  from: IAutoMoviePatternPoint,
  to: IAutoMoviePatternPoint,
  point: IAutoMoviePatternPoint,
): number =>
  (to.u - from.u) * (point.v - from.v) - (to.v - from.v) * (point.u - from.u);

const intersect = (
  from: IAutoMoviePatternPoint,
  to: IAutoMoviePatternPoint,
  edgeFrom: IAutoMoviePatternPoint,
  edgeTo: IAutoMoviePatternPoint,
): IAutoMoviePatternPoint => {
  const a = side(edgeFrom, edgeTo, from);
  const b = side(edgeFrom, edgeTo, to);
  const ratio = a / (a - b);
  return {
    u: from.u + (to.u - from.u) * ratio,
    v: from.v + (to.v - from.v) * ratio,
  };
};

const polygonArea = (polygon: readonly IAutoMoviePatternPoint[]): number => {
  let twice = 0;
  for (let index = 0; index < polygon.length; ++index) {
    const from = polygon[index]!;
    const to = polygon[(index + 1) % polygon.length]!;
    twice += from.u * to.v - to.u * from.v;
  }
  return Math.abs(twice) / 2;
};

const boundsOf = (
  polygon: readonly IAutoMoviePatternPoint[],
): { minU: number; maxU: number; minV: number; maxV: number } => ({
  minU: Math.min(...polygon.map((point) => point.u)),
  maxU: Math.max(...polygon.map((point) => point.u)),
  minV: Math.min(...polygon.map((point) => point.v)),
  maxV: Math.max(...polygon.map((point) => point.v)),
});

const finitePoint = (point: IAutoMoviePatternPoint, label: string): void => {
  if (!Number.isFinite(point.u) || !Number.isFinite(point.v))
    throw new Error(`${label} must be finite`);
};

const nonBlank = (value: string, label: string): void => {
  if (value.trim().length === 0) throw new Error(`${label} must be non-empty`);
};

const positive = (value: number, label: string): void => {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${label} must be a finite number > 0`);
};

const atLeast = (value: number, limit: number, label: string): void => {
  if (!Number.isFinite(value) || value < limit)
    throw new Error(`${label} must be a finite number >= ${limit}`);
};

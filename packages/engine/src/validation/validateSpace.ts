import {
  IAutoMovieSpace,
  IAutoMovieSurface,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { polygonInside } from "../architecture/polygonInside";
import { polygonIsSimple } from "../architecture/polygonIsSimple";
import { polygonsOverlap } from "../architecture/polygonsOverlap";
import { IAutoMovieFootprintRing } from "../space/IAutoMovieFootprintRing";
import { footprintRing } from "../space/footprintRing";
import { footprintRingPlacement } from "../space/footprintRingPlacement";
import { ViolationCollector } from "./ViolationCollector";
import { validateSurfaceHeightRule } from "./validateSurfaceHeightRule";

const SURFACE_KINDS: readonly ["floor", "platform", "ramp"] = [
  "floor",
  "platform",
  "ramp",
] as const;
const MIN_RAMP_AXIS: number = 1e-9;

/** Absolute double-plan-area admission threshold of 1e-9 square metres; very small nonzero rings are deliberately refused. */
const MIN_RING_DOUBLE_AREA: number = 1e-9;

/**
 * Admit ids/kinds, simple finite XZ footprint rings, strictly interior disjoint holes and exactly one supported ground statement.
 *
 * @evidence contracts/common.md#principled-implementation Admit ids/kinds, simple finite XZ footprint rings, strictly interior disjoint holes and exactly one supported ground statement.
 * @evidence contracts/common.md#clear-and-simple-design Polygon and footprint owners handle geometric predicates; surface/height variants own their scalar rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Plan Y is ignored, area/ramp thresholds are absolute policies, and finite admission alone does not guarantee overflow-free extreme arithmetic.
 * @evidence contracts/common.md#meaningful-documentation Constant/plane/heightfield shapes, lattice cardinality, walkable references and hole contact policy are stated.
 * @evidence contracts/performance.md#efficient-algorithms Ring simplicity/containment/hole-pair predicates can be quadratic; heightfield samples and surface ids require linear scans.
 * @evidence contracts/performance.md#reuse-equivalent-work Each admitted ring is built once for its comparisons, sharing canonical polygon/height meanings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Ring/ids/hole arrays release after the call; the report owns diagnostics and no terrain mesh or GPU state is created.
 */
export const validateSpace: (props: {
  space: IAutoMovieSpace;
}) => IAutoMovieValidation = (props: {
  /** Borrowed surface and walkable metadata; XZ footprint coordinates are checked while polygon Y is ignored. */
  space: IAutoMovieSpace;
}): IAutoMovieValidation => {
  const path: string = "$input";
  const collector: ViolationCollector = new ViolationCollector();
  const { space }: { space: IAutoMovieSpace } = props;

  if (space.id.trim().length === 0)
    collector.push(
      "type",
      `${path}.id`,
      "space id must be non-empty",
      space.id,
    );

  const ids: Set<string> = new Set<string>();
  space.surfaces.forEach((surface: IAutoMovieSurface, i: number): void => {
    const sp: string = `${path}.surfaces[${i}]`;
    if (surface.id.trim().length === 0)
      collector.push(
        "type",
        `${sp}.id`,
        "surface id must be non-empty",
        surface.id,
      );
    if (ids.has(surface.id))
      collector.push(
        "type",
        `${sp}.id`,
        `surface id "${surface.id}" must be unique within the space`,
        surface.id,
      );
    ids.add(surface.id);
    validateSurface(surface, sp, collector);
  });

  const walked: Set<string> = new Set<string>();
  space.walkable.forEach((id: string, i: number): void => {
    const wp: string = `${path}.walkable[${i}]`;
    if (!ids.has(id))
      collector.push(
        "type",
        wp,
        `walkable id "${id}" does not resolve to any surface of this space`,
        id,
      );
    if (walked.has(id))
      collector.push("type", wp, `walkable id "${id}" is duplicated`, id);
    walked.add(id);
  });

  return collector.toValidation();
};

/**
 * Check the closed surface kind then delegate footprint and ground admission.
 *
 * Kind, footprint and height responsibilities are separated by the existing surface schema.
 *
 * Unknown kinds append an error without repairing the surface.
 *
 * Caller-relative kind/footprint/ground paths remain stable.
 *
 * Polygon/lattice sizes drive delegated costs; kind lookup is fixed-size.
 *
 * Surface helpers share the same collector and canonical polygon/height owners.
 *
 * Only caller-owned diagnostics remain; no terrain mesh is retained.
 */
const validateSurface: (
  surface: IAutoMovieSurface,
  path: string,
  collector: ViolationCollector,
) => void = (
  surface: IAutoMovieSurface,
  path: string,
  collector: ViolationCollector,
): void => {
  if (!SURFACE_KINDS.includes(surface.kind))
    collector.push(
      "type",
      `${path}.kind`,
      `unknown surface kind "${String(surface.kind)}"`,
      surface.kind,
    );

  validateSurfaceFootprint(surface, path, collector);
  validateSurfaceGround(surface, path, collector);
};

/**
 * Build an admitted outer ring and each hole, then require strict nesting and pairwise nonoverlap.
 *
 * Each ring is built once and reused for containment/contact comparisons.
 *
 * A touching hole is refused; concave outer footprints remain supported rather than convexified.
 *
 * Hole paths identify outside/touching/overlapping authored rings.
 *
 * Ring admission and every hole pair can be quadratic in ring/hole population.
 *
 * Admitted ring objects share geometric facts across all comparisons.
 *
 * Temporary ring/hole arrays release; the collector retains faults and borrowed authored rings.
 */
const validateSurfaceFootprint: (
  surface: IAutoMovieSurface,
  path: string,
  collector: ViolationCollector,
) => void = (
  surface: IAutoMovieSurface,
  path: string,
  collector: ViolationCollector,
): void => {
  const outer: IAutoMovieFootprintRing | null = validateRing(
    surface.polygon,
    `${path}.polygon`,
    "surface footprint",
    collector,
  );
  const holes: (IAutoMovieFootprintRing | null)[] = (surface.holes ?? []).map(
    (hole: IAutoMovieVector3[], i: number): IAutoMovieFootprintRing | null =>
      validateRing(hole, `${path}.holes[${i}]`, "footprint hole", collector),
  );
  if (outer === null) return;
  holes.forEach((hole: IAutoMovieFootprintRing | null, i: number): void => {
    if (hole === null) return;
    const hp: string = `${path}.holes[${i}]`;
    if (!polygonInside(hole.plan, outer.plan))
      collector.push(
        "type",
        hp,
        "footprint hole must lie inside the surface footprint, but it reaches outside it",
        surface.holes![i],
      );
    else if (ringsTouch(hole, outer))
      collector.push(
        "type",
        hp,
        "footprint hole must lie strictly inside the surface footprint, but it touches the outer ring; author the notch in the outer ring instead",
        surface.holes![i],
      );
    for (let other: number = 0; other < i; ++other) {
      const before: IAutoMovieFootprintRing = holes[other]!;
      if (before !== null && polygonsOverlap(hole.plan, before.plan))
        collector.push(
          "type",
          hp,
          `footprint hole must stay clear of hole [${other}], but the two share plan area`,
          surface.holes![i],
        );
    }
  });
};

/**
 * Ask hole vertices against the outer ring and outer vertices against the hole for boundary classification.
 *
 * Both directions catch flush hole edges and reflex outer vertices touching hole edges.
 *
 * Containment is a caller premise; this vertex-boundary test is not a generic segment intersection solver.
 *
 * The boolean answers contact between already nested admitted rings.
 *
 * H/O vertices each perform the other ring's classification, O(HO) worst-case.
 *
 * footprintRingPlacement shares the canonical boundary policy with space queries.
 *
 * Rings are borrowed and only a boolean escapes.
 */
const ringsTouch: (
  hole: IAutoMovieFootprintRing,
  outer: IAutoMovieFootprintRing,
) => boolean = (
  hole: IAutoMovieFootprintRing,
  outer: IAutoMovieFootprintRing,
): boolean =>
  hole.points.some(
    (point: IAutoMovieVector3): boolean =>
      footprintRingPlacement(outer, point.x, point.z) === "boundary",
  ) ||
  outer.points.some(
    (point: IAutoMovieVector3): boolean =>
      footprintRingPlacement(hole, point.x, point.z) === "boundary",
  );

/**
 * Check finite XZ coordinates, at least three points, absolute double area above1e-9 and polygon simplicity.
 *
 * footprintRing produces plan/area once and polygonIsSimple owns crossing admission.
 *
 * Y is ignored and the fixed area threshold is an absolute square-metre policy, not exact zero classification.
 *
 * Null prevents invalid rings from entering later containment comparisons.
 *
 * P points require linear finite/area work and quadratic simplicity checks.
 *
 * The admitted ring is reused by containment/contact owners.
 *
 * Only a ring descriptor returns; points are borrowed and the collector owns faults.
 */
const validateRing: (
  points: readonly IAutoMovieVector3[],
  path: string,
  label: string,
  collector: ViolationCollector,
) => IAutoMovieFootprintRing | null = (
  points: readonly IAutoMovieVector3[],
  path: string,
  label: string,
  collector: ViolationCollector,
): IAutoMovieFootprintRing | null => {
  let planFinite: boolean = true;
  points.forEach((point: IAutoMovieVector3, i: number): void => {
    for (const axis of ["x", "z"] as const)
      if (!Number.isFinite(point[axis])) {
        planFinite = false;
        collector.push(
          "range",
          `${path}[${i}].${axis}`,
          `${label} ${axis} must be finite, but was ${point[axis]}`,
          point[axis],
        );
      }
  });
  if (points.length < 3) {
    collector.push(
      "type",
      path,
      `a ${label} needs at least 3 points, but had ${points.length}`,
      points.length,
    );
    return null;
  }
  if (!planFinite) return null;
  const ring: IAutoMovieFootprintRing = footprintRing(points);
  if (Math.abs(ring.doubleArea) <= MIN_RING_DOUBLE_AREA) {
    collector.push(
      "type",
      path,
      `${label} points enclose no area: they are collinear or double back over one another`,
      points,
    );
    return null;
  }
  if (!polygonIsSimple(ring.plan)) {
    collector.push(
      "type",
      path,
      `${label} crosses itself, so it has no inside for the ground query to answer with`,
      points,
    );
    return null;
  }
  return ring;
};

/**
 * Require exactly one height rule or anchor/rampTo statement and check finite anchors/nondegenerate ramp axis.
 *
 * Height-rule and anchor owners retain their own scalar requirements.
 *
 * Squared XZ ramp distance below1e-9 is a fixed degeneracy policy, not a1nm linear threshold.
 *
 * Missing/conflicting ground and exact field paths are documented.
 *
 * Rule lattice size drives delegated scans; anchor/ramp arithmetic is fixed-size.
 *
 * Height and finite-anchor helpers are reused rather than another ground evaluator.
 *
 * Only collector faults remain; no height sampler/cache or mesh is retained.
 */
const validateSurfaceGround: (
  surface: IAutoMovieSurface,
  path: string,
  collector: ViolationCollector,
) => void = (
  surface: IAutoMovieSurface,
  path: string,
  collector: ViolationCollector,
): void => {
  const rampTo: IAutoMovieVector3 | null = surface.rampTo ?? null;
  const anchored: boolean = surface.anchor !== undefined || rampTo !== null;
  if (surface.height !== undefined) {
    if (anchored)
      collector.push(
        "type",
        `${path}.height`,
        "a surface states its ground once: carry either a height rule or the anchor/rampTo pair, not both",
        surface.height,
      );
    validateSurfaceHeightRule(surface.height, `${path}.height`, collector);
    return;
  }
  if (surface.anchor === undefined) {
    collector.push(
      "type",
      `${path}.height`,
      "a surface must state its ground: give it a height rule or an anchor",
      surface.height,
    );
    return;
  }
  validateAnchor(surface.anchor, `${path}.anchor`, collector);
  if (rampTo !== null) {
    validateAnchor(rampTo, `${path}.rampTo`, collector);
    const ax: number = rampTo.x - surface.anchor.x;
    const az: number = rampTo.z - surface.anchor.z;
    if (
      Number.isFinite(ax) &&
      Number.isFinite(az) &&
      ax * ax + az * az < MIN_RAMP_AXIS
    )
      collector.push(
        "range",
        `${path}.rampTo`,
        "ramp axis is degenerate: rampTo must sit at a different (x, z) than anchor",
        rampTo,
      );
  }
};

/**
 * Require finite X/Y/Z in a surface height anchor.
 *
 * The ground statement owner supplies which anchor path is being checked.
 *
 * The vector is not normalized or replaced by the origin.
 *
 * Axis-qualified faults retain each authored scalar.
 *
 * Three finite tests cost constant work.
 *
 * Anchor and ramp endpoint share this admission rather than divergent vector checks.
 *
 * Only caller-owned diagnostics remain; no anchor record is retained internally.
 */
const validateAnchor: (
  anchor: IAutoMovieVector3,
  path: string,
  collector: ViolationCollector,
) => void = (
  anchor: IAutoMovieVector3,
  path: string,
  collector: ViolationCollector,
): void => {
  for (const axis of ["x", "y", "z"] as const)
    if (!Number.isFinite(anchor[axis]))
      collector.push(
        "range",
        `${path}.${axis}`,
        `anchor ${axis} must be finite, but was ${anchor[axis]}`,
        anchor[axis],
      );
};

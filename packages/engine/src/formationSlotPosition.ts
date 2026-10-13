import {
  IAutoMovieFormationLayout,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieFormationPlacement } from "./IAutoMovieFormationPlacement";
import { IAutoMovieFormationReform } from "./IAutoMovieFormationReform";
import { formationGroundRelief } from "./formationGroundRelief";
import { lerp } from "./lerp";
import { seededValue } from "./math/seededValue";

/**
 * Where one slot of a formation stands at rest, in world space.
 *
 * The position half of `formationSlot`, taken on its own because a consumer
 * that only asks where a member is should not have to hold the hero overrides
 * and model recipe that name it. The compiled formation carries exactly this
 * much, so the builder, the overlap and ground gates, the geometry measurement
 * and the viewer all place a member through this one function, and a gate and
 * a renderer cannot disagree about where a unit is standing.
 *
 * The slot is laid out in the unit's own frame by its layout and dressing,
 * rotated by `facingDeg` about the anchor, and raised by
 * {@link formationGroundRelief}: the ground under the member, not the ground
 * under the group. With a `reform`, the designed and target local points are
 * blended by its progress before heading and terrain apply, and the target
 * point takes the target layout's own dressing, so a finished re-form stands
 * exactly where a unit designed in the target layout would.
 *
 * Throws a `RangeError` for a slot that is not a safe integer in
 * `[0, count)`.
 *
 * @evidence contracts/common.md#principled-implementation Closed-form per-slot layout arithmetic (row and file from integer division, wedge rows from the integer square root, arc angle from the slot ratio, scatter from a square-root radius for uniform area density) plus a seeded dressing offset, then a yaw rotation about the anchor; blending happens in the local frame because a world-space blend of a turning unit would sweep members along arcs no layout describes.
 * @evidence contracts/common.md#clear-and-simple-design One public entry with private helpers for the local layout point and its dressing; the dressing now reads the layout being placed, so the reform target needs no second dressing rule and the design and target share one path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No layout or consumer is special-cased; scatter has no dressing because its layout declares none, and a missing reform is the designed arrangement rather than a fallback.
 * @evidence contracts/common.md#meaningful-documentation States the frame order, the relief rule, how a reform blends and which dressing the target takes, the consumers that share it, and the range error.
 * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic per slot plus `formationGroundRelief`, which costs one ground lookup over the formation's terrain snapshot for the member and one cached lookup per record for the anchor; a full placement pass is linear in the member count and nothing is materialized per member.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Coordinates no work across requests itself; the anchor ground datum is reused per record inside `formationGroundRelief`, which answers that reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; each call returns a fresh vector the caller owns.
 */
export const formationSlotPosition = (
  formation: IAutoMovieFormationPlacement,
  slot: number,
  reform: IAutoMovieFormationReform | null = null,
): IAutoMovieVector3 => {
  if (
    Number.isSafeInteger(slot) === false ||
    slot < 0 ||
    slot >= formation.count
  )
    throw new RangeError(
      `Formation "${formation.id}" slot ${slot} is outside 0..${formation.count - 1}.`,
    );
  const designed: ILocalPoint = localFormationPoint(
    formation,
    slot,
    formation.layout,
  );
  const point: ILocalPoint =
    reform === null
      ? designed
      : blendLocalPoints(
          designed,
          localFormationPoint(formation, slot, reform.layout),
          reform.progress,
        );
  const radians: number = (formation.facingDeg * Math.PI) / 180;
  const cosine: number = Math.cos(radians);
  const sine: number = Math.sin(radians);
  const x: number = formation.anchor.x + point.x * cosine + point.z * sine;
  const z: number = formation.anchor.z - point.x * sine + point.z * cosine;
  return {
    x,
    y: formation.anchor.y + formationGroundRelief(formation, { x, z }),
    z,
  };
};

/** A slot's point in the unit's own frame: `x` lateral, `z` depth, in metres. */
interface ILocalPoint {
  x: number;
  z: number;
}

const blendLocalPoints = (
  from: ILocalPoint,
  to: ILocalPoint,
  progress: number,
): ILocalPoint => ({
  x: lerp(from.x, to.x, progress),
  z: lerp(from.z, to.z, progress),
});

/**
 * Offset one slot by its layout's dressing tolerance, deterministically.
 *
 * Formed layouts place members on exact geometry, which reads as one figure
 * repeated on a grid rather than as troops holding a line. `dressing` states
 * how far a member may stand off its slot, and the deviation is drawn from the
 * formation seed and the slot index, the same machinery `scatter` placement and
 * `motionPhase` already use. Nothing is stored per member: the same design
 * regenerates the same crowd on every machine and every run. A layout without
 * `dressing`, or with both tolerances at zero, returns the exact point.
 */
const dressedFormationPoint = (
  formation: IAutoMovieFormationPlacement,
  slot: number,
  layout: Exclude<IAutoMovieFormationLayout, { kind: "scatter" }>,
  point: ILocalPoint,
): ILocalPoint => {
  const dressing: { lateral: number; depth: number } | undefined =
    layout.dressing;
  if (dressing === undefined) return point;
  const deviation = (salt: number, bound: number): number =>
    bound === 0 ? 0 : (seededValue(formation.seed, slot, salt) * 2 - 1) * bound;
  return {
    x: point.x + deviation(0x64726573, dressing.lateral),
    z: point.z + deviation(0x73646570, dressing.depth),
  };
};

/** One slot's point in the unit's own frame under the given layout. */
const localFormationPoint = (
  formation: IAutoMovieFormationPlacement,
  slot: number,
  layout: IAutoMovieFormationLayout,
): ILocalPoint => {
  if (layout.kind === "line" || layout.kind === "column") {
    const rank: number =
      layout.kind === "line"
        ? Math.floor(slot / layout.files)
        : slot % layout.ranks;
    const file: number =
      layout.kind === "line"
        ? slot % layout.files
        : Math.floor(slot / layout.ranks);
    return dressedFormationPoint(formation, slot, layout, {
      x: (file - (layout.files - 1) / 2) * layout.spacing.lateral,
      z: rank * layout.spacing.depth,
    });
  }
  if (layout.kind === "wedge") {
    const row: number = Math.floor(Math.sqrt(slot));
    const column: number = slot - row * row - row;
    return dressedFormationPoint(formation, slot, layout, {
      x: column * layout.spacing.lateral,
      z: row * layout.spacing.depth,
    });
  }
  if (layout.kind === "arc") {
    const ratio: number =
      formation.count === 1 ? 0.5 : slot / (formation.count - 1);
    const radians: number = ((ratio - 0.5) * layout.arcDegrees * Math.PI) / 180;
    return dressedFormationPoint(formation, slot, layout, {
      x: Math.sin(radians) * layout.radius,
      z: Math.cos(radians) * layout.radius,
    });
  }
  const radius: number =
    Math.sqrt(seededValue(formation.seed, layout.seed, slot, 0)) *
    layout.radius;
  const angle: number =
    seededValue(formation.seed, layout.seed, slot, 1) * Math.PI * 2;
  return {
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius,
  };
};

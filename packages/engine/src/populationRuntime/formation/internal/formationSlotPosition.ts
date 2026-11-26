import {
  IAutoMovieFormationLayout,
  type IAutoMovieFormationPlacement,
  type IAutoMovieFormationReform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { lerp } from "../../../math/internal/lerp";
import { seededValue } from "../../../math/internal/seededValue";
import { formationGroundRelief } from "./formationGroundRelief";

/**
 * Where one slot of a formation stands at rest, in world space.
 *
 * The position half of `formationSlot`, taken on its own because a consumer
 * that only asks where a member is should not have to hold the hero overrides
 * and model group that name it. The compiled formation carries exactly this
 * much, so the builder, the overlap and ground gates, the geometry measurement
 * and the viewer all place a member through this one function, and a gate and a
 * renderer cannot disagree about where a unit is standing.
 *
 * The slot is laid out in the unit's own frame by its layout and dressing,
 * rotated by `facingDeg` about the anchor, and raised by
 * {@link formationGroundRelief}: the ground under the member, not the ground
 * under the group. With a `reform`, the previous completed layout's point (or
 * the designed point when fromLayout is absent) and target local point are
 * blended by its progress before heading and terrain apply, and the target
 * point takes the target layout's own dressing, so a finished re-form stands
 * exactly where a unit designed in the target layout would.
 *
 * A design laid in blocks (`blocks`) places a slot by its block's layout,
 * turned by the block's facing and moved by its offset in the unit's frame,
 * before the same heading and relief; a re-form reads the one layout and is not
 * applied to blocks.
 *
 * Throws a `RangeError` for a slot that is not a safe integer in `[0, count)`.
 */
export function formationSlotPosition(
  formation: IAutoMovieFormationPlacement,
  slot: number,
  reform: IAutoMovieFormationReform | null = null,
): IAutoMovieVector3 {
  if (slot < 0 || slot >= formation.count)
    throw new RangeError(
      `Formation "${formation.id}" slot ${slot} is outside 0..${formation.count - 1}.`,
    );
  // A design laid in blocks places the slot by its block's layout, then the block's facing and offset in the design's frame.
  const blocked: ILocalPoint | null =
    formation.blocks === undefined || formation.blocks.length === 0
      ? null
      : blockPoint(formation, slot);
  const origin: ILocalPoint =
    blocked ??
    localFormationPoint(
      formation,
      slot,
      reform?.fromLayout ?? formation.layout,
    );
  const point: ILocalPoint =
    reform === null || blocked !== null
      ? origin
      : blendLocalPoints(
          origin,
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
}

/**
 * A slot's point in a design laid in blocks: its block's own point by the
 * block's layout (and the block's seed, the design's when absent), turned by
 * the block's facing as the design's facing turns a point, and moved by its
 * offset. A slot beyond the blocks' counts takes the last block's place in
 * order, which the slot range check above already rules out.
 */
function blockPoint(
  formation: IAutoMovieFormationPlacement,
  slot: number,
): ILocalPoint {
  const blocks: NonNullable<IAutoMovieFormationPlacement["blocks"]> =
    formation.blocks!;
  let within: number = slot;
  let b: number = 0;
  while (b + 1 < blocks.length && within >= blocks[b]!.count) {
    within -= blocks[b]!.count;
    ++b;
  }
  const block: NonNullable<IAutoMovieFormationPlacement["blocks"]>[number] =
    blocks[b]!;
  const own: ILocalPoint = localFormationPoint(
    { ...formation, count: block.count, seed: block.seed ?? formation.seed },
    within,
    block.layout,
  );
  const radians: number = ((block.facing ?? 0) * Math.PI) / 180;
  const cosine: number = Math.cos(radians);
  const sine: number = Math.sin(radians);
  return {
    x: (block.offset?.lateral ?? 0) + own.x * cosine + own.z * sine,
    z: (block.offset?.depth ?? 0) - own.x * sine + own.z * cosine,
  };
}

/** A slot's point in the unit's own frame: `x` lateral, `z` depth, in metres. */
interface ILocalPoint {
  x: number;
  z: number;
}

function blendLocalPoints(
  from: ILocalPoint,
  to: ILocalPoint,
  progress: number,
): ILocalPoint {
  return {
    x: lerp(from.x, to.x, progress),
    z: lerp(from.z, to.z, progress),
  };
}

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
function dressedFormationPoint(
  formation: IAutoMovieFormationPlacement,
  slot: number,
  layout: Exclude<IAutoMovieFormationLayout, { kind: "scatter" }>,
  point: ILocalPoint,
): ILocalPoint {
  const dressing: { lateral: number; depth: number } | undefined =
    layout.dressing;
  if (dressing === undefined) return point;
  function deviation(salt: number, bound: number): number {
    return bound === 0
      ? 0
      : (seededValue(formation.seed, slot, salt) * 2 - 1) * bound;
  }
  return {
    x: point.x + deviation(0x64726573, dressing.lateral),
    z: point.z + deviation(0x73646570, dressing.depth),
  };
}

/** One slot's point in the unit's own frame under the given layout. */
function localFormationPoint(
  formation: IAutoMovieFormationPlacement,
  slot: number,
  layout: IAutoMovieFormationLayout,
): ILocalPoint {
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
}

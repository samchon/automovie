import { IAutoMovieFormationDesign, IAutoMovieFormationMotionState, IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "./math/Quaternion";
import { Vector3 } from "./math/Vector3";
import { seededValue } from "./math/seededValue";
import { IAutoMovieFormationPlacement } from "./IAutoMovieFormationPlacement";
import { transformFormationPoint } from "./transformFormationPoint";

/**
 * Compose a promoted hero's source-authored node transform with formation
 * placement and motion.
 *
 * Translation keeps authored node/object-motion displacement relative to the
 * builder-owned hero slot. Rotation applies the current formation facing
 * before the authored rotation relative to that slot, while scale remains
 * source-owned.
 *
 * @evidence requirements/formations/heroes-variation-and-state.md#formation-hero-overrides Preserves a promoted actor's authored translation, rotation, and scale while inheriting formation placement and motion.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-hero-variation-group-state Implements the named-hero exception without returning the actor to the anonymous instance batch.
 */
export const composeFormationHeroTransform = (
  base: IAutoMovieTransform,
  source: IAutoMovieTransform,
  anchor: IAutoMovieVector3,
  motion: IAutoMovieFormationMotionState,
  baseFacingDeg = 0,
): IAutoMovieTransform => ({
  translation: Vector3.add(
    transformFormationPoint(base.translation, anchor, motion, baseFacingDeg),
    Vector3.subtract(source.translation, base.translation),
  ),
  rotation: Quaternion.multiply(
    Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      baseFacingDeg + motion.facingOffsetDeg,
    ),
    Quaternion.multiply(Quaternion.inverse(base.rotation), source.rotation),
  ),
  scale: { ...source.scale },
});

/**
 * Offset one slot by its dressing tolerance, deterministically.
 *
 * Formed layouts place members on exact geometry, which reads as one figure
 * repeated on a grid rather than as troops holding a line. `dressing` states
 * how far a member may stand off its slot, and the deviation is drawn from the
 * formation seed and the slot index, the same machinery `scatter` placement and
 * `motionPhase` already use. Nothing is stored per member: the same design
 * regenerates the same crowd on every machine and every run.
 *
 * A layout without `dressing`, or with both tolerances at zero, returns the
 * exact point, so an existing production compiles unchanged.
 */
const dressedFormationPoint = (
  formation: IAutoMovieFormationPlacement,
  slot: number,
  point: { x: number; z: number },
): { x: number; z: number } => {
  const dressing =
    "dressing" in formation.layout ? formation.layout.dressing : undefined;
  if (dressing === undefined) return point;
  const deviation = (salt: number, bound: number): number =>
    bound === 0 ? 0 : (seededValue(formation.seed, slot, salt) * 2 - 1) * bound;
  return {
    x: point.x + deviation(0x64726573, dressing.lateral),
    z: point.z + deviation(0x73646570, dressing.depth),
  };
};

const localFormationPoint = (
  formation: IAutoMovieFormationPlacement,
  slot: number,
  layout: IAutoMovieFormationDesign["layout"] = formation.layout,
): { x: number; z: number } => {
  if (layout.kind === "line" || layout.kind === "column") {
    const rank =
      layout.kind === "line"
        ? Math.floor(slot / layout.files)
        : slot % layout.ranks;
    const file =
      layout.kind === "line"
        ? slot % layout.files
        : Math.floor(slot / layout.ranks);
    return dressedFormationPoint(formation, slot, {
      x: (file - (layout.files - 1) / 2) * layout.spacing.lateral,
      z: rank * layout.spacing.depth,
    });
  }
  if (layout.kind === "wedge") {
    const row = Math.floor(Math.sqrt(slot));
    const column = slot - row * row - row;
    return dressedFormationPoint(formation, slot, {
      x: column * layout.spacing.lateral,
      z: row * layout.spacing.depth,
    });
  }
  if (layout.kind === "arc") {
    const ratio = formation.count === 1 ? 0.5 : slot / (formation.count - 1);
    const degrees = (ratio - 0.5) * layout.arcDegrees;
    const radians = (degrees * Math.PI) / 180;
    return dressedFormationPoint(formation, slot, {
      x: Math.sin(radians) * layout.radius,
      z: Math.cos(radians) * layout.radius,
    });
  }
  const radius =
    Math.sqrt(seededValue(formation.seed, layout.seed, slot, 0)) *
    layout.radius;
  const angle = seededValue(formation.seed, layout.seed, slot, 1) * Math.PI * 2;
  return {
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius,
  };
};

/**
 * Offset one slot by its dressing tolerance, deterministically.
 *
 * Formed layouts place members on exact geometry, which reads as one figure
 * repeated on a grid rather than as troops holding a line. `dressing` states
 * how far a member may stand off its slot, and the deviation is drawn from the
 * formation seed and the slot index, the same machinery `scatter` placement and
 * `motionPhase` already use. Nothing is stored per member: the same design
 * regenerates the same crowd on every machine and every run.
 *
 * A layout without `dressing`, or with both tolerances at zero, returns the
 * exact point, so an existing production compiles unchanged.
 */
const dressedFormationPoint = (
  formation: IAutoMovieFormationPlacement,
  slot: number,
  point: { x: number; z: number },
): { x: number; z: number } => {
  const dressing =
    "dressing" in formation.layout ? formation.layout.dressing : undefined;
  if (dressing === undefined) return point;
  const deviation = (salt: number, bound: number): number =>
    bound === 0 ? 0 : (seededValue(formation.seed, slot, salt) * 2 - 1) * bound;
  return {
    x: point.x + deviation(0x64726573, dressing.lateral),
    z: point.z + deviation(0x73646570, dressing.depth),
  };
};

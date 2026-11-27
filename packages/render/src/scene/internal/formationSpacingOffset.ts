import { AutoMovieEnginePopulationFormation } from "@automovie/engine";
import type {
  IAutoMovieCompiledFormation,
  IAutoMovieVector3,
} from "@automovie/interface";
import * as THREE from "three";

/*
 * Where one designed point stands inside the group node, once the unit's own
 * heading and the current spacing have opened or closed the arrangement.
 *
 * The arithmetic is the engine's, called rather than copied: this is
 * transformFormationPoint measured about the root's own origin, because
 * the group node above already carries the anchor, the cue's travel and the
 * cue's turn, so the unit state passed here is at rest apart from the spacing.
 *
 * Degree conversion by multiply-then-divide can round differently from a
 * pre-rounded PI/180 multiplier. The engine owns that order. Instance buffers
 * later narrow to Float32, while chunk-centre culling keeps double values;
 * sharing one placement law avoids independently rounded coordinates.
 */
export const formationSpacingOffset: (
  point: { x: number; y: number; z: number },
  anchor: IAutoMovieCompiledFormation["anchor"],
  spacing: { lateral: number; depth: number },
  baseFacingDeg: number,
) => THREE.Vector3 = (
  point: { x: number; y: number; z: number },
  anchor: IAutoMovieCompiledFormation["anchor"],
  spacing: { lateral: number; depth: number },
  baseFacingDeg: number,
): THREE.Vector3 => {
  const placed: IAutoMovieVector3 = AutoMovieEnginePopulationFormation.transformFormationPoint(
    {
      x: point.x - anchor.x,
      y: point.y - anchor.y,
      z: point.z - anchor.z,
    },
    ROOT_ORIGIN,
    {
      translation: ROOT_ORIGIN,
      facingOffsetDeg: 0,
      spacingScale: spacing,
    },
    baseFacingDeg,
  );
  return new THREE.Vector3(placed.x, placed.y, placed.z);
};

/*
 * The group node's own origin, which every local offset is measured about.
 *
 * Frozen because one object stands in two of the engine's parameter slots at
 * once, and every unit in the scene shares it: a caller that ever wrote through
 * either slot would move the origin of every crowd at the same time.
 */
const ROOT_ORIGIN: IAutoMovieVector3 = Object.freeze({ x: 0, y: 0, z: 0 });

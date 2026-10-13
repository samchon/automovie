import { transformFormationPoint } from "@automovie/engine";
import type { IAutoMovieCompiledFormation, IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

/**
 * The group node's own origin, which every local offset is measured about.
 *
 * Frozen because one object stands in two of the engine's parameter slots at
 * once, and every unit in the scene shares it: a caller that ever wrote through
 * either slot would move the origin of every crowd at the same time.
 */
const ROOT_ORIGIN: IAutoMovieVector3 = Object.freeze({ x: 0, y: 0, z: 0 });

/**
 * Where one designed point stands inside the group node, once the unit's own
 * heading and the current spacing have opened or closed the arrangement.
 *
 * The arithmetic is the engine's, called rather than copied: this is
 * {@link transformFormationPoint} measured about the root's own origin, because
 * the group node above already carries the anchor, the cue's travel and the
 * cue's turn, so the unit state passed here is at rest apart from the spacing.
 *
 * A private copy is how a gate and a renderer come to disagree about where a
 * unit is standing, and the copy that stood here did disagree. It converted the
 * heading with `THREE.MathUtils.degToRad`, which rounds `PI / 180` before
 * multiplying, while the engine multiplies by `Math.PI` and then divides by
 * 180. Those are different doubles for 93 of the 361 whole-degree headings, and
 * at a plain three degrees, once a cue rewrote their places, 886 of a
 * 2,049-strong line's members landed on positions the engine's own placement
 * law does not name. One unit in the last place is not a pixel, and an instance
 * matrix rounds it away on the way to float32; what it does reach is the
 * accounting kept in doubles beside it, where a chunk's world centre decides an
 * LOD tier and a frustum test on every frame — cue or no cue — and a chunk far
 * from its anchor turns that ulp into several ulps of camera distance.
 *
 * Only the point transform was ever affected. A heading turned into a
 * quaternion still goes through `setFromAxisAngle`, which performs the same
 * rounded multiply the engine's own `Quaternion.fromAxisAngle` performs, so
 * those conversions already agree and converting them "the builder's way" is
 * what would break them.
 */
export const formationSpacingOffset = (
  point: { x: number; y: number; z: number },
  anchor: IAutoMovieCompiledFormation["anchor"],
  spacing: { lateral: number; depth: number },
  baseFacingDeg: number,
): THREE.Vector3 => {
  const placed = transformFormationPoint(
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

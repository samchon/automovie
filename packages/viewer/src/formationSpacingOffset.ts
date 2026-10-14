import { transformFormationPoint } from "@automovie/engine";
import type {
  IAutoMovieCompiledFormation,
  IAutoMovieVector3,
} from "@automovie/interface";
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
 * Degree conversion by multiply-then-divide can round differently from a
 * pre-rounded PI/180 multiplier. The engine owns that order. Instance buffers
 * later narrow to Float32, while chunk-centre culling keeps double values;
 * sharing one placement law avoids independently rounded coordinates.
 *
 * @evidence contracts/common.md#principled-implementation Subtracts the compiled anchor and delegates spacing/heading to engine transformFormationPoint with frozen zero root travel/turn, preserving engine double arithmetic order; finite admitted metre points/spacing/degrees and a group carrying the real anchor/motion are premises, with final instance-buffer Float32 narrowing owned later.
 * @evidence contracts/common.md#clear-and-simple-design One native Vector3 adapter shares canonical engine placement rather than maintaining a second degree conversion/point-transform law; root motion remains in the parent group.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Frozen zero origin is the explicit group-local coordinate convention, not a fixture offset; no angle-specific rounding branch, replaced engine math or sampled correction changes the placement.
 * @evidence contracts/common.md#meaningful-documentation Gives group-local/anchor/heading/spacing interpretation and why engine arithmetic order matters; double-versus-Float32 responsibilities remain explicit without claiming a measured rendering improvement.
 * @evidence contracts/performance.md#efficient-algorithms Performs one fixed-size point transform and constructs one Vector3, constant work/storage per point; the population update owner decides when changed spacing/reform requires the full member rewrite.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the frozen module origin and engine transform implementation across points; each returned mutable vector is independent, while arrangement-equivalence reuse belongs to the parent formation update.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains one fixed frozen origin value for module lifetime, borrows arguments only during the call and transfers one small vector; owns no geometry, texture or task.
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
  const placed: IAutoMovieVector3 = transformFormationPoint(
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

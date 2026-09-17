/**
 * Engine-to-viewer placement adapters used by formation construction and update.
 * Regeneration and spacing delegate to the engine's exact arithmetic; this
 * module owns only group-local conversion and newly allocated Three values.
 * Positions and offsets are metres, headings are degrees, rotations are stored
 * as XYZW quaternions. The immutable origin is shared across engine arguments.
 * Do not replace the engine's angle arithmetic with a different rounding order:
 * double-precision chunk centres affect tier/culling decisions before matrices
 * reach Float32. Source object transforms are copied, never retained by alias.
 */
import {
  compiledFormationSlot,
  transformFormationPoint,
} from "@automovie/engine";
import type {
  IAutoMovieCompiledFormation,
  IAutoMovieFormationSlot,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import * as THREE from "three";

/**
 * Regenerate one exact slot from compact runtime parameters.
 *
 * The placement itself is the engine's. A viewer that re-derived the layout
 * arithmetic would be a second answer to the question the builder already
 * answered, and the pixels would be the second one: that is how a dressed unit
 * came to be drawn on the exact lattice its builder had deliberately broken,
 * and it is how a crowd on a rise would come to be drawn flat. What stays here
 * is only what a compiled record spells differently from a design: heroes are
 * promoted slots rather than overrides.
 *
 * @evidence requirements/formations/layouts-and-slots.md#formation-layout-selection-parameters Regenerates the compiled layout's exact slot placement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Implements deterministic slot generation and assignment for that layout.
 */
export const regenerateFormationSlot = (
  formation: IAutoMovieCompiledFormation,
  slot: number,
): IAutoMovieFormationSlot => compiledFormationSlot(formation, slot);

/**
 * Projects one compiled slot into its group-local instance matrix using the shared engine placement law.
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Projects one compiled slot into its group-local instance matrix using the shared engine placement law.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Projects one compiled slot into its group-local instance matrix using the shared engine placement law.
 */
export const slotMatrix = (
  slot: IAutoMovieFormationSlot,
  anchor: IAutoMovieCompiledFormation["anchor"],
  spacing: { lateral: number; depth: number } = { lateral: 1, depth: 1 },
  baseFacingDeg = 0,
): THREE.Matrix4 =>
  new THREE.Matrix4().compose(
    formationSpacingOffset(slot.position, anchor, spacing, baseFacingDeg),
    new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      THREE.MathUtils.degToRad(slot.facingDeg),
    ),
    new THREE.Vector3(1, 1, 1),
  );

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
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Converts engine-owned metre placement into the local offset consumed by chunk matrices and culling.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Converts engine-owned metre placement into the local offset consumed by chunk matrices and culling.
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

/**
 * Copies a resolved metre-space vector into a newly owned Three vector without changing its components.
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Copies a resolved metre-space vector into a newly owned Three vector without changing its components.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Copies a resolved metre-space vector into a newly owned Three vector without changing its components.
 */
export const vector = (value: {
  x: number;
  y: number;
  z: number;
}): THREE.Vector3 => new THREE.Vector3(value.x, value.y, value.z);

const point = (value: { x: number; y: number; z: number }) => ({
  x: value.x,
  y: value.y,
  z: value.z,
});

const quaternion = (value: { x: number; y: number; z: number; w: number }) => ({
  x: value.x,
  y: value.y,
  z: value.z,
  w: value.w,
});

/**
 * Snapshots source object translation, quaternion and scale before formation updates overwrite scene wrappers.
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Snapshots source object translation, quaternion and scale before formation updates overwrite scene wrappers.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Snapshots source object translation, quaternion and scale before formation updates overwrite scene wrappers.
 */
export const objectTransform = (
  object: THREE.Object3D,
): IAutoMovieTransform => ({
  translation: point(object.position),
  rotation: quaternion(object.quaternion),
  scale: point(object.scale),
});

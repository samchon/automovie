import type { IAutoMovieCompiledFormation, IAutoMovieFormationSlot } from "@automovie/interface";
import * as THREE from "three";
import { formationSpacingOffset } from "./formationSpacingOffset.js";

/**
 * Project a compiled world-space slot into an owned group-local matrix. Positions and the anchor are metres; authored headings are degrees. The engine owns spacing arithmetic, while Three projects the resulting local position and slot heading into an instance buffer without moving the root.
 *
 * @evidence contracts/common.md#principled-implementation Delegates world-to-anchor/spacing offset to the existing owner, converts the slot degree heading around Y and composes unchanged unit scale into one group-local matrix.
 * @evidence contracts/common.md#clear-and-simple-design Engine placement/spacing and Three matrix projection remain separate, preserving root position rather than moving it to compensate for layout.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No viewer layout copy or yaw fallback replaces canonical slot values; admitted finite metre/degree inputs and spacing semantics remain producer premises.
 * @evidence contracts/common.md#meaningful-documentation Documents world versus group-local coordinates, metres, authored degrees and base-facing spacing frame.
 * @evidence contracts/performance.md#efficient-algorithms Offset projection plus fixed vector/quaternion/matrix composition is constant work per slot without traversing the formation population.
 * @evidence contracts/performance.md#reuse-equivalent-work The current slot/anchor/spacing/baseFacing determine each matrix; the shared offset law avoids a divergent cached viewer derivation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only one returned Matrix4 and fixed scratch vectors/quaternion are owned, with no instance buffer, mesh or native resource acquired.
 */
export const slotMatrix: (slot: IAutoMovieFormationSlot, anchor: IAutoMovieCompiledFormation["anchor"], spacing?: { lateral: number; depth: number }, baseFacingDeg?: number) => THREE.Matrix4 = (
  slot: IAutoMovieFormationSlot,
  anchor: IAutoMovieCompiledFormation["anchor"],
  spacing: { lateral: number; depth: number } = { lateral: 1, depth: 1 },
  baseFacingDeg: number = 0,
): THREE.Matrix4 =>
  new THREE.Matrix4().compose(
    formationSpacingOffset(slot.position, anchor, spacing, baseFacingDeg),
    new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      THREE.MathUtils.degToRad(slot.facingDeg),
    ),
    new THREE.Vector3(1, 1, 1),
  );

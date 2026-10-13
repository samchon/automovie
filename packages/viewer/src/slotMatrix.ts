import type { IAutoMovieCompiledFormation, IAutoMovieFormationSlot } from "@automovie/interface";
import * as THREE from "three";
import { formationSpacingOffset } from "./formationSpacingOffset.js";

/**
 * Project a compiled world-space slot into an owned group-local matrix.
 * Positions and the anchor are metres; authored headings are degrees. The
 * engine owns spacing arithmetic, while Three projects the resulting local
 * position and slot heading into an instance buffer without moving the root.
 *
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

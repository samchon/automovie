import type { IHumanFaceColourMesh } from "./IHumanFaceColourMesh";

/**
 * One resident face part's material lookup and mutable mesh colour payload.
 * The colour-fold owner changes only the colour buffer and corresponding
 * material channels; the source geometry and part identity stay with the caller.
 *
 * @evidence contracts/common.md#principled-implementation Existing material identity joins resident vertex RGB multipliers to the material-channel folding operation, preserving base-colour-times-gain albedo when admissible.
 * @evidence contracts/common.md#clear-and-simple-design Only material lookup and mesh payload enter the colour operation; original part identity/geometry stay with their model owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Resident material and valid colour layout are caller premises; this contract permits channel mutation but supplies no geometry or albedo acceptance itself.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish material identity and caller-owned mutable colour payload from retained source geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no folding; liftHumanFaceColours owns part/channel scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no requests; its consumer groups maxima by resident material.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no handle; owned model/material buffers retain their ordinary caller lifetime.
 *
 * @author Samchon
 */
export interface IHumanFaceColourPart {
  /** Existing material identity used by the part. */
  material: string;

  /** Caller-owned mesh and its colour multiplier buffer. */
  geometry: IHumanFaceColourMesh;
}

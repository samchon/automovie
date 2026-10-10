import type { IHumanFaceColourMesh } from "./IHumanFaceColourMesh";

/**
 * One resident face part's material lookup and mutable mesh colour payload.
 * The colour-fold owner changes only the colour buffer and corresponding
 * material channels; the source geometry and part identity stay with the caller.
 *
 * @author Samchon
 */
export interface IHumanFaceColourPart {
  /** Existing material identity used by the part. */
  material: string;

  /** Caller-owned mesh and its colour multiplier buffer. */
  geometry: IHumanFaceColourMesh;
}

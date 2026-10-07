import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceDynamicCollider } from "../../../basis/IHumanFaceDynamicCollider";
import type { buildHumanFaceOpticalGeometry } from "../buildHumanFaceOpticalGeometry";
import type { IHumanFaceOcularDeviationPair } from "./IHumanFaceOcularDeviationPair";
import type { IHumanFaceOcularSurfacePair } from "./IHumanFaceOcularSurfacePair";

/**
 * One generated eye's shared exterior, displayed surfaces and resident owner.
 * Geometry is read by both contact and the face model; finishes are downstream.
 *
 * @evidence contracts/common.md#principled-implementation Contact and drawing retain the same generated geometry and exact rigid owner.
 * @evidence contracts/common.md#clear-and-simple-design One record joins source identity, collision states and displayed surfaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No separate fitted sphere or collider convention is carried.
 * @evidence contracts/common.md#meaningful-documentation States geometry and finish responsibilities.
 * @evidence contracts/modeling.md#spatial-conventions All meshes are in the source head metre frame.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries authored geometry without measured tissue claims.
 * @evidenceExclude contracts/anatomy.md#permitted-range Dimensions are admitted by the profile owner.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no independent control.
 *
 * @author Samchon
 */
export interface IHumanFaceOpticalAssembly {
  /** Anatomical side, without coordinate-sign inference. */
  side: "left" | "right";

  /** Source surface whose explicit component is replaced. */
  surface: string;

  /** Source native vertices of that replaced component. */
  vertices: ReadonlySet<number>;

  /** Source generation of the geometry registration. */
  generation: string;

  /** Same complete exterior in its two contact states. */
  collider: IHumanFaceDynamicCollider;

  /** Performed displayed meshes with their generated physical sample IDs. */
  geometry: ReturnType<typeof buildHumanFaceOpticalGeometry>;

  /** Exact generated globe centre after the existing source owner's gaze. */
  center: IAutoMovieVector3;

  /** Analytic exterior the collider meshes tessellate, in both states. */
  exterior: IHumanFaceOcularSurfacePair;

  /** Certified facet-to-generating-patch deviation; never a contact tolerance or inscription claim. */
  deviation: IHumanFaceOcularDeviationPair;
}

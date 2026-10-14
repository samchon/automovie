import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceDynamicCollider } from "../../../basis/IHumanFaceDynamicCollider";
import type { buildHumanFaceOpticalGeometry } from "../buildHumanFaceOpticalGeometry";
import type { IHumanFaceOcularDeviationPair } from "./IHumanFaceOcularDeviationPair";
import type { IHumanFaceOcularSurfacePair } from "./IHumanFaceOcularSurfacePair";

/**
 * One generated eye's shared exterior, displayed surfaces and resident owner.
 * Geometry is read by both contact and the face model; finishes are downstream.
 *
 *
 * @evidence contracts/common.md#principled-implementation One source-registered eye keeps generation, replaced native vertices, displayed sheets, both colliders and both analytic/deviation readings together.
 * @evidence contracts/common.md#clear-and-simple-design The assembly producer owns geometry/registration and the finish/contact readers consume those actual shared surfaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Side is explicit rather than inferred from coordinate sign; deviation does not certify clinical anatomy or hull inscription.
 * @evidence contracts/common.md#meaningful-documentation Fields state source identity, state correspondence, actual centre and separate geometric representations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceOpticalAssembly is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceOpticalAssembly declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceOpticalAssembly acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
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

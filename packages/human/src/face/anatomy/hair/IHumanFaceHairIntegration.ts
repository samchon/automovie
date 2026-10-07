import type {
  IAutoMovieMeshQueryBudget,
  createAutoMovieMeshRayCaster,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import type { IAutoMovieHumanFaceHairCurve } from "./IAutoMovieHumanFaceHairCurve";
import type { IAutoMovieHumanFaceHairRootedTransition } from "./IAutoMovieHumanFaceHairRootedTransition";
import type { IHumanFaceHairMetric } from "./IHumanFaceHairMetric";
import type { IHumanFaceHairRootSupport } from "./IHumanFaceHairRootSupport";

/**
 * One root's inputs to `integrateHumanFaceHairCurve`, also read by
 * `createHumanFaceHairCurveStart`.
 *
 * Positions are head-frame metres. `origin` and `reference` are neutral chart
 * positions that select the regional length; `root` and `normal` are the
 * current seated root and its surface normal. The query, ray index and root
 * support are compiled from the same current closed collider. The budget is
 * shared with launch and the later ribbon fit and spent in place.
 *
 * @evidence contracts/common.md#principled-implementation Supplies the regional chart, seated root, one collider's readers and the shared work bound the metric walk needs.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace an anonymous parameter object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no personal curve control, tolerance or iteration limit.
 * @evidence contracts/common.md#meaningful-documentation States each position's frame, the shared collider and the budget sharing.
 * @evidence contracts/modeling.md#spatial-conventions Positions are head-frame metres; the normal is a unit direction.
 * @evidenceExclude contracts/modeling.md#parameter-channels The layer is the existing admitted hairstyle document; no channel is defined.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator emits stations.
 * @evidence contracts/modeling.md#shared-boundaries Query, ray index and root support all read the one host collider.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The regional length owner supplies conventional quantities.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission belongs to assertHumanFaceHair.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived inputs and the admitted layer, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairIntegration {
  /** Admitted hairstyle layer the lock belongs to. */
  layer: IAutoMovieHumanFaceHair.Layer;

  /** Neutral chart origin of the layer's domain. */
  origin: IAutoMovieVector3;

  /** The root's neutral chart position. */
  reference: IAutoMovieVector3;

  /** Current seated root position. */
  root: IAutoMovieVector3;

  /** Unit surface normal at the seated root. */
  normal: IAutoMovieVector3;

  /** The root's sample identity, seeding its length variation and gathering. */
  sequence: number;

  /** Signed closed-collider query of the host skin. */
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;

  /** Ray index over the same current closed collider as query. */
  raycaster: Pick<
    ReturnType<typeof createAutoMovieMeshRayCaster>,
    "nearestHit"
  >;

  /** Original sampler support and triangle proximity on that collider. */
  rootBoundary: IHumanFaceHairRootSupport;

  /** Caller-owned remaining lock iterations, shared by launch and later walking. */
  budget: IAutoMovieMeshQueryBudget;

  /** Derived post-interpolation metric/contact, when different from regional length. */
  metric?: IHumanFaceHairMetric;

  /**
   * Admit a hierarchy remainder once the canonical stem reaches free clearance.
   *
   * @evidence contracts/common.md#principled-implementation Called once with the completed stem; acceptance keeps that stem, rejection continues the same walk.
   * @evidence contracts/common.md#clear-and-simple-design One caller-supplied callback with a single responsibility.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejection never relaunches the lock or shortens it.
   * @evidence contracts/common.md#meaningful-documentation States when it is called and what its result means.
   * @evidence contracts/modeling.md#spatial-conventions Points are current head-frame metres; directions are unit vectors.
   * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator emits stations.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The contact owns the boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical state only.
   * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Derived callback, not a personal control.
   */
  place?: (
    stem: IAutoMovieHumanFaceHairRootedTransition,
  ) => IAutoMovieHumanFaceHairCurve | undefined;

  /** Gather anchor point on the skin, present only for a gathered layer. */
  gatherAnchor?: IAutoMovieVector3;

  /**
   * Gather direction field, present together with `gatherAnchor`.
   *
   * @evidence contracts/common.md#principled-implementation Supplies the gathered layer's unit direction at a point, from the resolved anchor.
   * @evidence contracts/common.md#clear-and-simple-design One caller-supplied callback with a single responsibility.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Present only for a gathered layer; the stage refuses one without its anchor.
   * @evidence contracts/common.md#meaningful-documentation States when it is called and what its result means.
   * @evidence contracts/modeling.md#spatial-conventions Points are current head-frame metres; directions are unit vectors.
   * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The integrator emits stations.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The contact owns the boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical state only.
   * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Derived callback, not a personal control.
   */
  gatherDirection?: (point: IAutoMovieVector3) => IAutoMovieVector3;
}

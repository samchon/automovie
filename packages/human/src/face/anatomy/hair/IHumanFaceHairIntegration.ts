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
   */
  place?: (
    stem: IAutoMovieHumanFaceHairRootedTransition,
  ) => IAutoMovieHumanFaceHairCurve | undefined;

  /** Gather anchor point on the skin, present only for a gathered layer. */
  gatherAnchor?: IAutoMovieVector3;

  /**
   * Gather direction field, present together with `gatherAnchor`.
   */
  gatherDirection?: (point: IAutoMovieVector3) => IAutoMovieVector3;
}

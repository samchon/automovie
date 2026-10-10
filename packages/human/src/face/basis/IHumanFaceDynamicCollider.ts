import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One generated collider's common rest and performed exterior.
 * The contact owner's existing source collider retains its reach and cover.
 *
 * @author Samchon
 */
export interface IHumanFaceDynamicCollider {
  /** Exact generated part identity for query diagnostics; absent on legacy callers. */
  id?: string;

  /** Producer-owned physical identity of every query point, when its assembly supplies one. */
  pointIds?: readonly string[];

  /** Generated exterior before its owning eye or oral rigid motion. */
  rest: IAutoMovieMesh;

  /** The same exterior after its owner's performed gaze or jaw motion. */
  posed: IAutoMovieMesh;
}

import type { IHumanFaceContactGeometry } from "./IHumanFaceContactGeometry";

/**
 * Matched rest and performed geometry for one admitted contact collider.
 * Reach and cover retain their existing source-authored metre meanings.
 *
 * @author Samchon
 */
export interface IHumanFaceContactColliderState {
  /** Queryable distance from this oriented sheet, metres. */
  reach: number;
  /** Maximum retained rest-clearance floor, metres. */
  cover: number;
  /** Actual performed collider geometry. */
  now: IHumanFaceContactGeometry;
  /** Shape-only rest collider geometry. */
  rest: IHumanFaceContactGeometry;
}

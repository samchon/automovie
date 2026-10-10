import type { IHumanFaceContactColliderState } from "./IHumanFaceContactColliderState";

/**
 * Original query witness retained while a soft vertex's candidate is verified.
 * Losing the sheet's readable side still requires the existing Lipschitz proof.
 *
 * @author Samchon
 */
export interface IHumanFaceContactWitness {
  /** The same collider whose original signed query supplied this witness. */
  collider: IHumanFaceContactColliderState;
  /** Retained rest-clearance floor, metres. */
  floor: number;
  /** Signed distance at the original performed vertex, metres. */
  signed: number;
}

import type { Object3D } from "three";
import type { IAutoMovieRigidTransform } from "@automovie/interface";

/** One half-open grip window. */
export interface ISelectAutoMoviePlacedChecksGripWindow {
  /** First owned film second. */
  readonly from: number;
  /** First film second after the window. */
  readonly to: number;
  /** Displayed grip socket. */
  readonly hand: Object3D;
  /** Displayed held prop. */
  readonly prop: Object3D;
  /** Expected prop frame relative to the hand, constant or at a film second. */
  readonly expected:
    | IAutoMovieRigidTransform
    | ((filmSeconds: number) => IAutoMovieRigidTransform);
}

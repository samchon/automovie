import type { IAutoMoviePlacedContact, IAutoMovieRigidTransform } from "@automovie/interface";
import type { Object3D } from "three";

/** A grip rule bound to a placed hand socket and prop. */
export type IObserveAutoMoviePlacedSceneNativeGrip = Omit<
  Extract<IAutoMoviePlacedContact.IProps, { kind: "grip" }>,
  "kind" | "sample"
> & {
  readonly kind: "scene-grip";
  readonly sample?: {
    readonly hand: Object3D;
    readonly prop: Object3D;
    readonly expected: IAutoMovieRigidTransform;
  };
};
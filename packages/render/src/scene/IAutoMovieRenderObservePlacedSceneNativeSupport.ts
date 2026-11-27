import type { IAutoMoviePlacedContact, IAutoMovieVector3 } from "@automovie/interface";
import type { Object3D } from "three";

/**
 * A contact rule bound to placed Three objects and an independent local
 * anchor.
 */
export type IAutoMovieRenderObservePlacedSceneNativeSupport = Omit<
  Extract<IAutoMoviePlacedContact.IProps, { kind: "support" }>,
  "kind" | "sample"
> & {
  readonly kind: "scene-support";
  readonly sample?: {
    /** Actual selected contact socket, with its origin at the observed point. */
    readonly socket: Object3D;

    /** Actual support reference, with local positive Y pointing outward. */
    readonly support: Object3D;

    /** Independent target in support-local metres. */
    readonly anchor: IAutoMovieVector3;
  };
};
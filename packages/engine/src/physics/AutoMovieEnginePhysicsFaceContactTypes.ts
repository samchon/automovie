import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Face-contact input and result contracts kept separate from callable operations. */
export namespace AutoMovieEnginePhysicsFaceContactTypes {
  /** A physical collider or an emitted flat-ended circular solid. */
  export type Shape =
    | IAutoMoviePhysicalShape
    | {
        /** Flat cylinder or a cone with its circular base at positive local Y. */
        kind: "cylinder" | "cone";
        /** Solid pose relative to the given parent. */
        transform: IAutoMovieRigidTransform;
        /** Positive local axial height, metres. */
        height: number;
        /** Positive circular base radius, metres. */
        radius: number;
      };

  /** The selected witness and signed gap in the material's face frame. */
  export interface IContact {
    /** The witness projected onto the face, with face-local Y zero. */
    point: IAutoMovieVector3;
    /** Coplanar points spanning a non-point witness, in face-local metres. */
    patch?: readonly IAutoMovieVector3[];
    /** Gap along the face normal, negative when the solid enters the face. */
    clearance: number;
  }
}
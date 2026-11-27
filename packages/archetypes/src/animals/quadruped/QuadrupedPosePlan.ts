import type {
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetype } from "../../core";
import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import type { QuadrupedScapula } from "./QuadrupedScapula";

/** Shared rig pose inputs and independently owned results for quadrupeds. */
export namespace QuadrupedPosePlan {
  /** Generic joint coordinates, degrees, with null meaning neutral. */
  export type Rotation = Pick<
    IAutoMovieJointPose,
    "flexion" | "abduction" | "twist"
  >;

  /** The existing axial bones whose carriage is independent of the solved limbs. */
  export type Axial = Extract<
    AutoMovieArchetypeQuadrupedBody.Bone,
    "trunk" | "hindquarters" | "neck" | "head" | "tail" | QuadrupedScapula.Bone
  >;

  /** Axial target with an authored world orientation. */
  export interface IRotationGoal {
    kind: "rotation";
    rotation: IAutoMovieQuaternion;
  }

  /** Axial target with an authored nonzero direction. */
  export interface IDirectionGoal {
    kind: "direction";
    direction: IAutoMovieVector3;
  }

  /** One world orientation or nonzero direction target for an axial bar. */
  export type Goal = IRotationGoal | IDirectionGoal;

  /** The current local coordinates and independently computed FK frames. */
  export interface IState {
    /**
     * Fresh local degree records; changing them cannot rewrite prepared
     * metadata.
     */
    joints: ReadonlyMap<AutoMovieArchetypeQuadrupedBody.Bone, Rotation>;

    /** Fresh achieved world joint transforms, one per bone. */
    frames: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    >;
  }

  /** One complete model emitted from the achieved state. */
  export interface ISample<
    Id extends string,
    Dimension extends string,
  > extends IState {
    /** Posed model; root placement is already included. */
    animal: AutoMovieArchetype<Id, Dimension>;
  }

  /**
   * A prepared angle resolver shared by the public sampler and compatibility
   * adapter.
   */
  export type Lowering = (
    root?: IAutoMovieTransform,
    limbs?: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Limb,
      readonly IAutoMovieVector3[]
    >,
    axial?: ReadonlyMap<Axial, Goal>,
  ) => IState;

  /** A source snapshot, admitted rig and reusable generic FK reader. */
  export interface IPrepared<Id extends string, Dimension extends string> {
    /** Preview current parent frames before limb IK; omitted inputs are neutral. */
    read(root?: IAutoMovieTransform, axial?: ReadonlyMap<Axial, Goal>): IState;

    /**
     * Measure exact lowest Y of all current parts except the sixteen limb bars.
     *
     * @param frames Complete current FK state from this prepared source.
     * @returns Current world Y in metres, including tack, identifying
     *   accessories and recomputed spans.
     * @throws {RangeError} For incomplete/non-rigid frames, unsupported solids
     *   or nonfinite derived bounds; span-owner refusals propagate.
     */
    bodyFloor(
      frames: ReadonlyMap<
        AutoMovieArchetypeQuadrupedBody.Bone,
        IAutoMovieTransform
      >,
    ): number;

    /** Lower complete solved world chains and emit the model and contacts. */
    sample(
      limbs: ReadonlyMap<
        AutoMovieArchetypeQuadrupedBody.Limb,
        readonly IAutoMovieVector3[]
      >,
      root?: IAutoMovieTransform,
      axial?: ReadonlyMap<Axial, Goal>,
    ): ISample<Id, Dimension>;
  }
}

import type {
  AutoMovieClinicalAxis,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieJointRotationDomain,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieRestFrame,
} from "@automovie/interface";

import { decomposeJointRotationOnBasis as decomposeJointRotationOnBasisImplementation } from "./internal/decomposeJointRotationOnBasis";
import { jointToQuaternionOnBasis as jointToQuaternionOnBasisImplementation } from "./internal/jointToQuaternionOnBasis";

/** Clinical joint rotation conversion on an admitted basis. */
export namespace AutoMovieEngineKinematicsJointRotation {
  /** Destination for the selected joint-ROM overshoot. */
  export interface IScore {
    overshoot: number | undefined;
  }

  /** Clinical axes whose angles remain fixed across prepared queries. */
  export type IFixedAngles = Partial<
    Record<AutoMovieClinicalAxis, readonly [number] | readonly [number, number]>
  >;

  /** Compose a clinical joint record on one prepared basis. */
  export type IComposer = (
    joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
    currentFrame?: IAutoMovieRestFrame,
  ) => IAutoMovieQuaternion;

  /** Read quaternion coefficients without constructing a quaternion DTO. */
  export type IRawReader = <Result, Context>(
    joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
    read: (
      x: number,
      y: number,
      z: number,
      w: number,
      context: Context,
    ) => Result,
    context: Context,
  ) => Result;

  /** Read angles for a rotation on its admitted clinical basis. */
  export function decomposeJointRotationOnBasis(
    q: IAutoMovieQuaternion,
    basis: IAutoMovieJointAxes,
    frame?: IAutoMovieRestFrame,
    domain?: IAutoMovieJointRotationDomain,
  ): IAutoMovieResolvedJointAngles {
    return decomposeJointRotationOnBasisImplementation.run(
      q,
      basis,
      frame,
      domain,
    );
  }

  /** Prepare independent readers for repeated inverse queries. */
  export function prepareDecomposeJointRotationQueries(
    basis: IAutoMovieJointAxes,
    frame?: IAutoMovieRestFrame,
    domain?: IAutoMovieJointRotationDomain,
  ): () => (q: IAutoMovieQuaternion) => IAutoMovieResolvedJointAngles {
    return decomposeJointRotationOnBasisImplementation.prepareQueries(
      basis,
      frame,
      domain,
    );
  }

  /** Decompose and write the selected ROM overshoot into the supplied record. */
  export function scoreDecomposedJointRotation(
    q: IAutoMovieQuaternion,
    basis: IAutoMovieJointAxes,
    frame: IAutoMovieRestFrame | undefined,
    domain: IAutoMovieJointRotationDomain | undefined,
    into: IScore,
  ): IAutoMovieResolvedJointAngles {
    return decomposeJointRotationOnBasisImplementation.scored(
      q,
      basis,
      frame,
      domain,
      into,
    );
  }

  /** Compose clinical joint angles into a quaternion on an admitted basis. */
  export function jointToQuaternionOnBasis(
    joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
    basis: IAutoMovieJointAxes,
    frame?: IAutoMovieRestFrame,
  ): IAutoMovieQuaternion {
    return jointToQuaternionOnBasisImplementation.run(joint, basis, frame);
  }

  /** Prepare a composer for repeated angles on one fixed basis. */
  export function prepareJointToQuaternionOnBasis(
    basis: IAutoMovieJointAxes,
    frame?: IAutoMovieRestFrame,
  ): IComposer {
    return jointToQuaternionOnBasisImplementation.prepare(basis, frame);
  }

  /** Prepare a mutable-frame composer for one fixed basis. */
  export function prepareMutableJointToQuaternionOnBasis(
    basis: IAutoMovieJointAxes,
  ): IComposer {
    return jointToQuaternionOnBasisImplementation.prepareMutable(basis);
  }

  /** Prepare independent composers for repeated rig queries. */
  export function prepareJointToQuaternionOnBasisQueries(
    basis: IAutoMovieJointAxes,
    frame?: IAutoMovieRestFrame,
    fixedAngles?: IFixedAngles,
  ): () => IComposer {
    return jointToQuaternionOnBasisImplementation.prepareQueries(
      basis,
      frame,
      fixedAngles,
    );
  }

  /** Prepare scalar readers for actual candidate scoring. */
  export function prepareJointToQuaternionOnBasisScalarQueries(
    basis: IAutoMovieJointAxes,
    frame?: IAutoMovieRestFrame,
    fixedAngles?: IFixedAngles,
  ): () => IRawReader {
    return jointToQuaternionOnBasisImplementation.prepareScalarQueries(
      basis,
      frame,
      fixedAngles,
    );
  }
}

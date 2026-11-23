import type { IAutoMovieProfileBinding } from "../core/IAutoMovieProfileBinding";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieMotion } from "./IAutoMovieMotion";
import type { IAutoMovieRetargetContactProps } from "./IAutoMovieRetargetContactProps";

/**
 * Input for {@link retargetHumanoidMotion}. Clinical joint values remain
 * degrees. Root translation and contacts scale between the rigs' model units;
 * their authored quaternion facing is retained. Inputs are borrowed and must
 * remain unchanged while the operation runs.
 */
export interface IAutoMovieHumanoidRetargetProps {
  /** Clip authored on `source`. */
  motion: IAutoMovieMotion;

  /** Skeleton the clip was authored against. */
  source: IAutoMovieSkeleton;

  /** Skeleton the clip should play on. */
  target: IAutoMovieSkeleton;

  /** Optional source profile binding carrying semantic slot -> node ids. */
  sourceBinding?: IAutoMovieProfileBinding;

  /** Optional target profile binding carrying semantic slot -> node ids. */
  targetBinding?: IAutoMovieProfileBinding;

  /**
   * Optional source clinical axes; defaults to the humanoid table, under any
   * axes the source bones declare.
   */
  sourceJointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /**
   * Optional target clinical axes; defaults to the humanoid table, under any
   * axes the target bones declare.
   */
  targetJointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Optional source rest frames; defaults to the humanoid table. */
  sourceRestFrames?: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  >;

  /** Optional target rest frames; defaults to the humanoid table. */
  targetRestFrames?: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  >;

  /** Extra bones, such as a reach end effector, that must exist on both rigs. */
  requiredBones?: readonly AutoMovieHumanoidBone[];

  /**
   * Explicit root translation scale; omitted means target height / source
   * height.
   */
  rootScale?: number;

  /**
   * Contact policy for the contact-preserving pass. Omitted runs the pass with
   * humanoid legs and no declared hand contact.
   */
  contacts?: IAutoMovieRetargetContactProps;

  /** Optional id for the retargeted clip. */
  id?: string;
}

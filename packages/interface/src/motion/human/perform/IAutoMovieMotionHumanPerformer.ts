import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanAttribute } from "../ensemble/IAutoMovieMotionHumanAttribute";
import type { IAutoMovieProficiency } from "../skill/IAutoMovieProficiency";

/**
 * One person in a performance: whose body, where and facing which way they
 * stand before their first action, and how skilled they are.
 *
 * `at` is the floor point under the body at rest, world metres; `yaw` turns the
 * body about +Y in degrees (0 faces +Z). The proficiency drives timing, path,
 * balance and outcome variation; the performance's seed and the subject id key
 * every draw.
 */
export interface IAutoMovieMotionHumanPerformer {
  /** Subject id, unique in the performance. */
  subject: string;

  /** The body. */
  body: IAutoMovieMotionHumanBody;

  /**
   * Starting floor point, world metres. `guard` and `step` place the feet on
   * the floor at y = 0 and do not read this point's `y`: a performer on a
   * raised floor, such as a ring canvas at y = 1, is stepped down to y = 0 by
   * them.
   */
  at: IAutoMovieVector3;

  /** Starting heading about +Y, degrees. */
  yaw: number;

  /**
   * Skill, for every action the performer takes: what a level changes is on
   * {@link IAutoMovieProficiency}. A champion is `elite`.
   */
  proficiency: IAutoMovieProficiency;

  /**
   * The person's group attributes, each in [0, 1], drawn by an ensemble
   * (`HumanEnsemble.performers`) or given; an attribute absent reads as its
   * neutral value, which the reader of `HUMAN_ATTRIBUTE_EFFECTS` names. Laws
   * and layers read them from their context; none changes an outcome.
   */
  attributes?: Readonly<
    Partial<Record<IAutoMovieMotionHumanAttribute.Name, number>>
  >;
}

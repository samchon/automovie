import type {
  IAutoMovieProficiency,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

/**
 * One person in a performance: whose body, where and facing which way they
 * stand before their first action, and how skilled they are.
 *
 * `at` is the floor point under the body at rest, world metres; `yaw` turns
 * the body about +Y in degrees (0 faces +Z). The proficiency drives timing,
 * path, balance and outcome variation; the performance's seed and the
 * subject id key every draw.
 */
export interface IHumanPerformer {
  /** Subject id, unique in the performance. */
  subject: string;

  /** The body. */
  body: IHumanBody;

  /** Starting floor point, world metres. */
  at: IAutoMovieVector3;

  /** Starting heading about +Y, degrees. */
  yaw: number;

  /** Skill. */
  proficiency: IAutoMovieProficiency;
}

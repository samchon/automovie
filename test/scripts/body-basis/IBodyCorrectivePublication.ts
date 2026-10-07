import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import type { IBodyCorrectiveRecord } from "./IBodyCorrectiveRecord";

/** Accepted solver correctives, exact stored rest rows and visit records. */
export interface IBodyCorrectivePublication {
  correctives: NonNullable<IAutoMovieHumanBodyBasis["correctives"]>;
  rows: Record<string, number[]>;
  records: IBodyCorrectiveRecord[];
}

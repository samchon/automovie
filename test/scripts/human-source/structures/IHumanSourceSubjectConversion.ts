import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IHumanSourceSubjectRecord } from "./IHumanSourceSubjectRecord.ts";

/**
 * One subject's conversion: the linked person, or null when refused, and its
 * record.
 *
 * @author Samchon
 */
export interface IHumanSourceSubjectConversion {
  /** The converted person, or null when its age is refused. */
  person: IAutoMovieHumanPersonDocument | null;

  /** The conversion record. */
  record: IHumanSourceSubjectRecord;
}

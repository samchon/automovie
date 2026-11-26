import {
  type IAutoMovieDescribeSubject,
  IAutoMovieSubjectArtifact,
  IAutoMovieSubjectDescription,
} from "@automovie/interface";

import { AutoMovieEngineSubjectDescriber } from "../AutoMovieEngineSubjectDescriber";

/**
 * Describe one stable subject address from a compiled shot artifact.
 *
 * Individual compact instances and placed parts are regenerated only when
 * addressed, so direct inspection remains exact without expanding the normal
 * subject inventory.
 *
 * Addresses are `prototype:<model>`, `prototype-part:<model>/<part>`,
 * `element:<node>`, `element-part:<node>/<part>`, `instance-set:<set>`,
 * `instance:<set>:slot:<six digits>` or `instance:<set>:<explicit id>`,
 * `space:<environment>/<space>`, and `building:<environment>/<building>`, where
 * a built element's node is `<environment>/<element>`. Prototype and
 * prototype-part bounds are in model coordinates and every other kind's in
 * world metres. `members` is one page of at most
 * `AUTOMOVIE_SUBJECT_MEMBER_SAMPLE_LIMIT` ids in render-id order starting at
 * `memberOffset`, clamped to the total. An unknown address, or an offset that
 * is not a whole number of members, throws an `Error`; so does an addressed
 * instance its set cannot regenerate.
 *
 * @param artifact Compiled shot artifact and its revision.
 * @param subjectId Stable subject address in one of the formats above.
 * @param props Optional paging of the member list.
 * @returns The subject's description.
 */
export function describeAutoMovieSubject(
  artifact: IAutoMovieSubjectArtifact,
  subjectId: string,
  props?: IAutoMovieDescribeSubject.IProps,
): IAutoMovieSubjectDescription {
  const memberOffset: number = props?.memberOffset ?? 0;
  if (memberOffset < 0)
    throw new Error(
      `Subject member offset must be a whole number of members from the first, but was ${memberOffset}.`,
    );
  return new AutoMovieEngineSubjectDescriber(artifact, memberOffset).describe(
    subjectId,
  );
}

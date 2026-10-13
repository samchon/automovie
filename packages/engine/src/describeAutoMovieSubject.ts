import {
  IAutoMovieSubjectArtifact,
  IAutoMovieSubjectDescription,
} from "@automovie/interface";

import { AutoMovieSubjectDescriber } from "./AutoMovieSubjectDescriber";

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
 * `space:<environment>/<space>`, and `building:<environment>/<building>`,
 * where a built element's node is `<environment>/<element>`. Prototype and
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
 *
 * @evidence contracts/common.md#principled-implementation Validates the paging offset as a safe non-negative integer, the only meaningful rank, then resolves the address through `AutoMovieSubjectDescriber`, which describes every kind from the artifact's own records and the engine's own measurements.
 * @evidence contracts/common.md#clear-and-simple-design A thin public entry point that owns only the offset contract; every description rule lives in the describer shared with `describeAutoMovieSubjects`, so a subject reads the same addressed alone or listed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No address or subject is special-cased, and a fractional or negative offset is refused rather than rounded into a page that does not exist.
 * @evidence contracts/common.md#meaningful-documentation The documentation lists every address form, the coordinate space of each kind's bounds, the member page, and every failure.
 * @evidence contracts/performance.md#efficient-algorithms Builds the describer's indexes once, linear in the artifact's models, elements and populations, then scans subject kinds until the address matches and measures only that subject.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One address per call over a fresh describer, because the artifact is the caller's value and may change between calls; a caller describing many subjects lists the inventory instead.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The describer and its caches live only for this call and are released on return; the caller owns the returned description.
 */
export const describeAutoMovieSubject = (
  artifact: IAutoMovieSubjectArtifact,
  subjectId: string,
  props?: {
    /**
     * Rank of the first member to name, defaulting to the first.
     *
     * A whole number; a fractional or negative rank names no page that exists
     * and is refused rather than rounded, because a caller paging by a value it
     * computed would otherwise be told it had read everything.
     */
    memberOffset?: number;
  },
): IAutoMovieSubjectDescription => {
  const memberOffset: number = props?.memberOffset ?? 0;
  if (Number.isSafeInteger(memberOffset) === false || memberOffset < 0)
    throw new Error(
      `Subject member offset must be a whole number of members from the first, but was ${memberOffset}.`,
    );
  return new AutoMovieSubjectDescriber(artifact, memberOffset).describe(
    subjectId,
  );
};

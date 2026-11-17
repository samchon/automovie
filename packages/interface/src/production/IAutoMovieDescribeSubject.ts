/**
 * Data and callback contracts shared by the DescribeSubject operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describe one stable subject address from a compiled shot artifact. Member documentation states the supplied records, units and absence meanings used by describeAutoMovieSubject.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The page offset does not expand compact populations or encode one subject kind; canonical subject addresses and measured coordinate frames remain the describer's responsibility.
 * @evidence contracts/development/design.md#principled-representation memberOffset is an optional zero-based whole-member rank, defaulting to zero; describeAutoMovieSubject refuses negative and fractional ranks before paging stable render ids.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieDescribeSubject, used by describeAutoMovieSubject. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieDescribeSubject {
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
   * @evidence contracts/development/common.md#meaningful-documentation Describe one stable subject address from a compiled shot artifact. Member documentation states the supplied records, units and absence meanings used by describeAutoMovieSubject.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The page offset does not expand compact populations or encode one subject kind; canonical subject addresses and measured coordinate frames remain the describer's responsibility.
   * @evidence contracts/development/design.md#principled-representation memberOffset is an optional zero-based whole-member rank, defaulting to zero; describeAutoMovieSubject refuses negative and fractional ranks before paging stable render ids.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieDescribeSubject.IProps, used by describeAutoMovieSubject. Its memberOffset members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /**
     * Rank of the first member to name, defaulting to the first.
     *
     * A whole number; a fractional or negative rank names no page that exists
     * and is refused rather than rounded, because a caller paging by a value it
     * computed would otherwise be told it had read everything.
     */
    memberOffset?: number;
  };
}

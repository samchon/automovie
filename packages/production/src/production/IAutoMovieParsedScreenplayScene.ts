import type { IAutoMovieParsedScreenplayAuthority } from "./IAutoMovieParsedScreenplayAuthority";



/**
 * One complete Markdown scene section and its explicit semantic carrier.
 *
 * @evidence contracts/common.md#principled-implementation The SCN heading supplies stable id/title, the section supplies body text, and an optional complete carrier supplies declared semantic identities with separately retained errors.
 * @evidence contracts/common.md#clear-and-simple-design parseScreenplayProse owns document boundaries while the diagnostic join consumes this compact parse result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Body prose is retained without lexical timing extraction or comparison with exact treatment sentences.
 * @evidence contracts/common.md#meaningful-documentation States heading identity, section body and nullable carrier/error observations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type executes no Markdown scan or semantic join.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type defines no cached answer for mutable documents.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The parser owns body strings and carrier arrays until its result is released; no handle is acquired.
 */
export interface IAutoMovieParsedScreenplayScene {
  /** Scene identifier read from the heading. */
  id: string;
  /** Heading text after the identifier and its separator. */
  title: string;
  /** Every line until the next heading. */
  body: string;
  /** Parsed authority block, or null when the scene carries none. */
  authority: IAutoMovieParsedScreenplayAuthority | null;
  /** Authority lines that failed to parse, verbatim. */
  authorityErrors: string[];
}

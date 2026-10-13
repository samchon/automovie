import { escapeWebVttText } from "./escapeWebVttText";

const SINGLE_LINE_CONTROLS: RegExp = /[\u0000-\u001f\u007f]/gu;

/**
 * Serialize annotation text, such as a `<v>` speaker name, that must stay on
 * one WebVTT line.
 *
 * Every C0 control, tab and line terminators included, and DEL becomes one
 * space, then `&`, `<` and `>` are escaped, so the annotation can neither break
 * the cue line nor close its tag early. Identifiers use
 * `serializeAutoMovieWebVttIdentifier` instead, because WebVTT gives them no
 * escape.
 *
 * @evidence contracts/common.md#principled-implementation An annotation ends at the first `>` and a cue line at the first line terminator, so mapping all controls to spaces and then applying the shared WebVTT escape keeps the annotation inside its tag while preserving its visible characters one-for-one.
 * @evidence contracts/common.md#clear-and-simple-design The function owns only single-line flattening and delegates escaping to `escapeWebVttText`, which cue payloads share; film assembly reuses it to judge whether a speaker name is blank after flattening.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The flattened set is the full C0 range and DEL, a format rule rather than a case drawn from a fixture, and no speaker or caller is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc names the field it serves, the exact control mapping and escape, the two failure modes it prevents, and which serializer handles identifiers instead.
 * @evidence contracts/performance.md#efficient-algorithms One regular-expression replacement and the three escape passes are each linear in the annotation length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure string mapping has no completed work worth sharing; each cue's speaker is serialized once per call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the module-level compiled pattern is retained, and `replace` resets its global-flag state on every call.
 */
export const serializeAutoMovieWebVttSingleLineText = (value: string): string =>
  escapeWebVttText(value.replace(SINGLE_LINE_CONTROLS, " "));

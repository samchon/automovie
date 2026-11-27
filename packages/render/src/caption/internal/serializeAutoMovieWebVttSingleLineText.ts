import { escapeWebVttText } from "./escapeWebVttText.js";

const SINGLE_LINE_CONTROLS: RegExp = /[\u0000-\u001f\u007f]/gu;

/*
 * Serialize annotation text, such as a `<v>` speaker name, that must stay on
 * one WebVTT line.
 *
 * Every C0 control, tab and line terminators included, and DEL becomes one
 * space, then `&`, `<` and `>` are escaped, so the annotation can neither break
 * the cue line nor close its tag early. Identifiers use
 * `AutoMovieRenderCaption.serializeWebVttIdentifier` instead, because WebVTT gives them no
 * escape.
 */
export const serializeAutoMovieWebVttSingleLineText: (
  value: string,
) => string = (value: string): string =>
  escapeWebVttText(value.replace(SINGLE_LINE_CONTROLS, " "));

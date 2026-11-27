import { isWebVttIdentifierImplementation } from "./isWebVttIdentifierImplementation";

/*
 * Return one WebVTT header text or cue identifier verbatim, or throw.
 *
 * WebVTT defines no character references for these lines, so escaping would
 * change the identity a player reads; a value `AutoMovieRenderCaption.isWebVttIdentifier`
 * refuses (empty, containing CR or LF, or containing `-->`) throws an `Error`
 * instead of being rewritten.
 */
export const serializeWebVttIdentifierImplementation: (value: string) => string = (
  value: string,
): string => {
  if (isWebVttIdentifierImplementation(value) === false)
    throw new Error(
      "WebVTT header and cue identifiers must be non-empty and must not contain a line break or -->.",
    );
  return value;
};

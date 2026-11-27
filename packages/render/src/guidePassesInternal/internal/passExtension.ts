import type { AutoMovieGuidePass } from "@automovie/interface";

/*
 * Append the pass tag to an extension; beauty uses the untagged extension. Both
 * frame-name and encoder-pattern producers use this same spelling.
 */
export const passExtension: (
  pass: AutoMovieGuidePass,
  ext: string,
) => string = (pass: AutoMovieGuidePass, ext: string): string =>
  pass === "beauty" ? ext : `${pass}.${ext}`;

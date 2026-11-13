/**
 * The options `automovie render` takes for itself, written `--<name>`; of the capture request grammar it takes only `subject`, the subject rendered.
 *
 * `readAutoMovieRenderOptions` takes exactly these out of the command line, and a test enumerates them against the render README's key table, so each option the command takes is documented with the requirement it serves.
 */
export const AUTOMOVIE_RENDER_OPTIONS: readonly string[] = [
  "module",
  "props",
  "out",
  "backend",
];

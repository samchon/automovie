/**
 * The options `automovie capture` takes for itself, written `--<name>`; every other option is a key of the capture request grammar.
 *
 * `readAutoMovieCaptureHostOptions` takes exactly these out of the command line, and a test enumerates them against the render README's key table, so each option the command takes is documented with the requirement it serves.
 */
export const AUTOMOVIE_CAPTURE_OPTIONS: readonly string[] = [
  "module",
  "file",
  "props",
  "out",
  "backend",
];

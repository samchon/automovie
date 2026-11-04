/** The capture CLI's arguments, read by `parseHumanDebugCaptureArguments`. */
export interface IHumanDebugCaptureArguments {
  /** Viewer origin, such as `http://127.0.0.1:5197`. */
  origin: string;

  /** Directory the shots are written to. */
  out: string;

  /** Search text every shot starts from. */
  base: string;

  /** Shots in order: file name and the search text replacing the base's variables. */
  shots: { name: string; query: string }[];
}

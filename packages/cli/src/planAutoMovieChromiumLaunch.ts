import type { AutoMovieCaptureBackend } from "./AutoMovieCaptureBackend";

/**
 * The Chromium switches and executable for a capture backend.
 *
 * | Backend    | Switches                                                    | Named         |
 * | ---------- | ----------------------------------------------------------- | ------------- |
 * | `software` | `--use-gl=angle --use-angle=swiftshader`                    | `swiftshader` |
 * | `gpu`      | `--use-gl=angle --use-angle=default --ignore-gpu-blocklist` | `gpu`         |
 *
 * The executable is `CHROME_PATH` when the environment sets it to a non-blank
 * path, else the Chromium build Playwright pins, which `executablePath` leaves
 * absent.
 */
export function planAutoMovieChromiumLaunch(
  backend: AutoMovieCaptureBackend,
  env: Readonly<Record<string, string | undefined>>,
): {
  /** Switches passed to Chromium. */
  args: string[];

  /** Executable to launch, or absent for Playwright's own build. */
  executablePath?: string;

  /** The backend's name as the record states it. */
  name: string;
} {
  const chrome: string | undefined = env.CHROME_PATH?.trim();
  return {
    args:
      backend === "software"
        ? ["--use-gl=angle", "--use-angle=swiftshader"]
        : ["--use-gl=angle", "--use-angle=default", "--ignore-gpu-blocklist"],
    ...(chrome === undefined || chrome === ""
      ? {}
      : { executablePath: chrome }),
    name: backend === "software" ? "swiftshader" : "gpu",
  };
}

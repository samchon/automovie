import { FilmPlan } from "../film/FilmPlan";

/**
 * Exact whole-film capture controls shared with the actual Viewer programme.
 *
 * @evidence contracts/common.md#implementation-and-ownership FilmPlan supplies the one 180-second, 30-fps half-open clock. The URL selects capture raster and the full editorial range while preserving the caller's immutable build path. It never supplies an alternate animation, camera or soundtrack.
 * @evidence contracts/common.md#authoring-interface url accepts the task-owned loopback HTTP Viewer entry. assertClock refuses old fifteen-second hosts and incomplete preparation before any frame capture. Real frame generation and audio readiness remain the host's responsibility.
 */
export namespace FilmExportPlan {
  /**
   * Select the complete programme and exact export raster without autoplay.
   *
   * @evidence contracts/common.md#implementation-and-ownership URL parsing preserves the precise artifact path and unrelated consumer options. Explicit clock/raster parameters align the Viewer with Render; autoplay is removed because each capture awaits the public completed seek hook.
   * @evidence contracts/common.md#authoring-interface The returned fresh URL uses 1280 by 720, native speed, start zero and FilmPlan.duration. Only HTTP loopback addresses are admitted, keeping this production command on its inspected local host.
   */
  export function url(requested: string): string {
    const result: URL = new URL(requested);
    if (result.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(result.hostname))
      throw new Error("Capture requires the inspected local Viewer URL");
    for (const [key, value] of Object.entries({ capture: "1", cap: "1", w: "1280", h: "720", start: "0", end: String(FilmPlan.duration), speed: "1" }))
      result.searchParams.set(key, value);
    result.searchParams.delete("play");
    return result.href;
  }

  /**
   * Refuse a stale or incomplete host before preparing sound or capturing pixels.
   *
   * @evidence contracts/common.md#implementation-and-ownership Checks actual public host readiness and clock against the consumed FilmPlan, including every i/fps sample through the last half-open frame. No readiness bit is treated as visual or physical acceptance.
   * @evidence contracts/common.md#authoring-interface Supply values read from the same capture page after completed seek. A fifteen-second draft, fractional extent or unprepared runtime rejects; no default clock substitutes for missing facts.
   */
  export function assertClock(host: { ready: boolean; durationSeconds: number; fps: number; frameCount: number }): void {
    if (host.ready !== true || host.durationSeconds !== FilmPlan.duration || host.fps !== FilmPlan.fps || host.frameCount !== FilmPlan.frames || host.frameCount !== host.durationSeconds * host.fps)
      throw new Error("Viewer does not expose the complete prepared FilmPlan clock");
  }
}

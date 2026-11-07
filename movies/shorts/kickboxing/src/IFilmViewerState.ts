import type { FilmPlan } from "./shots/kickboxing/ring-bout/FilmPlan";
import type { MovieAudio } from "./sound/MovieAudio";

/** Public real-host state shared by review and capture. Whole-film metadata and the available source interval remain distinct. */
export interface IFilmViewerState {
  /** Initial source presentation label. */
  version: string;
  /** Selected film identity. */
  film: string;
  /** Commissioned whole-film duration, seconds. */
  durationSeconds: number;
  /** Delivered frames per second. */
  fps: number;
  /** Commissioned whole-film frame count. */
  frameCount: number;
  /** Prepared audible/visible event population. */
  eventCount: number;
  /** Actual producer readiness. */
  ready: boolean;
  /** Current preparation/review phase. */
  stage: string;
  /** Actual source interval after archive admission, absolute seconds. */
  available?: readonly [number, number];
  /** Actual source or consumer refusal. */
  error?: string;
  /** Await preparation and draw the exact requested available second. */
  seek?: (seconds: number) => Promise<void>;
  /** Actual current source, transport and renderer observations. */
  inspect?: () => object;
  /** Accepted contact observations. */
  contacts?: () => unknown[];
  /** Actual floor arrival observations. */
  floorContacts?: () => unknown[];
  /** Exact clock and provenance of the prepared cues. */
  audioEvents?: () => FilmPlan.Event[];
  /** Shared soundtrack identities and diagnostics. */
  audioManifest?: () => MovieAudio.Manifest;
}

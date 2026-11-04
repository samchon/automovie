import type { MovieAudio } from "../audio/MovieAudio";
import type { FilmRuntime } from "./FilmRuntime";

/**
 * Prepare the actual complete source and its same-receipt soundtrack with honest failure costs.
 * @evidence contracts/common.md#implementation-and-ownership Awaits the original runtime once, then configures the original audio consumer with that same runtime's actual events, contacts and floor observations. Separate finally boundaries publish elapsed source and audio work even when either producer rejects; no exception becomes readiness or a zero-cost success.
 * @evidence contracts/common.md#authoring-interface Costs are elapsed milliseconds including asynchronous preparation, distinct from actor construction, draw, capture and encoding. Progress remains source IDs/counts. The document's actual closed predicate prevents later preparation from publishing into a retired Viewer; readiness remains the main host's responsibility.
 */
export async function prepareFilmSources(
  runtime: FilmRuntime,
  audio: MovieAudio,
  progress: (id: string, completed: number, total: number) => void,
  costs: { sourceMs: number; audioMs: number },
  closed: () => boolean,
): Promise<void> {
  const sourceStarted: number = performance.now();
  try {
    await runtime.prepare(progress);
  } finally {
    costs.sourceMs = performance.now() - sourceStarted;
  }
  if (closed()) throw new Error("The Viewer closed during preparation");
  const audioStarted: number = performance.now();
  try {
    audio.configure(
      runtime.audioEvents(),
      runtime.contacts(),
      runtime.floorContacts(),
    );
    await audio.prepare();
  } finally {
    costs.audioMs = performance.now() - audioStarted;
  }
  if (closed()) throw new Error("The Viewer closed during preparation");
}

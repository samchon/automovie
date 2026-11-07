import type { IFilmProduction } from "../IFilmProduction";
import type { IFilmViewerState } from "../IFilmViewerState";
import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import type { MovieAudio } from "../sound/MovieAudio";

/** Publish media inspection on the actual prepared production. Every read checks current readiness and borrows the same runtime/audio inputs used by playback; this adapter owns no cached substitute or new resource lifetime. */
export function bindFilmMediaInspection(
  state: IFilmViewerState,
  current: () => IFilmProduction | undefined,
): void {
  /** Preserve the specific unavailable operation while refusing premature reads. */
  function requireReady(message: string): IFilmProduction {
    const film: IFilmProduction | undefined = current();
    if (!state.ready || !film) throw new Error(message);
    return film;
  }
  state.contacts = (): unknown[] =>
    requireReady("Full film contacts are unavailable").runtime.contacts();
  state.floorContacts = (): unknown[] =>
    requireReady(
      "Full film floor receipts are unavailable",
    ).runtime.floorContacts();
  state.audioEvents = (): FilmPlan.Event[] =>
    requireReady(
      "The actual audio event manifest is unavailable",
    ).runtime.audioEvents();
  state.audioManifest = (): MovieAudio.Manifest =>
    requireReady("The full soundtrack is unavailable").audio.manifest();
}

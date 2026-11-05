import type { IFilm } from "../IFilm";
import { kickboxing } from "./kickboxing";

/**
 * Every film this production delivers, keyed by its screenplay file's name,
 * which the Viewer's `film` parameter and `pnpm render -- --film` select.
 */
export const films: Readonly<Record<string, IFilm>> = {
  kickboxing: kickboxing(),
};

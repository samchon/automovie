import type { IFilm } from "../../IFilm";
import { starter } from "./starter";

/**
 * Every film this production delivers, keyed by its screenplay file's name,
 * which the Viewer's `film` parameter and `npm run render -- --film` select.
 */
export const films: Readonly<Record<string, IFilm>> = {
  starter: starter(),
};

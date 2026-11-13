import type { IFilm } from "../../IFilm";
import { starter } from "./starter";

/**
 * Every film this production delivers, keyed by its film name, which derives
 * from its screenplay film folder's path and which the inspector's `subject`
 * parameter and `pnpm run render --subject` select.
 */
export const films: Readonly<Record<string, IFilm>> = {
  starter: starter(),
};

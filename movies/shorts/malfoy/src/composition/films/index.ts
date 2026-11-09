import type { IFilm } from "../../IFilm";
import { lookAtMeDuel } from "./lookAtMeDuel";
import { paperCraneInvitation } from "./paperCraneInvitation";
import { snitchBeforeYou } from "./snitchBeforeYou";
import { threeOclock } from "./threeOclock";

/**
 * Every film this production delivers, keyed by its screenplay file's name,
 * which the Viewer's `film` parameter and `npm run render -- --film` select.
 */
export const films: Readonly<Record<string, IFilm>> = {
  "look-at-me-duel": lookAtMeDuel(),
  "paper-crane-invitation": paperCraneInvitation(),
  "snitch-before-you": snitchBeforeYou(),
  "three-oclock": threeOclock(),
};
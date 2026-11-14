import { SCENES_BLADES } from "./data/SCENES_BLADES";
import { SCENES_COMBAT } from "./data/SCENES_COMBAT";
import { SCENES_COMPOSITION } from "./data/SCENES_COMPOSITION";
import { SCENES_DAILY } from "./data/SCENES_DAILY";
import { SCENES_EVERYDAY } from "./data/SCENES_EVERYDAY";
import { SCENES_FIELD } from "./data/SCENES_FIELD";
import { SCENES_FIGHT } from "./data/SCENES_FIGHT";
import { SCENES_GAMES } from "./data/SCENES_GAMES";
import { SCENES_GESTURES } from "./data/SCENES_GESTURES";
import { SCENES_GYM } from "./data/SCENES_GYM";
import { SCENES_LABOUR } from "./data/SCENES_LABOUR";
import { SCENES_PARTNER } from "./data/SCENES_PARTNER";
import { SCENES_PLACES } from "./data/SCENES_PLACES";
import { SCENES_PLANNED } from "./data/SCENES_PLANNED";
import { SCENES_SPORT } from "./data/SCENES_SPORT";
import { SCENES_STAGE_FIGHT } from "./data/SCENES_STAGE_FIGHT";
import { SCENES_STREET } from "./data/SCENES_STREET";
import { SCENES_WORKOUT } from "./data/SCENES_WORKOUT";
import type { IScene } from "./structures/IScene";

/**
 * Every scene the site knows: the scenes that play on the installed
 * packages, the ones written for a release that has not landed, and the
 * ones a campaign plans. Each page orders them by setting and status. Add a
 * scene to a file under `data/`; no page changes.
 */
export const SCENES: readonly IScene[] = [
  ...SCENES_EVERYDAY,
  ...SCENES_SPORT,
  ...SCENES_COMBAT,
  ...SCENES_DAILY,
  ...SCENES_PLACES,
  ...SCENES_GESTURES,
  ...SCENES_STREET,
  ...SCENES_COMPOSITION,
  ...SCENES_GYM,
  ...SCENES_WORKOUT,
  ...SCENES_GAMES,
  ...SCENES_FIELD,
  ...SCENES_FIGHT,
  ...SCENES_STAGE_FIGHT,
  ...SCENES_BLADES,
  ...SCENES_PARTNER,
  ...SCENES_LABOUR,
  ...SCENES_PLANNED,
];

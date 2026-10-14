import type { IAutoMovieShot } from "@automovie/interface";

import { createCaptionShot } from "./createCaptionShot";

/** Original two- and three-second caption shots, shared by reference between sidecar and slicing tests; variations use fresh shot records. */
export const CAPTION_SHOTS: IAutoMovieShot[] = [
  createCaptionShot("shot:duel", 2),
  createCaptionShot("shot:aftermath", 3),
];

import { AutoMovieGeometryQuery } from "@automovie/interface";

import { geometrySelectorTestAsk as ask } from "./geometrySelectorTestAsk";

/** Read a distance query and refuse an unexpected result kind. */
export const geometrySelectorTestMeters = (
  request: AutoMovieGeometryQuery,
): number => {
  const result = ask(request);
  if (result.kind !== "distance") throw new Error("a distance was expected");
  return result.meters;
};

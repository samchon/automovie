import { AutoMovieGeometryQuery } from "@automovie/interface";
import { geometrySelectorTestAsk as ask } from "./geometrySelectorTestAsk";


/** Read measurement values and refuse an unexpected result kind. */
export const geometrySelectorTestValues = (
  request: AutoMovieGeometryQuery,
): Record<string, number | string | boolean> => {
  const result = ask(request);
  if (result.kind !== "measurement")
    throw new Error("a measurement was expected");
  return result.values;
};

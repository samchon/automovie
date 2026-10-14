import { IAutoMovieBeat } from "@automovie/interface";

/** Return a fresh named two-second beat with the original authored summary used by screenplay and caption tests. */
export const screenplayBeat: (id: string, name: string) => IAutoMovieBeat = (
  id: string,
  name: string,
): IAutoMovieBeat => ({
  id,
  name,
  summary: `${name} summary`,
  durationHint: 2,
});

import type { IAutoMovieHumanF1 } from "@automovie/interface";

import { AutoMovieHumanEmptyProbes } from "../generation/AutoMovieHumanEmptyProbes";
import { AutoMovieHumanF1 } from "../generation/AutoMovieHumanF1";

/**
 * Every person the package defines, as the capture subjects offer them: the
 * person's authored families, how its surface is generated, and the poses it
 * can be drawn in.
 *
 * A person is generated in its reference pose only; the package names no other
 * pose yet, so `reference` is each person's one pose and its canonical one.
 * Adding a person or a pose here offers it to the capture and the inspector
 * without touching them.
 */
export const HUMAN_CAPTURE_PEOPLE: Readonly<
  Record<
    string,
    {
      /** The authored families the surface is lofted from, with their mirroring. */
      readonly members: readonly IAutoMovieHumanF1.IMember[];

      /**
       * Generate the surface pieces, metres in the figure's frame (forward +X,
       * up +Y, left +Z).
       */
      readonly create: () => IAutoMovieHumanF1.IPiece[];

      /** The poses the person can be drawn in, the canonical one first. */
      readonly poses: readonly string[];

      /**
       * List the points the person's skin must leave empty, millimetres in the
       * figure's frame, each placed or with its reason.
       */
      readonly probes: () => AutoMovieHumanEmptyProbes.IProbe[];
    }
  >
> = {
  f1: {
    members: AutoMovieHumanF1.FAMILIES,
    create: (): IAutoMovieHumanF1.IPiece[] => AutoMovieHumanF1.create(),
    poses: ["reference"],
    probes: (): AutoMovieHumanEmptyProbes.IProbe[] =>
      AutoMovieHumanEmptyProbes.list(AutoMovieHumanF1.EMPTY_PROBES),
  },
};

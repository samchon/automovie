import {
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
} from "@automovie/interface";

import { renameSemanticMaskKey } from "./renameSemanticMaskKey";

/** Return the original ten null, array, discriminator and collection/member-shape cases with their exact expected structural boundary substrings; unknown casts deliberately expose runtime admission. */
export const malformedSemanticMaskShapes: (
  mask: IAutoMovieSemanticMask,
) => readonly (readonly [string, IAutoMovieSemanticMask, string])[] = (
  mask: IAutoMovieSemanticMask,
): ReadonlyArray<readonly [string, IAutoMovieSemanticMask, string]> => [
  ["null mask", null as unknown as IAutoMovieSemanticMask, "must be an object"],
  ["array mask", [] as unknown as IAutoMovieSemanticMask, "must be an object"],
  [
    "missing version",
    renameSemanticMaskKey(
      mask,
      "version",
      "schema",
    ) as unknown as IAutoMovieSemanticMask,
    "requires explicit version and protocol",
  ],
  [
    "missing protocol",
    renameSemanticMaskKey(
      mask,
      "protocol",
      "format",
    ) as unknown as IAutoMovieSemanticMask,
    "requires explicit version and protocol",
  ],
  [
    "entries are not an array",
    { ...mask, entries: {} } as unknown as IAutoMovieSemanticMask,
    "entries must be an array",
  ],
  [
    "gaps are not an array",
    { ...mask, unaddressed: {} } as unknown as IAutoMovieSemanticMask,
    "unaddressed gaps must be an array",
  ],
  [
    "entry is not an object",
    { ...mask, entries: [null] } as unknown as IAutoMovieSemanticMask,
    "entry 0 must be an object",
  ],
  [
    "entry nodes are not an array",
    {
      ...mask,
      entries: [{ ...mask.entries[0]!, nodes: {} }],
    } as unknown as IAutoMovieSemanticMask,
    "entry 0 nodes must be an array",
  ],
  [
    "slot is not an object",
    {
      ...mask,
      entries: [
        {
          ...mask.entries[1]!,
          slot: 1,
        } as unknown as IAutoMovieSemanticMaskEntry,
      ],
    },
    "entry 0 slot must be an object",
  ],
  [
    "gap is not an object",
    { ...mask, unaddressed: [null] } as unknown as IAutoMovieSemanticMask,
    "gap 0 must be an object",
  ],
];

import { readAutoMovieHumanHand } from "./readAutoMovieHumanHand";

/**
 * The human profile's named palm-and-digit network connectivity.
 *
 * These are counts, named branch order and semantic column relationships, never sampled mesh positions or landmark indices. Geometry and its logical texture chart consume the same network block sequence. Moving this declaration does not change the emitted faces.
 */
export const AUTOMOVIE_HUMAN_HAND_TOPOLOGY: {
  thenar: number;
  step: number;
  thumb: number;
  webEnds: number[];
  webs: Array<{ palmar: number; dorsal: number }>;
  shift: number;
  bridge: number;
  fingers: readAutoMovieHumanHand.IFinger[];
} = {
  /** Columns between the carpal and metacarpal transition bands. */
  thenar: 12,
  /** Columns between the two metacarpal transition bands. */
  step: 18,
  /** Semantic radial-palmar column the thumb opening straddles in the twelve-column thenar ring. */
  thumb: 3,
  /** The twenty-loop's web ends, palmar and dorsal, which split. */
  webEnds: [1, 7, 9, 11, 17, 19],
  /** Palmar/dorsal semantic nodes of the index-middle, middle-ring and ring-little webs. */
  webs: [
    { palmar: 1, dorsal: 7 },
    { palmar: 19, dorsal: 9 },
    { palmar: 17, dorsal: 11 },
  ],
  /** Root-ring shift of least total shear on the gate identities, preserved from the physical network. */
  shift: -2,
  /** Published longitudinal share of a digit's texture chart taken by its bridge. */
  bridge: 0.1,
  /** Digit branch order around the distal palm. */
  fingers: [
    "Index",
    "Middle",
    "Ring",
    "Little",
  ] as readAutoMovieHumanHand.IFinger[],
};

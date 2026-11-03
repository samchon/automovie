/**
 * An ear's chord and roots at a height, in the left frame `[x, z]`: where the
 * head's outline meets the ear's front and back faces, and the two ends of the
 * ear's chord across the section.
 */
export interface IAutoMovieHumanHeadRoots {
  /** The front root: the outline's index, its point and the tangent toward the ear. */
  front: [number, P2, P2];

  /** The back root, shifted behind the front by the root gap: index, point and tangent. */
  back: [number, P2, P2];

  /** The chord's rim end, at the helix. */
  rim: P2;

  /** The chord's tip end, at the front of the ear. */
  tip: P2;
}

/** A point of a section. */
type P2 = [number, number];

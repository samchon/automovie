/**
 * The dorsal arch over one metacarpal: the back of the hand's skin over a
 * metacarpal shaft in a section square to the hand, its own piece with the
 * metacarpal's own axis.
 *
 * The palm's section is a ring about the hand's axis in the plane
 * `(b, c)`, `b` across the hand toward the thumb and `c` through it toward
 * the palm. Over each of the four finger metacarpals the dorsal skin is an
 * arc of a circle about that metacarpal's axis, the circle of the bone plus
 * the dorsal soft tissue; between two neighbouring metacarpals the arcs meet
 * in the interosseous valley (`AutoMovieHumanInterosseousValley`). The
 * circle's radius is `BONE_SHARE` of the finger's skin half width at its root
 * plus {@link TISSUE} mm of dorsal tissue.
 *
 * Both numbers are CONVENTIONS, written so a published bone cross-section can
 * replace them: the repository holds the metacarpals' lengths (Reddy 2024)
 * and not their cross-sections, and the plan's packing rule gives each
 * finger's skin width within the hand breadth.
 */
export namespace AutoMovieHumanMetacarpalArch {
  /** The metacarpal shaft's half width over the finger root's skin half width: a convention. */
  export const BONE_SHARE: number = 0.55;

  /** Dorsal tissue over the bone, mm: a convention (skin, tendon and fascia). */
  export const TISSUE: number = 3;

  /** An arch's fixed inputs. */
  export interface IInput {
    /** The metacarpal axis's place in the section, `[b, c]`, mm. */
    centre: [number, number];

    /** The finger root's skin half width, mm. */
    root: number;
  }

  /**
   * The arch's circle radius, mm.
   *
   * @param input The arch's inputs.
   */
  export function radius(input: IInput): number {
    return BONE_SHARE * input.root + TISSUE;
  }

  /**
   * Points of the dorsal arc between two angles about the metacarpal axis,
   * angle 0 toward the thumb along `b` and increasing toward the back of the
   * hand (`-c`).
   *
   * @param input The arch's inputs.
   * @param from First angle, radians.
   * @param to Last angle, radians.
   * @param count Points, at least 2.
   */
  export function arc(input: IInput, from: number, to: number, count: number): [number, number][] {
    const r: number = radius(input);
    return Array.from({ length: count }, (_: unknown, k: number): [number, number] => {
      const a: number = from + ((to - from) * k) / (count - 1);
      return [input.centre[0] + r * Math.cos(a), input.centre[1] - r * Math.sin(a)];
    });
  }
}

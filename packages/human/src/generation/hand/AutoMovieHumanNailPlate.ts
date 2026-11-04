/**
 * The nail plate: a thin curved plate on the dorsal side of the distal
 * phalanx, its own piece in its own frame.
 *
 * The plate's frame is not the bone's: its origin is the centre of the
 * plate's root, its `along` the direction of the nail bed (the bone's
 * direction tilted toward the palm by the tilt of the distal phalanx's
 * dorsal surface, which the pad's thickness at the tip raises), its `normal`
 * the dorsal normal of that surface, its `across` completing the frame. On
 * the plate, `u` runs from the root (0) to the free edge (1) and `v` across it
 * from the radial edge (-1) to the ulnar edge (1):
 *
 * ```text
 * p(u, v) = origin + L u along + (W / 2) v across
 *           + (sag (1 - v^2) + lift u^2) normal
 * ```
 *
 * a parabolic transverse arch of rise `sag` (the plate is more curved across
 * than along), and a free edge that lifts by `lift` over the plate's length.
 * It lies on the dorsal sector of the distal phalanx: its origin and normal
 * come from that sector's surface at the plate's root, so the plate sits on
 * the skin by construction and the nail folds' windows (`AutoMovieHumanNailFold`)
 * cover its root and sides.
 *
 * The plate's dimensions are CONVENTIONS, not measurements: the repository and
 * the reference sampling hold no nail source (`docs/anatomy/hand.md`, Open
 * questions). The length is {@link LENGTH_SHARE} of the distal phalanx's
 * length, the width {@link WIDTH_SHARE} of the section's full width there,
 * the arch {@link SAG_SHARE} of the plate's width, the lift {@link LIFT_SHARE}
 * of its length. A source or a read of the references' tip sections replaces
 * them in the quality phase.
 */
export namespace AutoMovieHumanNailPlate {
  /** Plate length over the distal phalanx's length: a convention (adult nails run about half). */
  export const LENGTH_SHARE: number = 0.55;

  /** Plate width over the section's full width at the root: a convention. */
  export const WIDTH_SHARE: number = 0.8;

  /** Transverse rise over the plate's width: a convention. */
  export const SAG_SHARE: number = 0.1;

  /** Free-edge lift over the plate's length: a convention. */
  export const LIFT_SHARE: number = 0.05;

  /** A plate's fixed inputs. */
  export interface IInput {
    /** The centre of the plate's root on the dorsal skin, mm. */
    origin: [number, number, number];

    /** Unit direction of the nail bed. */
    along: [number, number, number];

    /** Unit dorsal normal of the skin at the root. */
    normal: [number, number, number];

    /** Length of the distal phalanx, mm. */
    phalanx: number;

    /** Full width of the section at the plate's root, mm. */
    width: number;
  }

  /** A plate's derived dimensions, mm. */
  export interface ISize {
    /** Length root to free edge. */
    length: number;

    /** Width edge to edge. */
    width: number;

    /** Transverse rise. */
    sag: number;

    /** Free-edge lift. */
    lift: number;
  }

  /**
   * The plate's dimensions.
   *
   * @param input The plate's inputs.
   */
  export function size(input: IInput): ISize {
    const length: number = LENGTH_SHARE * input.phalanx;
    const width: number = WIDTH_SHARE * input.width;
    return { length, width, sag: SAG_SHARE * width, lift: LIFT_SHARE * length };
  }

  /**
   * The unit direction across the plate, the third axis of its frame.
   *
   * @param input The plate's inputs.
   */
  export function across(input: IInput): [number, number, number] {
    const a: [number, number, number] = input.normal;
    const b: [number, number, number] = input.along;
    const c: [number, number, number] = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const l: number = Math.hypot(c[0], c[1], c[2]) || 1;
    return [c[0] / l, c[1] / l, c[2] / l];
  }

  /**
   * A point of the plate.
   *
   * @param input The plate's inputs.
   * @param u Along the plate, 0 at the root and 1 at the free edge.
   * @param v Across it, -1 to 1.
   */
  export function point(input: IInput, u: number, v: number): [number, number, number] {
    const s: ISize = size(input);
    const e: [number, number, number] = across(input);
    const rise: number = s.sag * (1 - v * v) + s.lift * u * u;
    return [0, 1, 2].map(
      (k: number): number => input.origin[k]! + s.length * u * input.along[k]! + (s.width / 2) * v * e[k]! + rise * input.normal[k]!,
    ) as [number, number, number];
  }
}

import { AutoMovieHumanHandWindow } from "./AutoMovieHumanHandWindow";

const { bump }: typeof AutoMovieHumanHandWindow = AutoMovieHumanHandWindow;

/**
 * The interosseous valley: the groove on the back of the hand between two
 * neighbouring metacarpals, where the dorsal interosseous muscles lie
 * lower than the bones' arches, its own piece with the axis running between
 * the two metacarpals.
 *
 * It lowers the skin between two arches (`AutoMovieHumanMetacarpalArch`) by
 * `DEPTH_SHARE` of the arches' radius over a window across the hand centred
 * halfway between the two axes, of half width the distance between the axes
 * over two. It grows along the hand from nothing at the wrist to its full
 * depth at the knuckles, as the metacarpal heads stand proud: the depth
 * follows `bump` of the share along the metacarpal.
 *
 * The share is a CONVENTION: the back of a relaxed hand shows the valleys
 * between the tendons, their depth a few millimetres, unread in the
 * references.
 */
export namespace AutoMovieHumanInterosseousValley {
  /** Valley depth over the arches' radius: a convention. */
  export const DEPTH_SHARE: number = 0.25;

  /** A valley's fixed inputs. */
  export interface IInput {
    /** The two metacarpal axes' places across the hand, mm, the thumb side first. */
    between: [number, number];

    /** The arches' radius, mm. */
    radius: number;
  }

  /**
   * How far the skin sinks into the valley at a place across the hand and a
   * share along the metacarpal, mm toward the palm.
   *
   * @param input The valley's inputs.
   * @param b Place across the hand, mm.
   * @param along Share of the way along the metacarpal, 0 at its base and 1 at its head.
   */
  export function depth(input: IInput, b: number, along: number): number {
    const mid: number = (input.between[0] + input.between[1]) / 2;
    const half: number = Math.abs(input.between[0] - input.between[1]) / 2;
    const ramp: number = Math.min(1, Math.max(0, along));
    return DEPTH_SHARE * input.radius * ramp * ramp * (3 - 2 * ramp) * bump((b - mid) / half).value;
  }
}

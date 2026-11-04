import { AutoMovieHumanHandWindow } from "./AutoMovieHumanHandWindow";

const { bump }: typeof AutoMovieHumanHandWindow = AutoMovieHumanHandWindow;

/**
 * The digital flexion creases: the grooves across the palmar side of a
 * finger where the skin folds when the joints bend, each its own window along
 * the line with its own across-the-finger axis.
 *
 * Loci are Bridgman 1920's (conventional, `docs/anatomy/hand.md`, Joint
 * centres and creases): of a finger's four palmar creases the first lies
 * short of the distal joint, the second opposite the middle joint, the third
 * halfway between the middle and the basal joints, and the fourth opposite
 * the basal knuckle (the palmar web, Gray 1918, reaches the middle of the
 * proximal phalanx, so the fourth reads on the palm). A groove is a declared
 * curvature break: it is a G1 seam with the palmar sector it cuts, so a
 * piece reads it as a window with a named floor and not as a smoothed dent.
 *
 * Only the palmar side carries a crease; the dorsal skin wrinkles instead
 * (`docs/anatomy/hand.md`, Form) and has no groove piece.
 */
export namespace AutoMovieHumanDigitCrease {
  /** Groove depth as a share of the palmar depth at the crease: a convention until the creases are read on f1's palmar loops. */
  export const DEPTH_SHARE: number = 0.06;

  /** Half width of the groove along the line as a share of the nearest joint radius: a convention. */
  export const WIDTH_SHARE: number = 0.2;

  /** A crease's fixed inputs. */
  export interface IInput {
    /** Arc length of the crease along the digit's line, mm. */
    at: number;

    /** The palmar depth of the section there, mm. */
    palmar: number;

    /** The nearest joint's radius, mm. */
    radius: number;
  }

  /**
   * The creases' arc lengths along a finger from its joints, by Bridgman's
   * rule.
   *
   * @param joints Arc lengths of the finger's MCP, PIP and DIP along its line, mm.
   * @returns The four creases' arc lengths, distal first.
   */
  export function loci(joints: readonly [number, number, number]): [number, number, number, number] {
    const [mcp, pip, dip] = joints;
    return [dip - 0.15 * (dip - pip), pip, (pip + mcp) / 2, mcp];
  }

  /**
   * How far the skin sinks into the groove at arc length `s`, mm, toward the
   * bone.
   *
   * @param input The crease.
   * @param s Arc length along the line, mm.
   */
  export function depth(input: IInput, s: number): number {
    return DEPTH_SHARE * input.palmar * bump((s - input.at) / (WIDTH_SHARE * input.radius)).value;
  }
}

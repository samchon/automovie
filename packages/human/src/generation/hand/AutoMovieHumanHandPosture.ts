import type { IAutoMovieHumanHandFingerPosture } from "./IAutoMovieHumanHandFingerPosture";
import type { IAutoMovieHumanHandThumbPosture } from "./IAutoMovieHumanHandThumbPosture";

/**
 * The bind's relaxed hand: a pose convention of the captured standing
 * posture, not a shape and not a clinical zero. The straightened neutral, not
 * this posture, is the measuring pose; the posture only says where the bind's
 * bones lie so the skin is lofted on them.
 *
 * Every number here is an observation or a convention, marked as such, and
 * none is fitted to any person's length, width or residual. They are shared
 * by every body.
 */
export namespace AutoMovieHumanHandPosture {
  /**
   * The fingers, index to little, in degrees. OBSERVED on the four reference
   * bodies along each finger's own sections, one shared value per joint, with
   * PIP and DIP placed by Buryanov and Kotiuk 2010's shares of the web-to-tip
   * length (`docs/anatomy/hand.md`, Capture posture). Holding one person out
   * moves a flexion or spread by at most 3.8 degrees and a DIP by up to 7.8.
   * The DIPs rest slightly extended (negative), so the active-flexion coupling
   * of DIP to two thirds of PIP does not describe this posture.
   */
  export const FINGERS: IAutoMovieHumanHandFingerPosture = {
    proximal: [19.6, 12.8, 21.1, 35.4],
    spread: [3, -0.8, -12.8, -12.9],
    pip: [9.3, 23.9, 18.5, 6],
    dip: [-3.3, -6.9, -7.6, -7.6],
  };

  /**
   * The thumb's phalanges as `[spread, flexion]` in degrees in the hand's
   * frame on its knuckles. CONVENTION from the shared hand form's own thumb,
   * kept for the consumers that read the bind's thumb in the hand's frame;
   * the thumb's bones are posed by {@link thumbRest} on its own metacarpal.
   */
  export const THUMB: IAutoMovieHumanHandThumbPosture = {
    proximal: [2.8, 35.6],
    distal: [1.8, 23.8],
  };

  /** Flexion ranges, degrees, AAOS (`docs/anatomy/joint-range.md`): finger MCP, finger PIP, thumb MCP, thumb IP. */
  export const RANGE: { fingerMcp: number; fingerPip: number; thumbMcp: number; thumbIp: number } = {
    fingerMcp: 80,
    fingerPip: 90,
    thumbMcp: 50,
    thumbIp: 80,
  };

  /**
   * The thumb's resting flexion at its two joints, degrees, each about its
   * own bone toward the palm: the relaxed hand rests every digit at the same
   * share of its joints' ranges, so the thumb's MCP and IP take the fingers'
   * observed mean resting share of their MCP and PIP ranges ({@link FINGERS}
   * over {@link RANGE}, four reference bodies) times their own ranges. The
   * one reference thumb walked alone (f1) reads its proximal phalanx at about
   * 22 degrees from the hand's axis; a single reading is no rule, so it is a
   * check and not an input.
   */
  export function thumbRest(): { mcp: number; ip: number } {
    const mean = (v: readonly number[]): number => v.reduce((s: number, x: number): number => s + x, 0) / v.length;

    return {
      mcp: (mean(FINGERS.proximal) / RANGE.fingerMcp) * RANGE.thumbMcp,
      ip: (mean(FINGERS.pip) / RANGE.fingerPip) * RANGE.thumbIp,
    };
  }
}

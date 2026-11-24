import type {
  IAutoMovieHumanHandFingerPosture,
  IAutoMovieHumanHandPosture,
  IAutoMovieHumanHandThumbPosture,
} from "@automovie/interface";

/**
 * The bind's digit directions, transferred from the public CC0 MakeHuman HM08
 * rig in its own hand frame. Straightened measuring lengths determine the
 * segment lengths independently of the bind.
 */
export namespace AutoMovieHumanHandPosture {
  /**
   * HM08's left rig, index to little, in degrees. Spread and proximal flexion
   * resolve the first phalanx in the wrist-and-knuckle frame. The following
   * turns are projected toward the palm in each incoming bone's frame. The
   * public asset transfer describes one authored neutral posture.
   */
  export const FINGERS: IAutoMovieHumanHandFingerPosture = {
    proximal: [5.6, 2.3, 1.4, 11.2],
    spread: [9.4, -6.5, -15.9, -19.9],
    pip: [11.0, 11.2, 12.1, 7.9],
    dip: [1.9, -0.1, -0.4, 1.5],
  };

  /**
   * Thumb directions in the hand frame, obtained by turning HM08's metacarpal
   * toward the palm by the projected angles in {@link thumbRest}.
   */
  export const THUMB: IAutoMovieHumanHandThumbPosture = {
    proximal: [44.7, 23.7],
    distal: [44.7, 25.1],
  };

  /**
   * Flexion ranges, degrees, AAOS (`docs/anatomy/joint-range.md`): finger MCP,
   * finger PIP, thumb MCP, thumb IP.
   */
  export const RANGE: IAutoMovieHumanHandPosture.IRange = {
    fingerMcp: 80,
    fingerPip: 90,
    thumbMcp: 50,
    thumbIp: 80,
  };

  /**
   * The HM08 thumb's MCP and IP turns toward the palm, in degrees from each
   * incoming segment.
   */
  export function thumbRest(): IAutoMovieHumanHandPosture.IThumbRestResult {
    return { mcp: 4.8, ip: 1.5 };
  }
}

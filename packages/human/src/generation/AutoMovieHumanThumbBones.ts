import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanArmPrior,
  IAutoMovieHumanHandDigit,
  IAutoMovieHumanHandFinger,
  IAutoMovieHumanHandFrame,
  IAutoMovieHumanHandJoints,
  IAutoMovieHumanHandScales,
  IAutoMovieHumanThumbBones,
} from "@automovie/interface";

import { AutoMovieHumanArmPrior } from "./AutoMovieHumanArmPrior";
import { AutoMovieHumanHandDigitBones } from "./AutoMovieHumanHandDigitBones";
import { AutoMovieHumanHandPosture } from "./AutoMovieHumanHandPosture";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";

const { sub, plus, scale, norm, unit, dot }: typeof AutoMovieHumanHandVector =
  AutoMovieHumanHandVector;
const { onBones }: typeof AutoMovieHumanHandDigitBones =
  AutoMovieHumanHandDigitBones;

/**
 * The thumb on its bones, the fingers' structure with the thumb's own
 * joints: from its root at the web along its metacarpal to its
 * metacarpophalangeal joint, then its proximal phalanx and its distal phalanx
 * with the tip.
 *
 * The thumb length input runs from the MCP to the tip and splits at Buryanov
 * and Kotiuk 2010 Table I's proximal share
 * (`AutoMovieHumanArmPrior.PRIOR.hand.thumbProximal`, 0.536), a measured
 * value. The metacarpal runs from the carpometacarpal joint (placed at the
 * trapezium, a convention of the hand's joints) through the MCP. The two
 * phalanges' directions follow the metacarpal through the joints' resting
 * flexion (`AutoMovieHumanHandPosture.thumbRest`: the fingers' observed
 * resting share of their ranges applied to the thumb's AAOS ranges).
 */
export namespace AutoMovieHumanThumbBones {
  /**
   * Build the thumb's bones and skin law.
   *
   * @param d The thumb's law in the hand form's axes.
   * @param joints The hand's joints, left frame, mm.
   * @param hand The hand's solved scales, with the thumb length.
   * @param map The hand's map from the form's axes to the left frame.
   */
  export function of(
    d: IAutoMovieHumanHandDigit,
    joints: IAutoMovieHumanHandJoints,
    hand: IAutoMovieHumanHandScales,
    map: IAutoMovieHumanThumbBones.OfMap,
  ): IAutoMovieHumanHandFinger {
    const prior: IAutoMovieHumanArmPrior.IHandPrior =
      AutoMovieHumanArmPrior.PRIOR.hand;
    const root: AutoMovieVector3Tuple = map(d.centre);
    const mcp: AutoMovieVector3Tuple = joints.mcps[0]!;
    const frame: IAutoMovieHumanHandFrame = joints.frame!;
    const lead: number = norm(sub(mcp, root));
    const metacarpal: AutoMovieVector3Tuple = unit(sub(mcp, joints.cmc));

    // Each phalanx follows the bone before it, turned toward the palm by its
    // joint's resting flexion (`AutoMovieHumanHandPosture.thumbRest`), as a
    // finger's phalanges follow theirs.
    const rest: { mcp: number; ip: number } =
      AutoMovieHumanHandPosture.thumbRest();
    const d1: AutoMovieVector3Tuple = bend(metacarpal, frame.palmar, rest.mcp);
    const d2: AutoMovieVector3Tuple = bend(d1, frame.palmar, rest.ip);
    const p1: number = prior.thumbProximal * hand.thumb;

    const out: IAutoMovieHumanHandFinger = onBones(
      d,
      root,
      [
        { direction: metacarpal, length: lead },
        { direction: d1, length: p1 },
        { direction: d2, length: hand.thumb - p1 },
      ],
      0,
      [lead, lead + p1],
      hand,
    );
    return { ...out, external: hand.thumb };
  }

  /*
   * A direction turned toward the palm, square to itself, by degrees.
   */
  function bend(
    dir: AutoMovieVector3Tuple,
    palmar: AutoMovieVector3Tuple,
    degrees: number,
  ): AutoMovieVector3Tuple {
    const n: AutoMovieVector3Tuple = unit(
      sub(palmar, scale(dir, dot(palmar, dir))),
    );
    const r: number = (degrees * Math.PI) / 180;

    return unit(plus(scale(dir, Math.cos(r)), scale(n, Math.sin(r))));
  }
}

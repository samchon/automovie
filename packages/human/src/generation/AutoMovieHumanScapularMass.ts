import type { IAutoMovieLoftRelief } from "@automovie/engine";
import { AutoMovieHumanTrunkFeatureFrame } from "./AutoMovieHumanTrunkFeatureFrame";
import { AutoMovieHumanTrunkFeatureProfile } from "./AutoMovieHumanTrunkFeatureProfile";
import { AutoMovieHumanTrunkReliefNet } from "./AutoMovieHumanTrunkReliefNet";
import type { IAutoMovieHumanTrunkFeature } from "./IAutoMovieHumanTrunkFeature";

/**
 * The scapula and the muscles on it (supraspinatus, infraspinatus, teres)
 * standing on the back's rounded envelope: the blade lies on the ribs from the
 * second to the seventh rib, its medial border some way from the spinous line
 * and its lateral border at the posterior axillary fold (Gray 1918), so the
 * back between the two blades is the base's own flat. The mass is its own
 * piece in its own frame, centred on the back wall at the axilla's height,
 * its axis the wall's outward normal there, merged by a relief window whose
 * height is at least zero (`AutoMovieHumanSeamUnion.bump`), and the right
 * window is the left's reflection (rule J6).
 */
export namespace AutoMovieHumanScapularMass {
  /** The footprint's medial share of the half width: the blade's medial border. Conventional, flagged. */
  export const MEDIAL: number = 0.25;

  /** The footprint's outer share of the half width: the blade's lateral border at the posterior axillary fold. Conventional, flagged. */
  export const OUTER: number = 0.8;

  /** The footprint's reach below the centre, a share of the crotch-to-cervicale span: down to the inferior angle at the seventh rib. Conventional, flagged. */
  export const LOWER: number = 0.11;

  /** The footprint's reach above the centre, the same share basis: up to the superior angle at the second rib. Conventional, flagged. */
  export const UPPER: number = 0.09;

  /** The mass's projection over the envelope at its centre, mm. Conventional, flagged: no published skin relief of the blade is on the record. */
  export const PROJECTION: number = 4;

  /** What the mass reads. */
  export interface IInput {
    /** The back wall's point at the centre's lateral place, `[x, y, z]`, mm. */
    centre: AutoMovieHumanTrunkFeatureFrame.V3;

    /** The wall's section tangent there in `[x, z]`, in the direction of rising phase (back: z falling). */
    tangent: [number, number];

    /** The section's half width at the centre's height, mm. */
    width: number;

    /** The crotch-to-cervicale span, mm. */
    span: number;

    /** The base's phase at a lateral place on the back at the centre's height. */
    phaseOf: (z: number) => number;

    /** The trunk's base surface. */
    base: AutoMovieHumanTrunkReliefNet.Base;

    /** Height the window must stay under, mm: the shoulders' top less a clearance. */
    ceiling: number;
  }

  /**
   * The left mass as a feature.
   *
   * @param input The centre, the wall's tangent and the sizes.
   * @returns The mass as a height field.
   */
  export function feature(input: IInput): IAutoMovieHumanTrunkFeature {
    // The tangent turned a quarter back points backward and outward on the back wall.
    const frame: AutoMovieHumanTrunkFeatureFrame.IFrame = AutoMovieHumanTrunkFeatureFrame.create(input.centre, [input.tangent[1], 0, -input.tangent[0]]);
    const half: number = ((OUTER - MEDIAL) / 2) * input.width;
    const lower: number = LOWER * input.span;
    const upper: number = Math.max(1, Math.min(UPPER * input.span, input.ceiling - input.centre[1]));

    return {
      frame,
      height: (u: number, v: number): number => PROJECTION * AutoMovieHumanTrunkFeatureProfile.bump(AutoMovieHumanTrunkFeatureProfile.rho(u, v, half, lower, upper)),
      reach: { u: [-half, half], v: [-lower, upper] },
      apex: [0, 0],
    };
  }

  /**
   * Both masses' windows.
   *
   * @param input The centre, the wall's tangent and the sizes.
   * @returns The left and the right window.
   */
  export function create(input: IInput): IAutoMovieLoftRelief[] {
    const mass: IAutoMovieHumanTrunkFeature = feature(input);
    const o: [number, number, number] = mass.frame.origin;
    const stations: [number, number] = [o[1] + mass.reach.v[0], o[1] + mass.reach.v[1]];

    // On the back the phase falls as the lateral place rises.
    const lateralOf = (u: number): number => o[2] + u * mass.frame.lateral[2];
    const edges: number[] = [input.phaseOf(lateralOf(mass.reach.u[0])), input.phaseOf(lateralOf(mass.reach.u[1]))];
    const phases: [number, number] = [Math.min(...edges), Math.max(...edges)];
    const apex: [number, number] = [
      (o[1] - stations[0]) / (stations[1] - stations[0]),
      (input.phaseOf(o[2]) - phases[0]) / (phases[1] - phases[0]),
    ];
    const left: IAutoMovieLoftRelief = AutoMovieHumanTrunkReliefNet.fromFeature("trunk.scapula.left", mass, { stations, phases, apex }, input.base);

    return [left, AutoMovieHumanTrunkReliefNet.mirror(left, "trunk.scapula.right")];
  }
}

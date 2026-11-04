import type { AutoMovieSolidVector } from "@automovie/engine";
import type { AutoMovieHumanSiteViewPart } from "./AutoMovieHumanSiteViewPart";
import { AutoMovieHumanWalkPart } from "./AutoMovieHumanWalkPart";
import { AutoMovieHumanJointTurn } from "./AutoMovieHumanJointTurn";

type Vec3 = AutoMovieSolidVector.Vec3;

/**
 * A digit (a finger, the thumb, a toe) as one walk over its phalanges
 * (#3049, #3051): straight along each phalanx at the neutral pose, its
 * interphalangeal joints C2 turns of one axis, its tip a G2 dome, its base
 * inside the palm or the forefoot it merges onto.
 *
 * Knots stand at every joint and at every phalanx's middle, the sites a
 * digit's breadth and depth are published at or read between (the joints'
 * breadths and depths, the shafts between), the base being the digit's
 * proximal joint (the knuckle) inside its host, so the merge trims the
 * digit's own root. Each knot's breadth and depth are the caller's laws
 * by site; the section's dorsal and palmar (or plantar) edges split the depth
 * about the bone by the caller's dorsal share, and the two side edges split
 * the breadth evenly about the bone (a phalanx's cross-section is symmetric
 * about its own median plane to the precision of the published breadths,
 * which are taken across it). A joint's half depth defines the minimum
 * axis bend radius; JointTurn converts it and the actual angle into the
 * engine's half arclength. Radius and arclength are different quantities.
 */
export namespace AutoMovieHumanDigitWalk {
  /** A digit's laws at one site. */
  export interface ISiteLaw {
    /** Whole breadth across the digit, mm. */
    breadth: number;

    /** Whole depth from the dorsal to the palmar or plantar skin, mm. */
    depth: number;

    /** The dorsal share of the depth above the bone's axis, in `(0, 1)`. */
    dorsal: number;

    /** The sourced conic shoulder of the section there. */
    shoulder: number;
    /** Optional original edge jets in the digit's normalized source parameter. */
    jets?: AutoMovieHumanSiteViewPart.ISite["jets"];
  }

  /** What a digit is built from. */
  export interface IInput {
    /** Chain name, such as `finger.left.index` or `toe.left.1`. */
    name: string;

    /** The joint centres from the base (the knuckle, inside the host) to the distal phalanx's end: base, then each interphalangeal joint, then the end, at least three. */
    centres: Vec3[];

    /** The dorsal direction on the first phalanx. */
    dorsal: Vec3;

    /** The pulp's reach past the distal phalanx's end to the tip, mm. */
    tip: number;
    /** Optional closed-span scalar bounds in this digit's material chart. */
    ranges?: AutoMovieHumanSiteViewPart.IInput["ranges"];

    /** The laws at a site: `base`, `joint <k>` (k from 1, the first joint after the base), `shaft <k>` (the middle of bone k from 0), `end`. */
    law(site: string): ISiteLaw;

    /** Control points and ring phases of each section, a multiple of 4. */
    order: number;

    /** Widest spacing between layers, mm. */
    gap: number;
  }

  /**
   * Build and loft the digit.
   *
   * @param input The centres, the laws and the tip.
   * @returns The part, its loft and the diagnostics.
   */
  export function create(input: IInput): AutoMovieHumanSiteViewPart.IResult {
    const bones: number = input.centres.length - 1;
    const box = (law: ISiteLaw): [number, number, number, number] => [law.depth * law.dorsal, law.breadth / 2, -law.depth * (1 - law.dorsal), -law.breadth / 2];
    const site = (name: string, bone: number, share: number, law: ISiteLaw): AutoMovieHumanWalkPart.ISite => ({ site: name, bone, share, edges: box(law), fullness: { shoulder: law.shoulder }, ...(law.jets === undefined ? {} : { jets: law.jets }) });

    // The base (the knuckle, inside the host); then each bone's middle and
    // its distal joint; the end is the distal phalanx's end.
    const sites: AutoMovieHumanWalkPart.ISite[] = [];
    for (let b: number = 0; b < bones; b++) {
      sites.push(site(`shaft ${b}`, b, 0.5, input.law(`shaft ${b}`)));
      sites.push(b + 1 < bones ? site(`joint ${b + 1}`, b + 1, 0, input.law(`joint ${b + 1}`)) : site("end", b, 1, input.law("end")));
    }

    // The same radius produces a shorter turn at a smaller anatomical angle.
    const joints: { half: number }[] = Array.from({ length: bones - 1 }, (_: unknown, k: number): { half: number } => ({ half: AutoMovieHumanJointTurn.half(input.centres[k]!, input.centres[k + 1]!, input.centres[k + 2]!, input.law(`joint ${k + 1}`).depth / 2) }));
    return AutoMovieHumanWalkPart.create({
      name: input.name,
      centres: input.centres,
      joints,
      u: input.dorsal,
      sites,
      ...(input.ranges === undefined ? {} : { ranges: input.ranges }),
      tip: input.tip,

      // The knuckle closes in a dome inside the palm or the forefoot.
      base: true,
      order: input.order,
      samples: input.order,
      gap: input.gap,
    });
  }
}

import type {
  AutoMovieHumanSex as AutoMovieHumanSexType,
  AutoMovieVector3Tuple,
  IAutoMovieHandAnthropometry,
  IAutoMovieHumanDigitWalk,
} from "@automovie/interface";

import { AutoMovieHumanDigitJoints } from "./AutoMovieHumanDigitJoints";
import { AutoMovieHumanArmInterim } from "./AutoMovieHumanArmInterim";

/**
 * The digits' walks from their published joints. Each finger and the thumb
 * takes its breadth and tape at its two joints nearest the tip
 * (`AutoMovieHumanDigitJoints`, Rastgoo Balov et al. 2026, scaled by the
 * person's hand length). Its depth there is the one whose inscribed ellipse
 * with that breadth runs the tape (`AutoMovieHumanArmInterim.ellipseDepth`).
 *
 * The joint nearer the knuckle (the proximal interphalangeal joint, the
 * thumb's metacarpophalangeal joint) holds from the base to that joint, the
 * shaft between the two joints takes their mean, and the joint nearest the
 * tip (the distal interphalangeal joint, the thumb's interphalangeal joint)
 * holds to the end. No source splits a digit's depth about its bone, so the
 * split is even, and the section is the ellipse's conic. The tip stands half
 * the end's depth past the last centre, a dome's reach.
 *
 * The toes take theirs from the forefoot (`AutoMovieHumanFootInterim.toes`).
 */
export namespace AutoMovieHumanDigitInterim {
  /** The sites of a three-bone digit walk, by the joint law each takes. */
  const SITES: Readonly<Record<string, "near" | "mean" | "far">> = {
    base: "near",
    "shaft 0": "near",
    "joint 1": "near",
    "shaft 1": "mean",
    "joint 2": "far",
    "shaft 2": "far",
    end: "far",
  };

  /**
   * A finger's or the thumb's walk.
   *
   * @param name The chain name.
   * @param centres The joints from the knuckle (or thumb CMC) followed by the declared skin apex. The terminal centre is set back by the cap reach once.
   * @param dorsal The back of the hand's direction.
   * @param sex The person's sex.
   * @param handLength The person's hand length, world mm.
   * @param digit 1 (thumb) to 5 (little).
   * @param scale Calibration millimetres per world millimetre.
   * @returns The walk's input.
   */
  export function finger(
    name: string,
    centres: AutoMovieVector3Tuple[],
    dorsal: AutoMovieVector3Tuple,
    sex: AutoMovieHumanSexType,
    handLength: number,
    digit: 1 | 2 | 3 | 4 | 5,
    scale: number,
  ): IAutoMovieHumanDigitWalk.IInput {
    const law = (joint: 1 | 2): IAutoMovieHumanDigitWalk.ISiteLaw => {
      const j: IAutoMovieHandAnthropometry.IJoint =
        AutoMovieHumanDigitJoints.at(sex, handLength, digit, joint);
      const breadth: number = j.breadth * scale;
      return {
        breadth,
        depth: AutoMovieHumanArmInterim.ellipseDepth(breadth, j.girth * scale),
        dorsal: 0.5,
        shoulder: Math.SQRT2 - 1,
      };
    };
    const near: IAutoMovieHumanDigitWalk.ISiteLaw = law(2);
    const far: IAutoMovieHumanDigitWalk.ISiteLaw = law(1);
    const tip: AutoMovieVector3Tuple = centres.at(-1)!;
    const previous: AutoMovieVector3Tuple = centres.at(-2)!;
    const length: number = Math.hypot(
      tip[0] - previous[0],
      tip[1] - previous[1],
      tip[2] - previous[2],
    );
    const reach: number = far.depth / 2;
    if (!(length > reach))
      throw new Error(
        `The declared ${name} apex leaves no distal centre before its cap`,
      );
    const end: AutoMovieVector3Tuple = [0, 1, 2].map(
      (axis: number): number =>
        tip[axis]! - ((tip[axis]! - previous[axis]!) * reach) / length,
    ) as AutoMovieVector3Tuple;
    return walk(name, [...centres.slice(0, -1), end], dorsal, near, far);
  }

  /**
   * A digit's walk from its two joint laws.
   *
   * @param name The chain name.
   * @param centres The centres from the base to the tip.
   * @param dorsal The digit's back direction.
   * @param near The law at the joint nearer the base.
   * @param far The law at the joint nearer the tip.
   * @returns The walk's input.
   */
  export function walk(
    name: string,
    centres: AutoMovieVector3Tuple[],
    dorsal: AutoMovieVector3Tuple,
    near: IAutoMovieHumanDigitWalk.ISiteLaw,
    far: IAutoMovieHumanDigitWalk.ISiteLaw,
  ): IAutoMovieHumanDigitWalk.IInput {
    const mean: IAutoMovieHumanDigitWalk.ISiteLaw =
      near === far
        ? near
        : {
            breadth: (near.breadth + far.breadth) / 2,
            depth: (near.depth + far.depth) / 2,
            // Interpolate absolute dorsal/plantar edges, not their depth ratios.
            // In particular a shared standing plantar edge must remain unchanged.
            dorsal:
              (near.depth * near.dorsal + far.depth * far.dorsal) /
              (near.depth + far.depth),
            shoulder: (near.shoulder + far.shoulder) / 2,
            ...(near.jets !== undefined && near.jets === far.jets
              ? { jets: near.jets }
              : {}),
          };
    return {
      name,
      centres,
      dorsal,
      tip: far.depth / 2,
      law: (site: string): IAutoMovieHumanDigitWalk.ISiteLaw => {
        const kind: "near" | "mean" | "far" = SITES[site] ?? "far";
        return kind === "near" ? near : kind === "mean" ? mean : far;
      },
      order: 64,
      gap: 1,
    };
  }
}

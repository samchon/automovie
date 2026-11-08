import type { AutoMovieLoftContract, IAutoMovieViewPart } from "@automovie/engine";
import type { AutoMovieConstructionNode, IAutoMovieConstructionJoin } from "@automovie/interface";

import { AutoMovieHumanBodyTree } from "../AutoMovieHumanBodyTree";
import { AutoMovieHumanUpperArmForm } from "./AutoMovieHumanUpperArmForm";

/**
 * The arm with its dome joined onto the trunk's S00 by the body's join tree
 * (`AutoMovieHumanBodyTree`): the trunk's view part is the host, the arm's
 * the part, both bound as millimetre source leaves, and the fold is one merge
 * node the engine traces, blends (rolling fold, G2) and trims.
 *
 * Parameter: the arm's phase, the tree's own. The dome's pole stands on the
 * humerus axis at the acromion level, inside S00, whose lateral guide passes
 * through the acromion landmark (about 8 mm lateral of the axis there: GH is
 * 6 mm medial of the acromion, Campbell 2009, and the contact abduction turns
 * the axis above GH medially), so every meridian of the arm leaves S00 once
 * and the loop wraps the arm's axis. With the pole outside S00 the footprint
 * pinched around the pole and no parameter traced it.
 *
 * Seed: the arm's medial meridian (chart phase pi; the chart's u is lateral)
 * searched over the arm's station shares from half the humeral head's station
 * to the axilla level's, where it leaves S00 once: the axilla vault.
 *
 * Radius: a crease rolls the skin over its own subcutaneous layer, so the
 * fold's rolling radius is that layer's thickness. At the axilla the two
 * sides are the medial upper arm at its upper third (Maruyama, Iizuka and
 * Yoshida 1991 Table 2, line J, level 14: women 7.72, men 3.73 mm) and the
 * chest's mid-axillary line at the scapula's inferior angle (line C, level 5:
 * women 5.93, men 4.99 mm), averaged.
 *
 * Cap: the widest chord either side is half the acromion-to-axilla height
 * (the shoulder port's half height), so the shoulder's rails cannot reach the
 * neck above or the elbow below.
 */
export namespace AutoMovieHumanArmShoulderJoin {
  /** Maruyama 1991 Table 2, mid-axillary line C at level 5, fat with skin, mm. */
  export const CHEST_FAT: Readonly<Record<"female" | "male", number>> = { female: 5.93, male: 4.99 };

  /** The join's trace limits, the body lane's (`AutoMovieHumanBodyLane`): 64 points per turn, 1e-6 mm, asin(0.01). */
  export const LIMITS: Omit<AutoMovieHumanBodyTree.ILimits, "gap"> = { count: 64, tolerance: 1e-6, grazing: Math.asin(0.01) };

  /** The join's inputs, calibration mm. */
  export interface IInput {
    /** The trunk's S00 view part (the host). */
    trunk: IAutoMovieViewPart;

    /** The arm's view part with its dome (the part). */
    arm: IAutoMovieViewPart;

    /** The arm's station of the humeral head (GH) and of the axilla level, and its pole-to-pole length, mm. */
    stations: { head: number; axilla: number; length: number };

    /** Acromion-to-axilla height, mm. */
    shoulder: number;

    /** Whether the person is a woman. */
    female: boolean;

    /** Widest spacing between a blend's rows and the skin's chord, mm. */
    gap: number;
  }

  /** The realized join. */
  export interface IOutput {
    /** The realized chains (trunk, arm, blend) and the trimmed body. */
    tree: AutoMovieHumanBodyTree.IOutput;

    /** The fold as requested. */
    fold: AutoMovieHumanBodyTree.IFold;

    /** Every broken premise, the engine's trace and blend included. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /** The fold's rolling radius, mm. */
  export function radius(female: boolean): number {
    const arm: number = AutoMovieHumanUpperArmForm.FAT[female ? "female" : "male"].medial[0];
    return (arm + CHEST_FAT[female ? "female" : "male"]) / 2;
  }

  /**
   * The arm's fold onto the trunk, the one owner of its seed and width laws:
   * the part is the arm's source leaf named by its view part, the host face
   * the trunk's view part by name, the seed searched on the arm's medial
   * meridian (phase pi) from half the humeral head's station share to the
   * axilla level's, the rolling radius `radius(female)` and the cap half the
   * acromion-to-axilla height. The host subtree is the caller's: `create`
   * joins onto the trunk's source leaf, a whole-body tree onto the subtree it
   * has built.
   *
   * @param input The join's inputs without the blend's row spacing.
   * @returns The fold record `AutoMovieHumanBodyTree.join` reads.
   */
  export function fold(input: Omit<IInput, "gap">): AutoMovieHumanBodyTree.IFold {
    return {
      part: { type: "source", name: input.arm.name, source: input.arm.name },
      partFace: input.arm.name,
      hostFace: input.trunk.name,
      search: { phase: Math.PI, from: input.stations.head / 2 / input.stations.length, to: input.stations.axilla / input.stations.length },
      radius: radius(input.female),
      cap: input.shoulder / 2,
    };
  }

  /** Join the arm onto the trunk's source leaf and realize it. */
  export function create(input: IInput): IOutput {
    const host: AutoMovieConstructionNode = { type: "source", name: input.trunk.name, source: input.trunk.name };
    const folded: AutoMovieHumanBodyTree.IFold = fold(input);
    const limits: AutoMovieHumanBodyTree.ILimits = { ...LIMITS, gap: input.gap };
    const node: IAutoMovieConstructionJoin = AutoMovieHumanBodyTree.join(host, folded, limits);
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const tree: AutoMovieHumanBodyTree.IOutput = AutoMovieHumanBodyTree.realize(
      `shoulder.${input.arm.name}`,
      node,
      limits,
      diagnostics,
      new Map<string, IAutoMovieViewPart>([
        [input.trunk.name, input.trunk],
        [input.arm.name, input.arm],
      ]),
    );
    return { tree, fold: folded, diagnostics };
  }
}

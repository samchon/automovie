import type { IAutoMovieLoftChain } from "@automovie/engine";
import type { AutoMovieConstructionNode } from "@automovie/interface";

import type { IAutoMovieHumanParameters } from "../../structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanEar } from "../../structures/head/IAutoMovieHumanEar";
import type { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import { AutoMovieHumanBodyAnatomy } from "../AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../AutoMovieHumanBodyLaw";
import { AutoMovieHumanEarPlace } from "../AutoMovieHumanEarPlace";
import { AutoMovieHumanFacePlan } from "../AutoMovieHumanFacePlan";
import { AutoMovieHumanHeadArcs } from "../AutoMovieHumanHeadArcs";
import type { AutoMovieHumanHeadConstruction } from "../AutoMovieHumanHeadConstruction";
import { AutoMovieHumanHeadLandmarks } from "../AutoMovieHumanHeadLandmarks";
import { AutoMovieHumanHeadPass } from "../AutoMovieHumanHeadPass";
import type { IAutoMovieHumanHeadBuilt } from "../IAutoMovieHumanHeadBuilt";
import { AutoMovieHumanHeadComposer } from "./AutoMovieHumanHeadComposer";
import { AutoMovieHumanHeadTree } from "./AutoMovieHumanHeadTree";

/**
 * The head lane as the figure consumes it: the head's construction subtree
 * (`AutoMovieHumanHeadTree`) from the person's inputs, with the fold the body
 * joins it by. The head mass's neck stretch opens at the neck ring chain's
 * lowest layer, inside the trunk; the body merges the head mass onto the
 * trunk there, searching the head mass's front station line upward from its
 * open bottom.
 *
 * The skeleton is the head pass's first build on the neck ring
 * (`AutoMovieHumanHeadPass.build` with no corrections), the tragion at its
 * published drop, each auricle's top at its published height and the face
 * plan's exponent from the inputs, as the head's debug piece and the view
 * comparison read it.
 */
export namespace AutoMovieHumanHeadLane {
  /** The head subtree and the fold that joins it to the body. */
  export interface IOutput {
    /** The head's subtree, metres. */
    root: AutoMovieConstructionNode;

    /** The head's face the body meets. */
    face: string;

    /** The seed's search on that face: its phase and the shares of its station range. */
    search: { phase: number; from: number; to: number };

    /** The fold's rolling radius, mm: the neck tape's radius. */
    radius: number;

    /** The widest chord either side, mm: half the neck tape's radius. */
    cap: number;
  }

  /**
   * The head lane of a person.
   *
   * @param params The person's inputs.
   * @param neckChain The neck ring chain under the head, whose lowest layer the head mass's neck opens at.
   * @returns The subtree and its fold.
   */
  export function create(params: IAutoMovieHumanParameters, neckChain: IAutoMovieLoftChain): IOutput {
    const inputs: AutoMovieHumanHeadConstruction.IInputs = AutoMovieHumanBodyLaw.headInputs(params);
    const built: IAutoMovieHumanHeadBuilt = AutoMovieHumanHeadPass.build(AutoMovieHumanHeadPass.prepare(neckChain, inputs), AutoMovieHumanHeadLandmarks.NONE);
    const sex: AutoMovieHumanSex = AutoMovieHumanBodyAnatomy.sexOf(params);
    const k: number = built.plan.scale;
    const tragion: number = built.plan.vertex - AutoMovieHumanHeadArcs.tragionDrop(inputs.head, sex) * k;
    const top = (ear: IAutoMovieHumanEar): number => tragion + AutoMovieHumanEarPlace.aboveTragion(ear, sex) * k;
    const composed: AutoMovieHumanHeadComposer.IOutput = AutoMovieHumanHeadComposer.compose(built.plan, inputs.head.earPair, neckChain, {
      tragion,
      ears: { left: top(inputs.head.earPair.left), right: top(inputs.head.earPair.right) },
      faceExponent: AutoMovieHumanFacePlan.exponent(inputs.head, sex),
    });
    const radius: number = built.plan.neck.radius;
    return {
      root: AutoMovieHumanHeadTree.of(composed).root,
      face: "head.mass",
      search: { phase: 0, from: 0, to: SEARCH },
      radius,
      cap: radius / 2,
    };
  }

  /** Share of the head mass's station range the body's seed is searched up to: the neck's stretch. */
  export const SEARCH: number = 0.3;
}

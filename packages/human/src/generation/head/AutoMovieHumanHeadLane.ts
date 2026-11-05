import type { AutoMovieLoftFrame, IAutoMovieLoftChain, IAutoMovieViewPart } from "@automovie/engine";
import type { AutoMovieConstructionNode } from "@automovie/interface";

import type { IAutoMovieHumanHermiteCurve } from "../../lofting/IAutoMovieHumanHermiteCurve";
import type { IAutoMovieHumanEar } from "../../structures/head/IAutoMovieHumanEar";
import type { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import { AutoMovieHumanEarPlace } from "../AutoMovieHumanEarPlace";
import { AutoMovieHumanFacePlan } from "../AutoMovieHumanFacePlan";
import { AutoMovieHumanHeadArcs } from "../AutoMovieHumanHeadArcs";
import type { AutoMovieHumanHeadConstruction } from "../AutoMovieHumanHeadConstruction";
import { AutoMovieHumanHeadLandmarks } from "../AutoMovieHumanHeadLandmarks";
import { AutoMovieHumanHeadPass } from "../AutoMovieHumanHeadPass";
import type { IAutoMovieHumanHeadBuilt } from "../IAutoMovieHumanHeadBuilt";
import { AutoMovieHumanHeadComposer } from "./AutoMovieHumanHeadComposer";
import { AutoMovieHumanHeadDome } from "./AutoMovieHumanHeadDome";
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

    /** The lip colour boundary, round both lips' bases. */
    vermilion: IAutoMovieHumanHermiteCurve;

    /** The widest chord either side, mm: half the neck tape's radius. */
    cap: number;
  }

  /**
   * The head lane of a person.
   *
   * @param inputs The head construction's inputs (`AutoMovieHumanBodyLaw.headInputs`).
   * @param sex The person's sex.
   * @param neckChain The neck ring chain under the head, whose lowest layer the head mass's neck opens at.
   * @returns The subtree and its fold.
   */
  export function create(inputs: AutoMovieHumanHeadConstruction.IInputs, sex: AutoMovieHumanSex, neckChain: IAutoMovieLoftChain): IOutput {
    const built: IAutoMovieHumanHeadBuilt = AutoMovieHumanHeadPass.build(AutoMovieHumanHeadPass.prepare(neckChain, inputs), AutoMovieHumanHeadLandmarks.NONE);
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
      vermilion: vermilion(composed),
    };
  }

  /** Share of the head mass's station range the body's seed is searched up to: the neck's stretch. */
  export const SEARCH: number = 0.3;

  /** Points round each lip's half of the boundary. */
  export const BORDER: number = 16;

  /**
   * The vermilion border from the lips' view parts: the upper lip's base
   * ellipse over its top from one mouth corner to the other, then the lower
   * lip's under its bottom back, each point at the lip's contact station,
   * as Hermite spans whose derivatives are the neighbours' central
   * differences per millimetre of chord. Empty when either lip is missing.
   */
  function vermilion(composed: AutoMovieHumanHeadComposer.IOutput): IAutoMovieHumanHermiteCurve {
    const out: IAutoMovieHumanHermiteCurve = { name: "vermilion", chain: "head.mass", closed: true, spans: [] };
    const lip = (name: string): AutoMovieHumanHeadComposer.IPlaced | undefined =>
      composed.parts.find((p: AutoMovieHumanHeadComposer.IPlaced): boolean => p.feature.part.name === name);
    const upper: AutoMovieHumanHeadComposer.IPlaced | undefined = lip("lip.upper");
    const lower: AutoMovieHumanHeadComposer.IPlaced | undefined = lip("lip.lower");
    if (upper === undefined || lower === undefined) return out;
    const half = (placed: AutoMovieHumanHeadComposer.IPlaced, from: number, to: number): [number, number, number][] => {
      const part: IAutoMovieViewPart = placed.feature.part;
      const station: number = placed.feature.contact + (part.stations[AutoMovieHumanHeadDome.STEM] ?? 0);
      const frame: AutoMovieLoftFrame.IFrame = part.axis.at(station);
      const a: number = part.front.positive.knots[0]!.value;
      const b: number = part.side.positive.knots[0]!.value;
      return Array.from({ length: BORDER }, (_: unknown, k: number): [number, number, number] => {
        const t: number = from + ((to - from) * k) / BORDER;
        const u: number = a * Math.cos(t);
        const v: number = b * Math.sin(t);
        return [frame.origin[0] + u * frame.u[0] + v * frame.v[0], frame.origin[1] + u * frame.u[1] + v * frame.v[1], frame.origin[2] + u * frame.u[2] + v * frame.v[2]];
      });
    };
    const points: [number, number, number][] = [...half(upper, 0, Math.PI), ...half(lower, Math.PI, 2 * Math.PI)];
    const n: number = points.length;
    const chord = (i: number, j: number): number => Math.hypot(points[j]![0] - points[i]![0], points[j]![1] - points[i]![1], points[j]![2] - points[i]![2]);
    const slope = (i: number): [number, number, number] => {
      const p: [number, number, number] = points[(i - 1 + n) % n]!;
      const q: [number, number, number] = points[(i + 1) % n]!;
      const l: number = Math.max(1e-9, chord((i - 1 + n) % n, (i + 1) % n));
      return [(q[0] - p[0]) / l, (q[1] - p[1]) / l, (q[2] - p[2]) / l];
    };
    for (let i: number = 0; i < n; i++) {
      const j: number = (i + 1) % n;
      out.spans.push({ address: `vermilion.${i}`, interval: Math.max(1e-6, chord(i, j)), start: points[i]!, end: points[j]!, startDerivative: slope(i), endDerivative: slope(j) });
    }
    return out;
  }
}

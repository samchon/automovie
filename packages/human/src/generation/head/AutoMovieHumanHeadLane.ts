import { type AutoMovieLoftFrame, type IAutoMovieViewPart } from "@automovie/engine";
import type { AutoMovieConstructionNode } from "@automovie/interface";

import type { IAutoMovieHumanHermiteCurve } from "../../lofting/IAutoMovieHumanHermiteCurve";
import type { IAutoMovieHumanEar } from "../../structures/head/IAutoMovieHumanEar";
import type { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanHeadInputs } from "../IAutoMovieHumanHeadInputs";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import type { AutoMovieHumanNeckSource } from "../AutoMovieHumanNeckSource";
import { AutoMovieHumanEarPlace } from "../AutoMovieHumanEarPlace";
import { AutoMovieHumanFacePlan } from "../AutoMovieHumanFacePlan";
import { AutoMovieHumanHeadArcs } from "../AutoMovieHumanHeadArcs";
import { AutoMovieHumanHeadMedianProfile } from "../AutoMovieHumanHeadMedianProfile";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadAnchors } from "./AutoMovieHumanHeadAnchors";
import { AutoMovieHumanHeadLayout } from "./AutoMovieHumanHeadLayout";
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
 * The layout reads the neck's generating curves, with the tragion at its
 * published drop, each auricle's top at its own published height and the
 * face plan's exponent from the supplied inputs. Globe frames use the same
 * profile/recess seat as the tree's orbit cutters; they are records until
 * the eye module supplies its globe and lid parts.
 *
 * @evidence contracts/common.md#principled-implementation Places the tree, joints, globe frames and attachment sites from one anatomical layout and its generating neck and head axes.
 * @evidence contracts/common.md#clear-and-simple-design Owns the head subtree and the records the body and appearance actually consume; no second head assembly is built.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves both sides' own eye and ear inputs and uses the same construction without a person branch.
 * @evidence contracts/common.md#meaningful-documentation States the tree boundary, units and the distinction between globe records and the pending eye parts.
 * @evidence contracts/performance.md#efficient-algorithms Constructs each bare head view once and the tree once, without old radial skin, ear-event or jaw assembly.
 * @evidence contracts/performance.md#reuse-equivalent-work The lane's layout supplies its parts, skeleton references, globe records and attachment publication.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned tree, source definitions/raw lofts and small records until releasing that definition; profile observation samples remain call-local and no Human global cache retains them.
 */
export namespace AutoMovieHumanHeadLane {
  /** The head subtree and the fold that joins it to the body. */
  export interface IOutput {
    /** The head's subtree, metres. */
    root: AutoMovieConstructionNode;

    /** The same composed source object used to make root; studies remain explicitly outside that tree. */
    source: AutoMovieHumanHeadComposer.IOutput;

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

    /** The neck and head joint references of this lane, calibration mm. */
    skeleton: ISkeleton;

    /** Globe frames from the same profile/recess definition as the tree's orbit cutters, calibration mm. */
    eyes: IAutoMovieHumanBodyCalibration.IEye[];

    /** Attachment sites on this lane's generating profile and planned eye margins. */
    landmarks: IAutoMovieHumanBodyCalibration.IHeadLandmarks;

    /** Crown height in calibration mm. */
    stature: number;
  }

  /**
   * Joint references from the lane's generating neck and head axis. The head
   * joint lies between the ears at their tragion height; it is not read from
   * a second set of head or ear chains.
   *
   * @evidence contracts/common.md#principled-implementation Neck base is the original neck source's bottom mean, crown is the head mass's top axis and the head joint is on that same axis at the tragion height.
   * @evidence contracts/common.md#clear-and-simple-design A fixed-size record gives the skeleton actual lane references without publishing old head chains.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The same generating axes serve every head and both sides.
   * @evidence contracts/common.md#meaningful-documentation States calibration units, joint convention and which generating curves own the points.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data type has no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Readers share one lane's record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The lane output owns four fixed-size fields.
   */
  export interface ISkeleton {
    /** Original neck source's bottom mean, mm; not a named base-tape point. */
    neckBase: [number, number, number];

    /** Head mass's axis at the midpoint of the ears' tragia, mm. */
    occiput: [number, number, number];

    /** Head mass's crown pole, mm. */
    crown: [number, number, number];

    /** Neck tape radius in calibration mm. */
    neckRadius: number;
  }

  /**
   * The head lane of a person.
   *
   * @param inputs The head construction's inputs (`AutoMovieHumanBodyLaw.headInputs`).
   * @param sex The person's sex.
   * @param neck The pure generating source shared with the transitional trunk adapter; its bottom mean locates the head mass's internal overlap.
   * @returns The subtree and its fold.
   *
   * @evidence contracts/common.md#principled-implementation Consumes the analytic neck layout, applies the same published tragion, ear-top and face-fullness laws as the debug consumers, and seats globes on the orbit cutters' profile/recess definition.
   * @evidence contracts/common.md#clear-and-simple-design Returns the head tree together with the small records needed by actual body, skeleton and appearance consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Each eye and ear reads its own dimensions. The measured old-to-new eye displacement is a deliberate definition change, not an output-preserving optimization.
   * @evidence contracts/common.md#meaningful-documentation Names the consumed input context and records, their calibration units and the pending eye-part boundary.
   * @evidence contracts/performance.md#efficient-algorithms Builds one layout and one set of bare view lofts; the body's engine realization remains the single composed skin.
   * @evidence contracts/performance.md#reuse-equivalent-work One plan and one seat supply both globe records and attachment readers without rebuilding an old head.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned source intentionally retains its raw views, authoritative declarations and lofts for inspection; these and the tree, lip curve and records share the caller's definition lifetime.
   */
  export function create(inputs: IAutoMovieHumanHeadInputs, sex: AutoMovieHumanSex, neck: AutoMovieHumanNeckSource.IOutput): IOutput {
    const plan: IAutoMovieHumanHeadLayout = AutoMovieHumanHeadLayout.create(neck, inputs);
    const k: number = plan.scale;
    const tragion: number = plan.vertex - AutoMovieHumanHeadArcs.tragionDrop(inputs.head, sex) * k;
    const top: (ear: IAutoMovieHumanEar) => number = (ear: IAutoMovieHumanEar): number => tragion + AutoMovieHumanEarPlace.aboveTragion(ear, sex) * k;
    const composed: AutoMovieHumanHeadComposer.IOutput = AutoMovieHumanHeadComposer.compose(plan, inputs.head.earPair, neck.bottom[1], {
      tragion,
      ears: { left: top(inputs.head.earPair.left), right: top(inputs.head.earPair.right) },
      faceExponent: AutoMovieHumanFacePlan.exponent(inputs.head, sex),
    });
    const radius: number = plan.neck.radius;

    // The orbit floor and these globes share one nasion-profile seat. The
    // old radial skin's solved seat differed from the tree's actual socket.
    const face: AutoMovieHumanHeadPrior.IFace = AutoMovieHumanHeadPrior.PRIOR.face;
    const seat: number = AutoMovieHumanHeadMedianProfile.profileAt(plan, plan.nasion) - face.eyeRecess * k;
    const eyes: IAutoMovieHumanBodyCalibration.IEye[] = (["left", "right"] as const).map((side: "left" | "right"): IAutoMovieHumanBodyCalibration.IEye => ({
      side,
      centre: [seat - face.marginForward * k, plan.eye + face.globeRise * k, (side === "left" ? 1 : -1) * plan[side].place],
      radius: face.radius * k,
    }));
    return {
      root: AutoMovieHumanHeadTree.of(composed).root,
      source: composed,
      face: "head.mass",
      search: { phase: 0, from: 0, to: SEARCH },
      radius,
      cap: radius / 2,
      vermilion: vermilion(composed),
      eyes,
      landmarks: AutoMovieHumanHeadAnchors.of(plan, eyes),
      stature: plan.vertex,
      skeleton: {
        neckBase: [neck.bottom[0], neck.bottom[1], neck.bottom[2]],
        occiput: composed.massPart.axis.at(tragion).origin,
        crown: composed.massPart.axis.at(composed.massPart.stations[composed.massPart.stations.length - 1]!).origin,
        neckRadius: radius,
      },
    };
  }

  /**
   * World height of the adopted posterior C7 point, mm. The generating
   * nonplanar ring closes its mean separately from this named anchor.
   *
   * @evidence contracts/common.md#principled-implementation Uses the layout's resolved named cervicale point, not the mean of its nonplanar generating ring.
   * @evidence contracts/common.md#clear-and-simple-design Gives the body one scalar boundary without invoking the old assembly.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No person-dependent correction or alternate height.
   * @evidence contracts/common.md#meaningful-documentation States world millimetres and distinguishes the posterior point from a section mean.
   * @evidence contracts/performance.md#efficient-algorithms Constant-time arithmetic through the shared layout helper.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the layout's definition rather than duplicating its coefficients.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one number and retains no state.
   */
  export function seat(inputs: IAutoMovieHumanHeadInputs): number {
    return AutoMovieHumanHeadLayout.seat(inputs);
  }

  /** Share of the head mass's station range the body's seed is searched up to: the neck's stretch. */
  export const SEARCH: number = 0.3;

  /**
   * The colour border reads the upper source's front-positive knot points
   * from one corner to the other, then the lower's front-negative points
   * back. The appearance Hermite spans use neighbouring chord differences;
   * this approximation is not the engine source's exact continuous curve.
   * Empty when either source lip is missing.
   */
  function vermilion(composed: AutoMovieHumanHeadComposer.IOutput): IAutoMovieHumanHermiteCurve {
    const out: IAutoMovieHumanHermiteCurve = { name: "vermilion", chain: "head.mass", closed: true, spans: [] };
    const lip = (name: string): AutoMovieHumanHeadComposer.IPlaced | undefined =>
      composed.parts.find((p: AutoMovieHumanHeadComposer.IPlaced): boolean => p.feature.part.name === name);
    const upper: AutoMovieHumanHeadComposer.IPlaced | undefined = lip("lip.upper");
    const lower: AutoMovieHumanHeadComposer.IPlaced | undefined = lip("lip.lower");
    if (upper === undefined || lower === undefined) return out;
    const half: (placed: AutoMovieHumanHeadComposer.IPlaced, upper: boolean) => [number, number, number][] = (placed: AutoMovieHumanHeadComposer.IPlaced, upper: boolean): [number, number, number][] => {
      const part: IAutoMovieViewPart = placed.feature.part;
      return (upper ? part.front.positive : part.front.negative).knots.map((k: IAutoMovieViewPart.IKnot): [number, number, number] => {
        const frame: AutoMovieLoftFrame.IFrame = part.axis.at(k.station);
        return [frame.origin[0] + k.value * frame.u[0], frame.origin[1] + k.value * frame.u[1], frame.origin[2] + k.value * frame.u[2]];
      });
    };
    const points: [number, number, number][] = [...half(upper, true), ...half(lower, false).reverse().slice(1, -1)];
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

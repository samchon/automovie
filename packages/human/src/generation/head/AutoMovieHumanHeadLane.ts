import {
  type AutoMovieLoftFrame,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type { AutoMovieConstructionNode } from "@automovie/interface";

import type { IAutoMovieHumanHermiteCurve } from "../../lofting/IAutoMovieHumanHermiteCurve";
import type { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import { AutoMovieHumanHeadMedianProfile } from "../AutoMovieHumanHeadMedianProfile";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import type { AutoMovieHumanNeckSource } from "../AutoMovieHumanNeckSource";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanHeadInputs } from "../IAutoMovieHumanHeadInputs";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadAnchors } from "./AutoMovieHumanHeadAnchors";
import { AutoMovieHumanHeadComposer } from "./AutoMovieHumanHeadComposer";
import { AutoMovieHumanHeadLayout } from "./AutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadNeckScalars } from "./AutoMovieHumanHeadNeckScalars";
import { AutoMovieHumanHeadOriginalSources } from "./AutoMovieHumanHeadOriginalSources";
import { AutoMovieHumanHeadPose } from "./AutoMovieHumanHeadPose";
import { AutoMovieHumanHeadTree } from "./AutoMovieHumanHeadTree";

/**
 * The head lane as the figure consumes it: the head's construction subtree
 * (`AutoMovieHumanHeadTree`) from the person's inputs and its shared regular
 * neck boundary. The head mass and trunk consume that original boundary
 * before lofting; the body continues their open ends without a search or
 * a hidden overlap. Retained fold metadata serves existing lane readers.
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
  /**
   * Canonical original material and records, before regional composition.
   *
   * @evidence contracts/common.md#principled-implementation Body and head consumers borrow the same actual mass/neck and records derived from its closed layout.
   * @evidence contracts/common.md#clear-and-simple-design The complete lane adds only its regional tree, source collection and lip colour curve.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This source stage is not a fallback or a successful partial head tree.
   * @evidence contracts/common.md#meaningful-documentation Requires the same immutable invocation inputs; all records retain calibration-mm meanings.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidence contracts/performance.md#reuse-equivalent-work Full creation reuses the identical canonical source and records without rebuilding them.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the base, records and transitive source dependencies.
   */
  export interface IPrepared extends Omit<
    IOutput,
    "root" | "source" | "vermilion"
  > {
    /** Actual canonical mass and neck, without any regional face source. */
    source: AutoMovieHumanHeadComposer.IBase;

    /** The same selected laws used for the mass and the regional builders. */
    places: AutoMovieHumanHeadComposer.IPlaces;

    /**
     * Call-owned lazy original definitions, independent of complete realization.
     *
     * @evidence contracts/common.md#principled-implementation The actual regional builders borrow the identical canonical mass and selected placement context.
     * @evidence contracts/common.md#clear-and-simple-design One definition supplies selected-original observation and complete creation.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed original attempts stay explicit and no substitute part or successful partial tree is manufactured.
     * @evidence contracts/common.md#meaningful-documentation Includes valid originals, actual parent/source references, attempt failures and separate existing studies; creates no regional loft.
     * @evidence contracts/performance.md#efficient-algorithms Empty requests and unknown-name admission construct no source. Exact top-level requests author only selected factories; their result lists/maps take O(selected sources) to publish. A first complete or known nested/ear request retains the existing whole-catalogue costs; the completed definition itself is subsequently reused.
     * @evidence contracts/performance.md#reuse-equivalent-work Selected and complete requests reuse identical authored top-level objects and the paired lip contact. Selected definition containers are rebuilt; complete creation borrows the retained complete definition and source map.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Only this immutable invocation retains its original definitions and callbacks; no global registry is added.
     */
    originals(
      names?: readonly string[],
    ): AutoMovieHumanHeadComposer.IDefinition;
  }

  /**
   * The complete head subtree, its source context and shared records.
   *
   * @evidence contracts/common.md#principled-implementation The tree and records share one canonical mass/neck preparation; actual sources remain available to the body's realization context.
   * @evidence contracts/common.md#clear-and-simple-design Separates source stage, tree operators, raw composition and appearance/skeleton records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A complete result is not published after a failed regional original; neither source presence nor raw loft establishes final skin success.
   * @evidence contracts/common.md#meaningful-documentation Fields state calibration-mm records, metre operator rules and the independent study boundary.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidence contracts/performance.md#reuse-equivalent-work The prepared source and records are retained unchanged by both body and head consumers.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the tree, map, original-source dependencies, raw lofts and records until releasing the definition.
   */
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
   * @evidence contracts/common.md#principled-implementation Neck base is on the actual mass axis at the original lower overlap height, crown is the head mass's top axis and the head joint is on that same axis at the tragion height.
   * @evidence contracts/common.md#clear-and-simple-design A fixed-size record gives the skeleton actual lane references without publishing old head chains.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The same generating axes serve every head and both sides.
   * @evidence contracts/common.md#meaningful-documentation States calibration units, joint convention and which generating curves own the points.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data type has no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Readers share one lane's record.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The lane output owns four fixed-size fields.
   */
  export interface ISkeleton {
    /** Actual generating mass axis at the lower overlap height, mm; not a named base-tape point. */
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
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned source intentionally retains actual millimetre parts, invocation map and raw lofts; these and the tree, lip curve and canonical records share the caller's definition lifetime.
   */
  export function create(
    inputs: IAutoMovieHumanHeadInputs,
    sex: AutoMovieHumanSex,
    neck: AutoMovieHumanNeckSource.IOutput,
    prepared?: IPrepared,
  ): IOutput {
    const canonical: IPrepared = prepared ?? prepare(inputs, sex, neck);
    const composed: AutoMovieHumanHeadComposer.IOutput =
      AutoMovieHumanHeadComposer.compose(
        canonical.source.closed().tape.plan,
        inputs.head.earPair,
        neck.bottom[1],
        canonical.places,
        canonical.source,
        canonical.originals(),
      );
    return {
      root: AutoMovieHumanHeadTree.of(composed).root,
      source: composed,
      face: canonical.face,
      search: canonical.search,
      radius: canonical.radius,
      cap: canonical.cap,
      vermilion: vermilion(composed),
      eyes: canonical.eyes,
      landmarks: canonical.landmarks,
      stature: canonical.stature,
      skeleton: canonical.skeleton,
    };
  }

  /**
   * Prepare the exact material source and body/appearance records first.
   *
   * @evidence contracts/common.md#principled-implementation The public layout and selected tragion, ear-top and face-fullness laws prepare the canonical mass; the same closed plan supplies all records.
   * @evidence contracts/common.md#clear-and-simple-design Independent body observations need no regional face source or complete head tree.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No regional failure is hidden or replaced, and source preparation claims no completed merge or head skin.
   * @evidence contracts/common.md#meaningful-documentation Inputs are the immutable invocation reused by create; calibration-mm sources remain distinct from metre operators.
   * @evidence contracts/performance.md#efficient-algorithms One layout and mass preparation plus constant-size records; no regional part or final body realization occurs.
   * @evidence contracts/performance.md#reuse-equivalent-work A later create borrows these exact sources and records without rebuilding mass or neck.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the source, records and fixed-size placement context; no global cache is added.
   */
  export function prepare(
    inputs: IAutoMovieHumanHeadInputs,
    sex: AutoMovieHumanSex,
    neck: AutoMovieHumanNeckSource.IOutput,
    shared?: AutoMovieHumanHeadPose.IOutput,
  ): IPrepared {
    const pose: AutoMovieHumanHeadPose.IOutput =
      shared ?? AutoMovieHumanHeadPose.create(inputs, sex, neck);
    const layout: IAutoMovieHumanHeadLayout = pose.neck.layout;
    const places: AutoMovieHumanHeadComposer.IPlaces = pose.places;
    const tragion: number = places.tragion!;
    const source: AutoMovieHumanHeadComposer.IBase =
      AutoMovieHumanHeadComposer.prepare(
        layout,
        inputs.head.earPair,
        neck.bottom[1],
        places,
      );
    const originals: IPrepared["originals"] =
      AutoMovieHumanHeadOriginalSources.create(
        source,
        inputs.head.earPair,
        places,
      ).request;
    const plan: IAutoMovieHumanHeadLayout = source.layout;
    const face: AutoMovieHumanHeadPrior.IFace =
      AutoMovieHumanHeadPrior.PRIOR.face;
    const seat: number =
      AutoMovieHumanHeadMedianProfile.profileAt(plan, plan.nasion) -
      face.eyeRecess * plan.scale;
    const eyes: IAutoMovieHumanBodyCalibration.IEye[] = (
      ["left", "right"] as const
    ).map(
      (side: "left" | "right"): IAutoMovieHumanBodyCalibration.IEye => ({
        side,
        centre: [
          seat - face.marginForward * plan.scale,
          plan.eye + face.globeRise * plan.scale,
          (side === "left" ? 1 : -1) * plan[side].place,
        ],
        radius: face.radius * plan.scale,
      }),
    );
    return {
      source,
      places,
      originals,
      face: "head.mass",
      search: { phase: 0, from: 0, to: SEARCH },
      radius: plan.neck.radius,
      cap: plan.neck.radius / 2,
      eyes,
      landmarks: AutoMovieHumanHeadAnchors.of(plan, eyes),
      stature: plan.vertex,
      skeleton: {
        neckBase: AutoMovieHumanHeadNeckScalars.axis(source.layout.neck).point(
          neck.bottom[1],
        ),
        occiput: source.guides.axis.at(tragion).origin,
        crown: source.guides.axis.at(plan.vertex).origin,
        neckRadius: plan.neck.radius,
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

  /**
   * Existing share of the head-mass station range used by the body's neck-fold search.
   *
   * @evidence contracts/common.md#principled-implementation Bounds the existing intersection search on the actual head source.
   * @evidence contracts/common.md#clear-and-simple-design One explicit search policy supplies the lane record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This does not move a source, create contact or certify internal overlap.
   * @evidence contracts/common.md#meaningful-documentation Names its search-only, dimensionless role.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A scalar executes no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No preparation occurs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A scalar owns no resource.
   */
  export const SEARCH: number = 0.3;

  /**
   * The colour border reads the upper source's front-positive knot points
   * from one corner to the other, then the lower's front-negative points
   * back. The appearance Hermite spans use neighbouring chord differences;
   * this approximation is not the engine source's exact continuous curve.
   * Empty when either source lip is missing.
   */
  function vermilion(
    composed: AutoMovieHumanHeadComposer.IOutput,
  ): IAutoMovieHumanHermiteCurve {
    const out: IAutoMovieHumanHermiteCurve = {
      name: "vermilion",
      chain: "head.mass",
      closed: true,
      spans: [],
    };
    const lip = (
      name: string,
    ): AutoMovieHumanHeadComposer.IPlaced | undefined =>
      composed.parts.find(
        (p: AutoMovieHumanHeadComposer.IPlaced): boolean =>
          p.feature.part.name === name,
      );
    const upper: AutoMovieHumanHeadComposer.IPlaced | undefined =
      lip("lip.upper");
    const lower: AutoMovieHumanHeadComposer.IPlaced | undefined =
      lip("lip.lower");
    if (upper === undefined || lower === undefined) return out;
    const half: (
      placed: AutoMovieHumanHeadComposer.IPlaced,
      upper: boolean,
    ) => [number, number, number][] = (
      placed: AutoMovieHumanHeadComposer.IPlaced,
      upper: boolean,
    ): [number, number, number][] => {
      const part: IAutoMovieViewPart = placed.feature.part;
      return (upper ? part.front.positive : part.front.negative).knots.map(
        (k: IAutoMovieViewPart.IKnot): [number, number, number] => {
          const frame: AutoMovieLoftFrame.IFrame = part.axis.at(k.station);
          return [
            frame.origin[0] + k.value * frame.u[0],
            frame.origin[1] + k.value * frame.u[1],
            frame.origin[2] + k.value * frame.u[2],
          ];
        },
      );
    };
    const points: [number, number, number][] = [
      ...half(upper, true),
      ...half(lower, false).reverse().slice(1, -1),
    ];
    const n: number = points.length;
    const chord = (i: number, j: number): number =>
      Math.hypot(
        points[j]![0] - points[i]![0],
        points[j]![1] - points[i]![1],
        points[j]![2] - points[i]![2],
      );
    const slope = (i: number): [number, number, number] => {
      const p: [number, number, number] = points[(i - 1 + n) % n]!;
      const q: [number, number, number] = points[(i + 1) % n]!;
      const l: number = Math.max(1e-9, chord((i - 1 + n) % n, (i + 1) % n));
      return [(q[0] - p[0]) / l, (q[1] - p[1]) / l, (q[2] - p[2]) / l];
    };
    for (let i: number = 0; i < n; i++) {
      const j: number = (i + 1) % n;
      out.spans.push({
        address: `vermilion.${i}`,
        interval: Math.max(1e-6, chord(i, j)),
        start: points[i]!,
        end: points[j]!,
        startDerivative: slope(i),
        endDerivative: slope(j),
      });
    }
    return out;
  }
}

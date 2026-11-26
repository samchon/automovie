import type {
  AutoMovieHumanSex as AutoMovieHumanSexType,
  IAutoMovieHumanEyeSeat,
  IAutoMovieHumanHeadComposer,
  IAutoMovieHumanHeadInputs,
  IAutoMovieHumanHeadLane,
  IAutoMovieHumanHeadLayout,
  IAutoMovieHumanHeadPlacement,
  IAutoMovieHumanHeadPrior,
  IAutoMovieHumanHermiteCurve,
  IAutoMovieHumanNeckSource,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanHeadMedianProfile } from "../AutoMovieHumanHeadMedianProfile";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
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
    sex: AutoMovieHumanSexType,
    neck: IAutoMovieHumanNeckSource.IOutput,
    prepared?: IAutoMovieHumanHeadLane.IPrepared,
  ): IAutoMovieHumanHeadLane.IOutput {
    const canonical: IAutoMovieHumanHeadLane.IPrepared =
      prepared ?? prepare(inputs, sex, neck);
    const composed: IAutoMovieHumanHeadComposer.IOutput =
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
    sex: AutoMovieHumanSexType,
    neck: IAutoMovieHumanNeckSource.IOutput,
    shared?: IAutoMovieHumanHeadPlacement.IOutput,
  ): IAutoMovieHumanHeadLane.IPrepared {
    const pose: IAutoMovieHumanHeadPlacement.IOutput =
      shared ?? AutoMovieHumanHeadPose.create(inputs, sex, neck);
    const layout: IAutoMovieHumanHeadLayout = pose.neck.layout;
    const places: IAutoMovieHumanHeadComposer.IPlaces = pose.places;
    const tragion: number = places.tragion!;
    const source: IAutoMovieHumanHeadComposer.IBase =
      AutoMovieHumanHeadComposer.prepare(
        layout,
        inputs.head.earPair,
        neck.bottom[1],
        places,
      );
    const originals: IAutoMovieHumanHeadLane.IPrepared["originals"] =
      AutoMovieHumanHeadOriginalSources.create(
        source,
        inputs.head.earPair,
        places,
      ).request;
    const plan: IAutoMovieHumanHeadLayout = source.layout;
    const face: IAutoMovieHumanHeadPrior.IFace =
      AutoMovieHumanHeadPrior.PRIOR.face;
    const seat: number =
      AutoMovieHumanHeadMedianProfile.profileAt(plan, plan.nasion) -
      face.eyeRecess * plan.scale;
    const eyes: IAutoMovieHumanEyeSeat[] = (["left", "right"] as const).map(
      (side: "left" | "right"): IAutoMovieHumanEyeSeat => ({
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
    composed: IAutoMovieHumanHeadComposer.IOutput,
  ): IAutoMovieHumanHermiteCurve {
    const out: IAutoMovieHumanHermiteCurve = {
      name: "vermilion",
      chain: "head.mass",
      closed: true,
      spans: [],
    };
    const lip = (
      name: string,
    ): IAutoMovieHumanHeadComposer.IPlaced | undefined =>
      composed.parts.find(
        (p: IAutoMovieHumanHeadComposer.IPlaced): boolean =>
          p.feature.part.name === name,
      );
    const upper: IAutoMovieHumanHeadComposer.IPlaced | undefined =
      lip("lip.upper");
    const lower: IAutoMovieHumanHeadComposer.IPlaced | undefined =
      lip("lip.lower");
    if (upper === undefined || lower === undefined) return out;
    const half: (
      placed: IAutoMovieHumanHeadComposer.IPlaced,
      upper: boolean,
    ) => [number, number, number][] = (
      placed: IAutoMovieHumanHeadComposer.IPlaced,
      upper: boolean,
    ): [number, number, number][] => {
      const part: IAutoMovieViewPart = placed.feature.part;
      return (upper ? part.front.positive : part.front.negative).knots.map(
        (k: IAutoMovieViewPart.IKnot): [number, number, number] => {
          const frame: IAutoMovieLoftSectionFrame = part.axis.at(k.station);
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

import { type AutoMovieLoftContract, type AutoMovieLoftFrame, AutoMovieSolidDiff, AutoMovieSolidFoot, type AutoMovieSolidJoin, AutoMovieSolidMerge, AutoMovieViewLoft, type IAutoMovieLoftChain, type IAutoMovieSolidSurface, type IAutoMovieViewPart } from "@automovie/engine";
import { AutoMovieHumanSeamUnion } from "../../lofting/AutoMovieHumanSeamUnion";
import type { IAutoMovieHumanEar } from "../../structures/head/IAutoMovieHumanEar";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadDome } from "./AutoMovieHumanHeadDome";
import { AutoMovieHumanHeadEarParts } from "./AutoMovieHumanHeadEarParts";
import { AutoMovieHumanHeadFeatures } from "./AutoMovieHumanHeadFeatures";
import { AutoMovieHumanHeadInnerParts } from "./AutoMovieHumanHeadInnerParts";
import { AutoMovieHumanHeadMassPart } from "./AutoMovieHumanHeadMassPart";
import { AutoMovieHumanHeadMasses } from "./AutoMovieHumanHeadMasses";
import { AutoMovieHumanNeckPart } from "./AutoMovieHumanNeckPart";

/**
 * The head subtree composed by the three operators: the head mass lofted
 * from its views (`AutoMovieHumanHeadMassPart`), and every face part lofted
 * from its own (`AutoMovieHumanHeadFeatures`) and merged onto it or cut from
 * it (`AutoMovieSolidMerge`, `AutoMovieSolidDiff`), each join
 * seeded at the part's landmark and blended over the part's own size
 * (`AutoMovieHumanSeamUnion.width`: half the lesser of its height and its
 * least half extent).
 *
 * Every join is made against the bare head mass, so each part's curve and
 * blend are its own; where two parts' blends meet (the lips and the nose at
 * the subnasale) the corner is a setback the kernel closes. First pass:
 * compile-only, read by the debug sweep before it is wired into generation.
 */
export namespace AutoMovieHumanHeadComposer {
  /** A part with its loft and its join. */
  export interface IJoined {
    /** The part. */
    feature: AutoMovieHumanHeadFeatures.IFeature;

    /** Its loft. */
    loft: AutoMovieViewLoft.IResult;

    /** Its join to the head mass, or null when either surface or the seed is missing. */
    join: AutoMovieSolidJoin.IJoin | null;

    /** The join's seed, the part's and the host's chart points `[station, phase]`, mm and radians; absent when no join was traced. */
    seed?: { part: [number, number]; host: [number, number] };

    /** The blend's chord on both sides, mm; absent when no join was traced. */
    width?: number;
  }

  /** The composed head. */
  export interface IOutput {
    /** The head mass's loft. */
    mass: AutoMovieViewLoft.IResult;

    /** The head mass's view part, the root of its construction tree (`AutoMovieHumanHeadTree`). */
    massPart: IAutoMovieViewPart;

    /** The neck merged under the head mass, when its chain is given. */
    neck: IJoined | null;

    /** Every face part, lofted and joined. */
    parts: IJoined[];

    /** Every broken premise, by producer. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /** Heights the published laws give, calibration mm. */
  export interface IPlaces {
    /** The tragion's height, from its drop under the vertex (`AutoMovieHumanHeadArcs.tragionDrop`). */
    tragion?: number;

    /** Each auricle's top, from its height over the tragion (`AutoMovieHumanEarPlace.aboveTragion`). */
    ears?: { left: number; right: number };

    /** The face plan's super-ellipse exponent (`AutoMovieHumanFacePlan.exponent`). */
    faceExponent?: number;
  }

  /** Traced points per join. */
  export const COUNT: number = 64;

  /** Largest gap accepted on a join's curve, mm. */
  export const TOLERANCE: number = 0.05;

  /** Least angle between the two tangent planes along a join's curve, radians. */
  export const GRAZING: number = (5 * Math.PI) / 180;

  /**
   * Compose the head.
   *
   * @param skeleton The landmark skeleton, the vault exponent solved.
   * @param ears The two auricles' inputs, world mm.
   * @param neckChain The neck chain, whose bottom layer the neck part starts at inside the trunk; absent, no neck.
   * @param places Heights the published laws give, calibration mm; absent, the skeleton's own.
   */
  export function compose(
    skeleton: IAutoMovieHumanHeadLayout,
    ears: { left: IAutoMovieHumanEar; right: IAutoMovieHumanEar },
    neckChain?: IAutoMovieLoftChain,
    places?: IPlaces,
  ): IOutput {
    // The tragion at its published drop from the vertex, when given.
    const plan: IAutoMovieHumanHeadLayout =
      places?.tragion === undefined
        ? skeleton
        : { ...skeleton, landmarks: { ...skeleton.landmarks, tragion: [skeleton.landmarks.tragion[0], places.tragion] } };
    const massPart: IAutoMovieViewPart = AutoMovieHumanHeadMassPart.of(plan, places?.faceExponent);
    const mass: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(massPart);
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [...mass.diagnostics];

    // Parents before their inner parts, each joined to its parent's bare
    // surface.
    const surfaces: Map<string, IAutoMovieSolidSurface | null> = new Map([["head.mass", mass.surface]]);
    const features: AutoMovieHumanHeadFeatures.IFeature[] = [
      ...AutoMovieHumanHeadFeatures.of(plan),
      ...AutoMovieHumanHeadMasses.of(plan),
      ...AutoMovieHumanHeadEarParts.of(plan, ears, places?.ears),
      ...AutoMovieHumanHeadInnerParts.of(plan),
    ];
    const views: Map<string, IAutoMovieViewPart> = new Map([["head.mass", massPart]]);
    const parts: IJoined[] = features.map((placed: AutoMovieHumanHeadFeatures.IFeature): IJoined => {
      // The seed: the landmark's foot on the parent, from the chart point
      // the landmark stands over in the parent's own frame.
      const host: IAutoMovieSolidSurface | null = surfaces.get(placed.parent) ?? null;
      const parentView: IAutoMovieViewPart | undefined = views.get(placed.parent);
      const foot: AutoMovieSolidFoot.IFoot | null =
        host === null || parentView === undefined ? null : AutoMovieSolidFoot.of(host, placed.seed, chartOf(parentView, placed.seed), TOLERANCE);

      // The part stands on its parent's surface: moved by its landmark's
      // offset from that foot, since a landmark placed from the skeleton
      // (the midline profile at an off-midline part, a frame's guessed
      // place) lies in front of or behind the parent's actual skin.
      const feature: AutoMovieHumanHeadFeatures.IFeature =
        foot === null ? placed : { ...placed, part: moved(placed.part, sub(foot.point, placed.seed)), seed: [foot.point[0], foot.point[1], foot.point[2]] };
      const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(feature.part);
      diagnostics.push(...loft.diagnostics);
      surfaces.set(feature.part.name, loft.surface);
      views.set(feature.part.name, feature.part);
      if (host === null || loft.surface === null) return { feature, loft, join: null };
      if (foot === null) {
        diagnostics.push({ producer: `head.${feature.part.name}`, level: 2, contract: "seed", detail: `the landmark has no foot on ${feature.parent}` });
        return { feature, loft, join: null };
      }
      const width: number = AutoMovieHumanSeamUnion.width(feature.size[0], feature.size[1]);
      const input: AutoMovieSolidJoin.IInput = {
        part: loft.surface,
        host,
        seed: { phi: 0, s: feature.contact + sunk(feature.part), y: foot.u, theta: foot.v },
        count: COUNT,
        tolerance: TOLERANCE,
        grazing: GRAZING,
        width: { part: (): number => width, host: (): number => width },
        ...(feature.elongated === true ? { parameter: { kind: "arc" as const } } : {}),
      };
      const result: AutoMovieSolidJoin.IResult =
        feature.join === "merge" ? AutoMovieSolidMerge.create(input) : AutoMovieSolidDiff.create(input);
      diagnostics.push(...result.diagnostics);
      return { feature, loft, join: result.join, seed: { part: [input.seed.s, input.seed.phi], host: [foot.u, foot.v] }, width };
    });

    // The neck: merged under the head mass, its top inside it, seeded at the
    // back of the neck's top layer, its blend from the neck tube's radius.
    let neck: IJoined | null = null;
    if (neckChain !== undefined) {
      const part: IAutoMovieViewPart = AutoMovieHumanNeckPart.of(plan.neck, neckChain.layers[0]!.y, plan.menton);
      const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
      diagnostics.push(...loft.diagnostics);
      const top: number = neckChain.layers[neckChain.layers.length - 1]!.y;
      const back: [number, number, number] = [plan.neck.back, plan.y0, 0];
      const feature: AutoMovieHumanHeadFeatures.IFeature = {
        part,
        join: "merge",
        seed: back,
        contact: top,
        size: [plan.neck.radius, plan.neck.radius],
        parent: "head.mass",
      };
      const foot: AutoMovieSolidFoot.IFoot | null =
        mass.surface === null ? null : AutoMovieSolidFoot.of(mass.surface, back, [plan.y0, Math.PI], TOLERANCE);
      if (loft.surface === null || mass.surface === null || foot === null) neck = { feature, loft, join: null };
      else {
        const width: number = AutoMovieHumanSeamUnion.width(plan.neck.radius, plan.neck.radius);
        const result: AutoMovieSolidJoin.IResult = AutoMovieSolidMerge.create({
          part: loft.surface,
          host: mass.surface,
          seed: { phi: Math.PI, s: top, y: foot.u, theta: foot.v },
          count: COUNT,
          tolerance: TOLERANCE,
          grazing: GRAZING,
          width: { part: (): number => width, host: (): number => width },
        });
        diagnostics.push(...result.diagnostics);
        neck = { feature, loft, join: result.join, seed: { part: [top, Math.PI], host: [foot.u, foot.v] }, width };
      }
    }
    return { mass, massPart, neck, parts, diagnostics };
  }


  /**
   * The chart point `[station, phase]` a point stands over in a part's own
   * frame: the station where the point's offset along the axis vanishes from
   * the plane at station 0 (straight parts; the head mass's stations are
   * heights), and its polar angle in that plane from `u` toward `v`.
   */
  function chartOf(part: IAutoMovieViewPart, p: readonly number[]): [number, number] {
    const zero: AutoMovieLoftFrame.IFrame = part.axis.at(0);
    const one: AutoMovieLoftFrame.IFrame = part.axis.at(1);
    const w: number[] = sub(one.origin, zero.origin);
    const d: number[] = sub(p, zero.origin);
    const station: number = dot(d, w) / Math.max(1e-12, dot(w, w));
    const frame: AutoMovieLoftFrame.IFrame = part.axis.at(station);
    const r: number[] = sub(p, frame.origin);
    return [station, Math.atan2(dot(r, frame.v), dot(r, frame.u))];
  }

  /** A part moved rigidly by an offset: every plane of its axis carried along. */
  function moved(part: IAutoMovieViewPart, by: readonly number[]): IAutoMovieViewPart {
    return {
      ...part,
      axis: {
        at: (station: number): AutoMovieLoftFrame.IFrame => {
          const f: AutoMovieLoftFrame.IFrame = part.axis.at(station);
          return { ...f, origin: [f.origin[0] + by[0]!, f.origin[1] + by[1]!, f.origin[2] + by[2]!] };
        },
      },
    };
  }

  /** Difference of two points. */
  function sub(a: readonly number[], b: readonly number[]): [number, number, number] {
    return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  }

  /** Dot product. */
  function dot(a: readonly number[], b: readonly number[]): number {
    return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  }
  /** A dome's stem depth under its base: its station at the stem's top, zero for a part without a stem. */
  function sunk(part: IAutoMovieViewPart): number {
    return part.stations.length > AutoMovieHumanHeadDome.LAYERS + 1 ? part.stations[AutoMovieHumanHeadDome.STEM]! : 0;
  }
}

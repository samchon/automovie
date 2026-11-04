import { type AutoMovieLoftContract, AutoMovieSolidDiff, AutoMovieSolidFoot, type AutoMovieSolidJoin, AutoMovieSolidMerge, AutoMovieViewLoft, type IAutoMovieLoftChain, type IAutoMovieSolidSurface, type IAutoMovieViewPart } from "@automovie/engine";
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
  }

  /** The composed head. */
  export interface IOutput {
    /** The head mass's loft. */
    mass: AutoMovieViewLoft.IResult;

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
    const mass: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(AutoMovieHumanHeadMassPart.of(plan, places?.faceExponent));
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
    const parts: IJoined[] = features.map((feature: AutoMovieHumanHeadFeatures.IFeature): IJoined => {
      const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(feature.part);
      diagnostics.push(...loft.diagnostics);
      surfaces.set(feature.part.name, loft.surface);
      const host: IAutoMovieSolidSurface | null = surfaces.get(feature.parent) ?? null;
      if (host === null || loft.surface === null) return { feature, loft, join: null };

      // The seed: the landmark's foot on the parent, on the head mass from
      // the station at its height and the phase toward it about the head's
      // axis, on a parent part from the middle of its base.
      const guess: [number, number] =
        feature.parent === "head.mass"
          ? [feature.seed[1], Math.atan2(feature.seed[2], feature.seed[0] - plan.centre)]
          : [AutoMovieHumanHeadFeatures.INSET, Math.atan2(feature.seed[2], feature.seed[0])];
      const foot: AutoMovieSolidFoot.IFoot | null = AutoMovieSolidFoot.of(host, feature.seed, guess, TOLERANCE);
      if (foot === null) {
        diagnostics.push({ producer: `head.${feature.part.name}`, level: 2, contract: "seed", detail: "the landmark has no foot on the head mass" });
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
      return { feature, loft, join: result.join };
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
        neck = { feature, loft, join: result.join };
      }
    }
    return { mass, neck, parts, diagnostics };
  }

  /** A dome's stem depth under its base: its station at the stem's top, zero for a part without a stem. */
  function sunk(part: IAutoMovieViewPart): number {
    return part.stations.length > AutoMovieHumanHeadDome.LAYERS + 1 ? part.stations[AutoMovieHumanHeadDome.STEM]! : 0;
  }
}

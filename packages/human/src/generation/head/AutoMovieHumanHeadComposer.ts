import type { AutoMovieHumanLoftContract } from "../../lofting/AutoMovieHumanLoftContract";
import { AutoMovieHumanSeamUnion } from "../../lofting/AutoMovieHumanSeamUnion";
import { AutoMovieHumanSolidDiff } from "../../lofting/AutoMovieHumanSolidDiff";
import { AutoMovieHumanSolidFoot } from "../../lofting/AutoMovieHumanSolidFoot";
import type { AutoMovieHumanSolidJoin } from "../../lofting/AutoMovieHumanSolidJoin";
import { AutoMovieHumanSolidMerge } from "../../lofting/AutoMovieHumanSolidMerge";
import { AutoMovieHumanViewLoft } from "../../lofting/AutoMovieHumanViewLoft";
import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanSolidSurface } from "../../lofting/IAutoMovieHumanSolidSurface";
import type { IAutoMovieHumanViewPart } from "../../lofting/IAutoMovieHumanViewPart";
import type { IAutoMovieHumanEar } from "../../structures/head/IAutoMovieHumanEar";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadFeatures } from "./AutoMovieHumanHeadFeatures";
import { AutoMovieHumanHeadInnerParts } from "./AutoMovieHumanHeadInnerParts";
import { AutoMovieHumanHeadMassPart } from "./AutoMovieHumanHeadMassPart";
import { AutoMovieHumanNeckPart } from "./AutoMovieHumanNeckPart";

/**
 * The head subtree composed by the three operators: the head mass lofted
 * from its views (`AutoMovieHumanHeadMassPart`), and every face part lofted
 * from its own (`AutoMovieHumanHeadFeatures`) and merged onto it or cut from
 * it (`AutoMovieHumanSolidMerge`, `AutoMovieHumanSolidDiff`), each join
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
    loft: AutoMovieHumanViewLoft.IResult;

    /** Its join to the head mass, or null when either surface or the seed is missing. */
    join: AutoMovieHumanSolidJoin.IJoin | null;
  }

  /** The composed head. */
  export interface IOutput {
    /** The head mass's loft. */
    mass: AutoMovieHumanViewLoft.IResult;

    /** The neck merged under the head mass, when its chain is given. */
    neck: IJoined | null;

    /** Every face part, lofted and joined. */
    parts: IJoined[];

    /** Every broken premise, by producer. */
    diagnostics: AutoMovieHumanLoftContract.IDiagnostic[];
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
   * @param plan The landmark skeleton, the vault exponent solved.
   * @param ears The two auricles' inputs, world mm.
   * @param neckChain The neck chain whose views the neck part reads; absent, no neck.
   */
  export function compose(
    plan: IAutoMovieHumanHeadLayout,
    ears: { left: IAutoMovieHumanEar; right: IAutoMovieHumanEar },
    neckChain?: IAutoMovieHumanLoftChain,
  ): IOutput {
    const mass: AutoMovieHumanViewLoft.IResult = AutoMovieHumanViewLoft.create(AutoMovieHumanHeadMassPart.of(plan));
    const diagnostics: AutoMovieHumanLoftContract.IDiagnostic[] = [...mass.diagnostics];
    // Parents before their inner parts, each joined to its parent's bare
    // surface.
    const surfaces: Map<string, IAutoMovieHumanSolidSurface | null> = new Map([["head.mass", mass.surface]]);
    const features: AutoMovieHumanHeadFeatures.IFeature[] = [...AutoMovieHumanHeadFeatures.of(plan, ears), ...AutoMovieHumanHeadInnerParts.of(plan)];
    const parts: IJoined[] = features.map((feature: AutoMovieHumanHeadFeatures.IFeature): IJoined => {
      const loft: AutoMovieHumanViewLoft.IResult = AutoMovieHumanViewLoft.create(feature.part);
      diagnostics.push(...loft.diagnostics);
      surfaces.set(feature.part.name, loft.surface);
      const host: IAutoMovieHumanSolidSurface | null = surfaces.get(feature.parent) ?? null;
      if (host === null || loft.surface === null) return { feature, loft, join: null };

      // The seed: the landmark's foot on the parent, on the head mass from
      // the station at its height and the phase toward it about the head's
      // axis, on a parent part from the middle of its base.
      const guess: [number, number] =
        feature.parent === "head.mass"
          ? [feature.seed[1], Math.atan2(feature.seed[2], feature.seed[0] - plan.centre)]
          : [AutoMovieHumanHeadFeatures.INSET, Math.atan2(feature.seed[2], feature.seed[0])];
      const foot: AutoMovieHumanSolidFoot.IFoot | null = AutoMovieHumanSolidFoot.of(host, feature.seed, guess, TOLERANCE);
      if (foot === null) {
        diagnostics.push({ producer: `head.${feature.part.name}`, level: 2, contract: "seed", detail: "the landmark has no foot on the head mass" });
        return { feature, loft, join: null };
      }
      const width: number = AutoMovieHumanSeamUnion.width(feature.size[0], feature.size[1]);
      const input: AutoMovieHumanSolidJoin.IInput = {
        part: loft.surface,
        host,
        seed: { phi: 0, s: feature.contact, y: foot.u, theta: foot.v },
        count: COUNT,
        tolerance: TOLERANCE,
        grazing: GRAZING,
        width: { part: (): number => width, host: (): number => width },
        ...(feature.elongated === true ? { parameter: { kind: "arc" as const } } : {}),
      };
      const result: AutoMovieHumanSolidJoin.IResult =
        feature.join === "merge" ? AutoMovieHumanSolidMerge.create(input) : AutoMovieHumanSolidDiff.create(input);
      diagnostics.push(...result.diagnostics);
      return { feature, loft, join: result.join };
    });

    // The neck: merged under the head mass, its top inside it, seeded at the
    // back of the neck's top layer, its blend from the neck tube's radius.
    let neck: IJoined | null = null;
    if (neckChain !== undefined) {
      const part: IAutoMovieHumanViewPart = AutoMovieHumanNeckPart.of(neckChain);
      const loft: AutoMovieHumanViewLoft.IResult = AutoMovieHumanViewLoft.create(part);
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
      const foot: AutoMovieHumanSolidFoot.IFoot | null =
        mass.surface === null ? null : AutoMovieHumanSolidFoot.of(mass.surface, back, [plan.y0, Math.PI], TOLERANCE);
      if (loft.surface === null || mass.surface === null || foot === null) neck = { feature, loft, join: null };
      else {
        const width: number = AutoMovieHumanSeamUnion.width(plan.neck.radius, plan.neck.radius);
        const result: AutoMovieHumanSolidJoin.IResult = AutoMovieHumanSolidMerge.create({
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
}

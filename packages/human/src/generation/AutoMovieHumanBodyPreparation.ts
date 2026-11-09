import type { AutoMovieLoftContract } from "@automovie/engine";

import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import { AutoMovieHumanBodyAnatomy } from "./AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLane } from "./AutoMovieHumanBodyLane";
import { AutoMovieHumanBodyLaneInterim } from "./AutoMovieHumanBodyLaneInterim";
import type { AutoMovieHumanBodyLaw } from "./AutoMovieHumanBodyLaw";
import { AutoMovieHumanBodySources } from "./AutoMovieHumanBodySources";
import { AutoMovieHumanSkeletonLaw } from "./AutoMovieHumanSkeletonLaw";
import type { AutoMovieHumanTrunkConstruction } from "./AutoMovieHumanTrunkConstruction";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanTrunkSolution } from "./IAutoMovieHumanTrunkSolution";
import type { AutoMovieHumanHeadLane } from "./head/AutoMovieHumanHeadLane";
import { AutoMovieHumanSiteViewPart } from "./limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanTrunkBuild } from "./trunk/AutoMovieHumanTrunkBuild";

/**
 * Requested original factories and explicit production completion.
 * The common local section and world frame precede either adjoining source.
 * Production adds actual head-owned bind records; only an explicit raw method
 * obtains a chain. Original lookup assembles no body tree or final skin.
 */
export namespace AutoMovieHumanBodyPreparation {
  /** Resolved public input identities shared with production. */
  export type IInput = AutoMovieHumanBodySources.IInput;

  /** Common definitions and explicit family requests; no full skeleton is implied. */
  export type IOriginal = AutoMovieHumanBodySources.IOriginal;

  /** Explicit production preparation adds actual head/eye and whole bind metadata to the same original context. */
  export interface IOutput
    extends IOriginal, AutoMovieHumanBodySources.ICommon {
    /** Actual completed receiver boundary, requested only by production or legacy body consumers. */
    readonly neckConnection: ReturnType<
      IOriginal["neckBoundary"]
    >["connection"];

    /** Same original cut's legacy support interpretation. */
    readonly seat: ReturnType<IOriginal["neckBoundary"]>["seat"];

    /** Actual prepared head, requested by complete. */
    readonly head: AutoMovieHumanHeadLane.IPrepared;

    /** Placement metadata with actual head records; raw chains remain unrequested. */
    readonly standing: IAutoMovieHumanBodyCalibration;

    /** Same original trunk solution and its production metadata. */
    readonly trunkPlacement: AutoMovieHumanTrunkConstruction.IPlacement;

    /** Complete actual bind skeleton, including head/eye-owned bones. */
    readonly anatomy: AutoMovieHumanSkeletonLaw.IOutput;
  }

  /** Resolve the original common definitions without requesting head, body tree or raw geometry. */
  export function prepareSources(input: IInput): IOriginal {
    const original: IOriginal = AutoMovieHumanBodySources.create({
      ...input,
      completeLeg: (): void => completeLeg(original),
    });
    return original;
  }

  /** Explicit production preparation adds actual head/eye and whole bind records, before tree assembly. */
  export function of(input: IInput): IOutput {
    return complete(prepareSources(input));
  }

  /** Explicitly add actual head/eye and full skeleton metadata to the same originals; no raw request is made. */
  export function complete(original: IOriginal): IOutput {
    if (original.production === undefined) {
      const head: AutoMovieHumanHeadLane.IPrepared = original.headSource();
      const solution: IAutoMovieHumanTrunkSolution = original.trunkSolution();
      const standing: IAutoMovieHumanBodyCalibration = {
        stature: original.stature,
        chains: [],
        events: [],
        poles: [],
        apertures: [],
        eyes: head.eyes,
        head: head.landmarks,
        trunk: solution.landmarks,
        diagnostics: original.diagnostics,
      };
      const anatomy: AutoMovieHumanSkeletonLaw.IOutput =
        AutoMovieHumanSkeletonLaw.complete(
          original.bodyAnatomy(),
          head,
          original.stature,
        );
      original.production = {
        head,
        standing,
        anatomy,
        trunkPlacement: { solution, calibration: standing },
      };
    }

    // Promote this same invocation object. Copying its absent lazy memo fields
    // would let a later original/full request construct a second source family.
    const boundary: ReturnType<IOriginal["neckBoundary"]> =
      original.neckBoundary();
    return Object.assign(
      original,
      original.common(),
      { neckConnection: boundary.connection, seat: boundary.seat },
      original.production,
    );
  }

  /** Prepare the same lazy original factories, without evaluating unrelated siblings. */
  export function bodyInput(context: IOriginal): AutoMovieHumanBodyLane.IInput {
    if (context.body !== undefined) return context.body;
    const solution: IAutoMovieHumanTrunkSolution = context.trunkSolution();
    context.body = AutoMovieHumanBodyLaneInterim.of({
      params: context.params,
      solution,
      scale: context.limbs.legs.scale,
      stature: context.stature,
      crotch: context.limbs.crotch,
      trunk: context.trunkInputs,
      neckConnection: context.neckBoundary().connection,
      sources: context.limbSources(),
      frame: context.frame,
    });
    return context.body;
  }

  /** The production's two original tape passes, without raw lofts or face composition. */
  export function trunkSource(
    context: IOriginal,
  ): AutoMovieHumanTrunkBuild.IOutput {
    if (context.trunk !== undefined) return context.trunk;
    if (context.preparingTrunk === true)
      throw new Error(
        "The actual trunk parent preparation was reentered before publication",
      );
    context.preparingTrunk = true;
    try {
      const input: AutoMovieHumanBodyLane.IInput = bodyInput(context);
      const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
      const original: AutoMovieHumanTrunkBuild.IInput =
        AutoMovieHumanTrunkBuild.withHead(
          input.trunk,
          context.common().upperSupport,
          diagnostics,
        );
      const result: AutoMovieHumanTrunkBuild.IOutput =
        AutoMovieHumanTrunkBuild.define(original);
      result.diagnostics.unshift(...diagnostics);
      context.trunk = result;
      return result;
    } finally {
      context.preparingTrunk = false;
    }
  }

  /** Read one production original; null means an unrecognized request, not a successful missing part. */
  export function original(
    context: IOriginal,
    name: string,
  ): AutoMovieHumanSiteViewPart.IDefinition | null {
    if (
      name === "trunk" ||
      name.startsWith("breast.") ||
      name.startsWith("gluteal.")
    )
      return (
        trunkSource(context)
          .sources.filter(
            (source: AutoMovieHumanSiteViewPart.ISource): boolean =>
              source.name === name,
          )
          .at(-1)?.result ?? null
      );
    const sources: ReturnType<IOriginal["limbSources"]> = context.limbSources();
    for (const side of ["left", "right"] as const) {
      if (name === "arm." + side) return sources.arm(side).definition();
      if (name === "thumb." + side || name.startsWith("finger." + side + "."))
        return sources.arm(side).digit(name)?.definition ?? null;
      if (name === "leg." + side) return sources.leg(side).leg.current();
      if (name === "foot." + side) return sources.leg(side).definition();
      if (name.startsWith("toe." + side + "."))
        return (
          sources
            .leg(side)
            .toes()
            .find(
              (toe: AutoMovieHumanBodyLane.IToe): boolean =>
                toe.toe.name === name,
            )?.definition ?? null
        );
    }
    return null;
  }

  /** A completed trial is not a final parent when the actual trunk source failed publication. */
  function completeLeg(context: IOriginal): void {
    const actual: AutoMovieHumanTrunkBuild.IOutput = trunkSource(context);
    if (actual.trunk === null)
      throw new Error(
        `The actual coupled trunk parent is unavailable: ${JSON.stringify(actual.diagnostics)}`,
      );
  }

  /** Loft exactly the requested original once; failures keep their actual diagnostics, without a fallback or unrelated generation. */
  export function loft(
    context: IOriginal,
    name: string,
  ): AutoMovieHumanSiteViewPart.IResult | null {
    const retained: AutoMovieHumanSiteViewPart.IResult | undefined =
      context.rawSources?.get(name);
    if (retained !== undefined) return retained;
    const definition: AutoMovieHumanSiteViewPart.IDefinition | null = original(
      context,
      name,
    );
    if (definition === null) return null;
    const result: AutoMovieHumanSiteViewPart.IResult =
      AutoMovieHumanSiteViewPart.loft(definition);
    context.rawSources ??= new Map();
    context.rawSources.set(name, result);
    if (
      name === "trunk" ||
      name.startsWith("breast.") ||
      name.startsWith("gluteal.")
    ) {
      const trunk: AutoMovieHumanTrunkBuild.IOutput = trunkSource(context);
      trunk.sources.push({ name, result });
      trunk.diagnostics.push(
        ...result.diagnostics.slice(definition.diagnostics.length),
      );
    }
    return result;
  }

  /** Resolve the same trunk input identities once at the canonical preparation boundary, in calibration mm. */
  export function trunkInputs(
    params: IAutoMovieHumanParameters,
    inputs: AutoMovieHumanBodyLaw.ILimbInputs["legs"],
  ): AutoMovieHumanTrunkConstruction.IInputs {
    const anatomy: IAutoMovieHumanBodyMeasures =
      AutoMovieHumanBodyAnatomy.resolve(params);
    return {
      hip: inputs.hip,
      highHip: anatomy.highHipCircumference * inputs.scale,
      waist: anatomy.waistCircumference * inputs.scale,
      underbust: anatomy.underbustCircumference * inputs.scale,
      chest: anatomy.chestCircumference * inputs.scale,
      bustSpan: anatomy.bustPointWidth * inputs.scale,
      neckBase: anatomy.neckBaseCircumference * inputs.scale,
      acrossShoulder: anatomy.acrossBackShoulderWidth * inputs.scale,
      bicep: anatomy.upperArmCircumference * inputs.scale,
      neckToWaist: anatomy.backNeckToWaist * inputs.scale,
      shoulderToApex: anatomy.sideNeckToBustPoint * inputs.scale,
      upperArm: anatomy.upperArmLength * inputs.scale,
      biacromial: anatomy.biacromialBreadth * inputs.scale,
      acromion: anatomy.acromialHeight * inputs.scale,
      cervicale: anatomy.cervicaleHeight * inputs.scale,
      axilla: anatomy.axillaHeight * inputs.scale,
      female: anatomy.sex === AutoMovieHumanSex.Female,
      sex: inputs.sex,
      fat: inputs.fat,
      muscularity: inputs.muscularity,
      scale: inputs.scale,
    };
  }
}

import type {
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanBodyLane,
  IAutoMovieHumanBodyLaw,
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanBodyPreparation,
  IAutoMovieHumanBodySources,
  IAutoMovieHumanHeadLane,
  IAutoMovieHumanNamedSource,
  IAutoMovieHumanParameters,
  IAutoMovieHumanSkeletonLaw,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieHumanSourceRealization,
  IAutoMovieHumanTrunkBuild,
  IAutoMovieHumanTrunkInputs,
  IAutoMovieHumanTrunkSolution,
  IAutoMovieLoftContract,
} from "@automovie/interface";

import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import { AutoMovieHumanBodyAnatomy } from "./AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaneInterim } from "./AutoMovieHumanBodyLaneInterim";
import { AutoMovieHumanBodySources } from "./AutoMovieHumanBodySources";
import { AutoMovieHumanSkeletonLaw } from "./AutoMovieHumanSkeletonLaw";
import { AutoMovieHumanSiteViewPart } from "./limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanTrunkBuild } from "./trunk/AutoMovieHumanTrunkBuild";

/**
 * Requested original factories and explicit production completion. The common
 * local section and world frame precede either adjoining source. Production
 * adds actual head-owned bind records; only an explicit raw method obtains a
 * chain. Original lookup assembles no body tree or final skin.
 */
export namespace AutoMovieHumanBodyPreparation {
  /**
   * Resolve the original common definitions without requesting head, body tree
   * or raw geometry.
   */
  export function prepareSources(
    input: IAutoMovieHumanBodySources.IInput,
  ): IAutoMovieHumanBodySources.IOriginal {
    const original: IAutoMovieHumanBodySources.IOriginal =
      AutoMovieHumanBodySources.create({
        ...input,
        completeLeg: (): void => completeLeg(original),
      });
    return original;
  }

  /**
   * Explicit production preparation adds actual head/eye and whole bind
   * records, before tree assembly.
   */
  export function of(
    input: IAutoMovieHumanBodySources.IInput,
  ): IAutoMovieHumanBodyPreparation.IOutput {
    return complete(prepareSources(input));
  }

  /**
   * Explicitly add actual head/eye and full skeleton metadata to the same
   * originals; no raw request is made.
   */
  export function complete(
    original: IAutoMovieHumanBodySources.IOriginal,
  ): IAutoMovieHumanBodyPreparation.IOutput {
    if (original.production === undefined) {
      const head: IAutoMovieHumanHeadLane.IPrepared = original.headSource();
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
      const anatomy: IAutoMovieHumanSkeletonLaw.IOutput =
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
    const boundary: ReturnType<
      IAutoMovieHumanBodySources.IOriginal["neckBoundary"]
    > = original.neckBoundary();
    return Object.assign(
      original,
      original.common(),
      { neckConnection: boundary.connection, seat: boundary.seat },
      original.production,
    );
  }

  /**
   * Prepare the same lazy original factories, without evaluating unrelated
   * siblings.
   */
  export function bodyInput(
    context: IAutoMovieHumanBodySources.IOriginal,
  ): IAutoMovieHumanBodyLane.IInput {
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

  /**
   * The production's two original tape passes, without raw lofts or face
   * composition.
   */
  export function trunkSource(
    context: IAutoMovieHumanBodySources.IOriginal,
  ): IAutoMovieHumanTrunkBuild.IOutput {
    if (context.trunk !== undefined) return context.trunk;
    if (context.preparingTrunk === true)
      throw new Error(
        "The actual trunk parent preparation was reentered before publication",
      );
    context.preparingTrunk = true;
    try {
      const input: IAutoMovieHumanBodyLane.IInput = bodyInput(context);
      const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [];
      const original: IAutoMovieHumanTrunkBuild.IInput =
        AutoMovieHumanTrunkBuild.withHead(
          input.trunk,
          context.common().upperSupport,
          diagnostics,
        );
      const result: IAutoMovieHumanTrunkBuild.IOutput =
        AutoMovieHumanTrunkBuild.define(original);
      result.diagnostics.unshift(...diagnostics);
      context.trunk = result;
      return result;
    } finally {
      context.preparingTrunk = false;
    }
  }

  /**
   * Read one production original; null means an unrecognized request, not a
   * successful missing part.
   */
  export function original(
    context: IAutoMovieHumanBodySources.IOriginal,
    name: string,
  ): IAutoMovieHumanSourceDefinition | null {
    if (
      name === "trunk" ||
      name.startsWith("breast.") ||
      name.startsWith("gluteal.")
    )
      return (
        trunkSource(context)
          .sources.filter(
            (source: IAutoMovieHumanNamedSource): boolean =>
              source.name === name,
          )
          .at(-1)?.result ?? null
      );
    const sources: ReturnType<
      IAutoMovieHumanBodySources.IOriginal["limbSources"]
    > = context.limbSources();
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
              (toe: IAutoMovieHumanBodyLane.IToe): boolean =>
                toe.toe.name === name,
            )?.definition ?? null
        );
    }
    return null;
  }

  /**
   * A completed trial is not a final parent when the actual trunk source failed
   * publication.
   */
  function completeLeg(context: IAutoMovieHumanBodySources.IOriginal): void {
    const actual: IAutoMovieHumanTrunkBuild.IOutput = trunkSource(context);
    if (actual.trunk === null)
      throw new Error(
        `The actual coupled trunk parent is unavailable: ${JSON.stringify(actual.diagnostics)}`,
      );
  }

  /**
   * Loft the requested original and return its diagnostics to this observation.
   */
  export function loft(
    context: IAutoMovieHumanBodySources.IOriginal,
    name: string,
  ): IAutoMovieHumanSourceRealization | null {
    const definition: IAutoMovieHumanSourceDefinition | null = original(
      context,
      name,
    );
    return definition === null
      ? null
      : AutoMovieHumanSiteViewPart.loft(definition);
  }

  /**
   * Resolve the same trunk input identities once at the canonical preparation
   * boundary, in calibration mm.
   */
  export function trunkInputs(
    params: IAutoMovieHumanParameters,
    inputs: IAutoMovieHumanBodyLaw.ILimbInputs["legs"],
  ): IAutoMovieHumanTrunkInputs {
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
      kyphoticAngle: anatomy.kyphoticAngle,
      lordoticAngle: anatomy.lordoticAngle,
      female: anatomy.sex === AutoMovieHumanSex.Female,
      sex: inputs.sex,
      fat: inputs.fat,
      muscularity: inputs.muscularity,
      scale: inputs.scale,
    };
  }
}

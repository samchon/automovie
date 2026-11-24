import type {
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanBodyLane,
  IAutoMovieHumanBodyLaw,
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanBodyPreparation,
  IAutoMovieHumanBodySources,
  IAutoMovieHumanHeadLane,
  IAutoMovieHumanLimbRest,
  IAutoMovieHumanNamedSource,
  IAutoMovieHumanParameters,
  IAutoMovieHumanSkeletonLaw,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieHumanSourceRealization,
  IAutoMovieHumanTrunkBuild,
  IAutoMovieHumanTrunkInputs,
  IAutoMovieHumanTrunkSolution,
  IAutoMovieLoftContract,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import { AutoMovieHumanBodyAnatomy } from "./AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaneInterim } from "./AutoMovieHumanBodyLaneInterim";
import { AutoMovieHumanBodySources } from "./AutoMovieHumanBodySources";
import { AutoMovieHumanLimbSources } from "./AutoMovieHumanLimbSources";
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
        completeLeg: (side: "left" | "right"): IAutoMovieViewPart =>
          completeLeg(original, side),
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
    const common: IAutoMovieHumanBodySources.ICommon = original.common();
    const boundary: ReturnType<
      IAutoMovieHumanBodySources.IOriginal["neckBoundary"]
    > = original.neckBoundary(common);
    const head: IAutoMovieHumanHeadLane.IPrepared = original.headSource(common);
    const neckRaw: IAutoMovieHumanBodySources.IOriginal["neckRaw"] = () =>
      original.neckRaw(common, head);
    const solution: IAutoMovieHumanTrunkSolution = original.trunkSolution(
      boundary,
      neckRaw,
    );
    const limbRest: IAutoMovieHumanLimbRest.IOutput =
      original.limbRest(boundary);
    const arms: Record<"left" | "right", IAutoMovieHumanLimbRest.IArm> = {
      left: limbRest.arm("left"),
      right: limbRest.arm("right"),
    };
    const legs: Record<"left" | "right", IAutoMovieHumanLimbRest.ILeg> = {
      left: limbRest.leg("left"),
      right: limbRest.leg("right"),
    };
    const rest: IAutoMovieHumanLimbRest.IOutput = {
      arm: (side: "left" | "right"): IAutoMovieHumanLimbRest.IArm => arms[side],
      leg: (side: "left" | "right"): IAutoMovieHumanLimbRest.ILeg => legs[side],
    };
    const body: IAutoMovieHumanSkeletonLaw.IOutput = original.bodyAnatomy(
      common,
      boundary,
      solution,
      rest,
    );
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
    return {
      ...original,
      ...common,
      common: () => common,
      neckBoundary: () => boundary,
      headSource: () => head,
      trunkSolution: () => solution,
      limbRest: () => rest,
      limbSources: () => original.limbSources(rest),
      bodyAnatomy: () => body,
      neckRaw,
      neckConnection: boundary.connection,
      seat: boundary.seat,
      head,
      standing,
      trunkPlacement: { solution, calibration: standing },
      anatomy: AutoMovieHumanSkeletonLaw.complete(body, head, original.stature),
    };
  }

  /**
   * Prepare the trunk and its leg binding scope. Arm and foot assembly remain
   * explicit operations on the returned input.
   */
  export function bodyInput(
    context: IAutoMovieHumanBodySources.IOriginal,
    common: IAutoMovieHumanBodySources.ICommon = context.common(),
  ): IAutoMovieHumanBodyLane.IInput {
    const boundary: ReturnType<
      IAutoMovieHumanBodySources.IOriginal["neckBoundary"]
    > = context.neckBoundary(common);
    const solution: IAutoMovieHumanTrunkSolution =
      context.trunkSolution(boundary);
    const input: IAutoMovieHumanBodyLane.IInput =
      AutoMovieHumanBodyLaneInterim.of({
        params: context.params,
        solution,
        scale: context.limbs.legs.scale,
        stature: context.stature,
        crotch: context.limbs.crotch,
        trunk: context.trunkInputs,
        neckConnection: boundary.connection,
        sources: context.limbSources(context.limbRest(boundary)),
        frame: context.frame,
      });
    const { axilla, acromion, biacromial } = context.trunkInputs;
    return {
      ...input,
      trunk: {
        ...input.trunk,
        views: {
          ...input.trunk.views,
          shoulder: {
            lower: axilla,
            upper: acromion,
            neck: boundary.seat.side,
            lateral: biacromial / 2,
          },
        },
      },
    };
  }

  /**
   * The production's two original tape passes, without raw lofts or face
   * composition.
   */
  export function trunkSource(
    context: IAutoMovieHumanBodySources.IOriginal,
    input?: IAutoMovieHumanBodyLane.IInput,
  ): IAutoMovieHumanTrunkBuild.IOutput {
    const common: IAutoMovieHumanBodySources.ICommon = context.common();
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [];
    const trunk: IAutoMovieHumanTrunkBuild.IInput =
      AutoMovieHumanTrunkBuild.withHead(
        (input ?? bodyInput(context, common)).trunk,
        common.upperSupport,
        diagnostics,
      );
    const result: IAutoMovieHumanTrunkBuild.IOutput =
      AutoMovieHumanTrunkBuild.define(trunk);
    result.diagnostics.unshift(...diagnostics);
    return result;
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
    if (!AutoMovieHumanLimbSources.names().includes(name)) return null;
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
        return sources.leg(side).toe(name)?.definition ?? null;
    }
    return null;
  }

  /**
   * A completed trial is not a final parent when the actual trunk source failed
   * publication.
   */
  function completeLeg(
    context: IAutoMovieHumanBodySources.IOriginal,
    side: "left" | "right",
  ): IAutoMovieViewPart {
    const actual: IAutoMovieHumanTrunkBuild.IOutput = trunkSource(context);
    const leg: IAutoMovieHumanSourceDefinition | undefined =
      actual.legs?.[side];
    if (actual.trunk === null || leg === undefined || leg.part === null)
      throw new Error(
        `The actual coupled ${side} leg parent is unavailable: ${JSON.stringify([...actual.diagnostics, ...(leg?.diagnostics ?? [])])}`,
      );
    return leg.part;
  }

  /** Loft the requested original and return its diagnostics to this observation. */
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

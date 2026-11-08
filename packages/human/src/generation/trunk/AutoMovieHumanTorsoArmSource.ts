import type {
  AutoMovieLoftContract,
  IAutoMovieViewPart,
} from "@automovie/engine";

import type { IAutoMovieHumanParameters } from "../../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import { AutoMovieHumanBodyAnatomy } from "../AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyFrame } from "../AutoMovieHumanBodyFrame";
import { AutoMovieHumanBodyLaw } from "../AutoMovieHumanBodyLaw";
import { AutoMovieHumanLimbRest } from "../AutoMovieHumanLimbRest";
import { AutoMovieHumanNeckBoundary } from "../AutoMovieHumanNeckBoundary";
import { AutoMovieHumanShoulderDatum } from "../AutoMovieHumanShoulderDatum";
import { AutoMovieHumanArmSources } from "../arm/AutoMovieHumanArmSources";
import type { AutoMovieHumanHandBones } from "../hand/AutoMovieHumanHandBones";
import type { AutoMovieHumanTorsoSource } from "./AutoMovieHumanTorsoSource";

/** Actual selected arm originals and bind datums, without the whole body/trunk solve or a loft. */
export namespace AutoMovieHumanTorsoArmSource {
  /** Joint datum and native arm source remain distinct from a surface port and its eventual weights. */
  export interface IArm {
    /** Existing logical production name. */
    readonly name: string;

    /** The actual ArmWalk definition, including its original support controls. */
    readonly part: IAutoMovieViewPart;

    /** Existing authored acromial point, calibration mm. */
    readonly acromion: readonly [number, number, number];

    /** Same population/frame-transfer GH proxy used by the bind, calibration mm. */
    readonly joint: readonly [number, number, number];

    /** Actual hand joint/material-frame owner borrowed by the arm definition. */
    readonly hand: AutoMovieHumanHandBones.IOutput;

    /** First free deltoid row; the old proximal cap is support outside the planned kept source. */
    readonly portStation: number;

    /** Actual existing input/measurement diagnostics; no successful substitute arm is returned. */
    readonly diagnostics: readonly AutoMovieLoftContract.IDiagnostic[];

    /** Actual local stages; ArmWalk's scalar/breadth/fullness/native work remains a combined stage. */
    readonly milliseconds: Readonly<{
      handAndBind: number;
      siteControls: number;
      armDefinition: number;
    }>;
  }

  /** Same-input original neighbours with explicit unsolved surface/binding scope. */
  export interface IOutput {
    /** Selected originals, in stable anatomical order. */
    readonly arms: readonly IArm[];

    /** Dependency identity includes actual original neck, public limb inputs and existing bind directions. */
    readonly revision: string;

    /** Constructor work includes real arm tape/fullness preparation, independently of later display. */
    readonly milliseconds: number;

    /** Same-input resolution, actual neck/GH placement and canonical ArmBones before sided hand/site preparation. */
    readonly inputAndPlacementMilliseconds: number;

    /** No chart cut, band, shared weight or final rig is produced by this original reader. */
    readonly completion: "originals-only;ports-and-shared-weights-unrequested";

    /** This standalone request uses the same generating laws, but does not borrow a native/full invocation's retained objects or cost. */
    readonly ownerScope: "independent-original-context;same-generating-laws;full-bind-unverified";
  }

  /**
   * Consume the same direct shoulder, local rest and arm-source owners as
   * native originals and full bind. Public acromion height remains fixed;
   * the internal neck cut supplies a frame support, not a height clamp.
   * No head, trunk part, whole skeleton, curve readback or raw loft is acquired.
   */
  export function create(
    parameters: IAutoMovieHumanParameters,
    original: AutoMovieHumanTorsoSource.IOutput,
  ): IOutput {
    const started: number = performance.now();
    const plan: AutoMovieHumanTorsoSource.IOutput["plan"] = original.plan;
    const limbs: AutoMovieHumanBodyLaw.ILimbInputs =
      AutoMovieHumanBodyLaw.limbInputs(parameters);
    if (limbs.legs.scale !== plan.scale)
      throw new Error(
        "Selected arm and original torso have different calibration scales",
      );
    const boundary: AutoMovieHumanNeckBoundary.IOutput =
      AutoMovieHumanNeckBoundary.create(
        plan.neckFamily.controls,
        plan.neckJointDatum[1],
      );
    const placement: AutoMovieHumanLimbRest.IShoulder =
      AutoMovieHumanShoulderDatum.create(
        {
          acromion: plan.measures.acromialHeight * plan.scale,
          biacromial: plan.measures.biacromialBreadth * plan.scale,
          scale: plan.scale,
        },
        limbs.stature,
        boundary.seat.side,
      );
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const rest: AutoMovieHumanLimbRest.IOutput = AutoMovieHumanLimbRest.create({
      stature: limbs.stature,
      arms: limbs.arms,
      feet: limbs.feet,
      legs: limbs.legs,
      sex: AutoMovieHumanBodyAnatomy.sexOf(parameters),
      diagnostics,
      hipForward: AutoMovieHumanBodyFrame.create(plan.measures, plan.scale)
        .perineum,
      shoulder: (): AutoMovieHumanLimbRest.IShoulder => placement,
    });
    const arms: IArm[] = [];
    const placementDone: number = performance.now();
    for (const side of ["left", "right"] as const) {
      const armStarted: number = performance.now();
      const handStart: number = diagnostics.length;
      const actual: AutoMovieHumanLimbRest.IArm = rest.arm(side);
      const handDone: number = performance.now();
      const source: AutoMovieHumanArmSources.IOutput =
        AutoMovieHumanArmSources.create({
          side,
          rest: actual,
          arms: limbs.arms,
          measures: plan.measures,
          scale: plan.scale,
        });
      const sitesDone: number = performance.now();
      const definition: ReturnType<typeof source.definition> =
        source.definition();
      const definitionDone: number = performance.now();
      const findings: AutoMovieLoftContract.IDiagnostic[] = [
        ...diagnostics.slice(handStart),
        ...definition.diagnostics,
      ];
      if (definition.part === null)
        throw new Error(
          "Selected original arm failed: " + JSON.stringify(findings),
        );
      const station: number | undefined =
        definition.part.front.positive.knots.find(
          (knot: IAutoMovieViewPart.IKnot): boolean => knot.site === "deltoid",
        )?.station;
      if (station === undefined)
        throw new Error("Selected original arm has no free deltoid row");
      arms.push({
        name: "arm." + side,
        part: definition.part,
        acromion: [
          placement.shoulder[0],
          placement.shoulder[1],
          (side === "left" ? 1 : -1) * placement.shoulder[2],
        ],
        joint: actual.bones.shoulder,
        hand: actual.hand,
        portStation: station,
        diagnostics: findings,
        milliseconds: {
          handAndBind: handDone - armStarted,
          siteControls: sitesDone - handDone,
          armDefinition: definitionDone - sitesDone,
        },
      });
    }
    return {
      arms,
      revision: JSON.stringify({
        original: original.source.definition.revisions,
        limbs,
        placement,
        prior: {
          upper: AutoMovieHumanArmPrior.PRIOR.arm.upper,
          lower: AutoMovieHumanArmPrior.PRIOR.arm.lower,
        },
      }),
      milliseconds: performance.now() - started,
      inputAndPlacementMilliseconds: placementDone - started,
      completion: "originals-only;ports-and-shared-weights-unrequested",
      ownerScope:
        "independent-original-context;same-generating-laws;full-bind-unverified",
    };
  }
}

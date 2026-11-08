import { type IAutoMovieViewPart } from "@automovie/engine";

import type { IAutoMovieHumanParameters } from "../../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyAnatomy } from "../AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyFrame } from "../AutoMovieHumanBodyFrame";
import { AutoMovieHumanBodyLaw } from "../AutoMovieHumanBodyLaw";
import { AutoMovieHumanGlutealDome } from "../AutoMovieHumanGlutealDome";
import { AutoMovieHumanHeadArcs } from "../AutoMovieHumanHeadArcs";
import { AutoMovieHumanNeckFamily } from "../AutoMovieHumanNeckFamily";
import { AutoMovieHumanNeckSource } from "../AutoMovieHumanNeckSource";
import { AutoMovieHumanReferenceOutlines } from "../AutoMovieHumanReferenceOutlines";
import { AutoMovieHumanTrunkLandmarks } from "../AutoMovieHumanTrunkLandmarks";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanHeadLayout } from "../head/AutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadMassPart } from "../head/AutoMovieHumanHeadMassPart";
import { AutoMovieHumanHeadNeckLayout } from "../head/AutoMovieHumanHeadNeckLayout";
import { AutoMovieHumanHeadNeckScalars } from "../head/AutoMovieHumanHeadNeckScalars";
import type { AutoMovieHumanHeadPose } from "../head/AutoMovieHumanHeadPose";
import { AutoMovieHumanMassInterim } from "./AutoMovieHumanMassInterim";
import { AutoMovieHumanTrunkConnection } from "./AutoMovieHumanTrunkConnection";
import { AutoMovieHumanTrunkLaws } from "./AutoMovieHumanTrunkLaws";
import { AutoMovieHumanTrunkViews } from "./AutoMovieHumanTrunkViews";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

/**
 * Original torso authoring datums and controls, before a body tree, regional loft or parent intersection exists.
 *
 * The initial chest height retains TrunkLandmarks.CHEST, an ANSUR-derived starting datum. Its surface-course constraint remains explicitly unrequested. This is an observable first source candidate, not a claim that the locked chest/hip tapes or shoulder-to-apex course have closed.
 *
 * The breast envelope follows Gray 1918, Surface Anatomy of the Thorax (second to sixth ribs, sternum to midaxillary line): https://anatomie.cosminpopa.ro/en/5-surface-anatomy-of-the-thorax/ . The existing fourth-to-sixth-rib fold drop gives the equal superior reach as an explicit equal-interspace prior. The median and widest wall guides approximate the unprovided sternal-border and midaxillary datums; they are not published measured breast-root inputs. The old setback-contour distances remain in ReferenceOutlines and do not stand in for this whole support. Gluteal lateral support likewise reaches the actual hip half breadth and medial support the median cleft, while its vertical prior remains explicit.
 */
export namespace AutoMovieHumanTorsoPlan {
  /** A named regional displacement authored in the same physical Y planes as the torso. */
  export interface IRegion {
    /** Stable logical name, retained independently of one composed stream. */
    readonly name: string;

    /** Anatomical outward AP direction: breasts forward, gluteal regions backward. */
    readonly outward: 1 | -1;

    /** Original anatomical AP apex, calibration mm in the ankle-midpoint body frame. */
    readonly apex: readonly [number, number, number];

    /** Original up/lateral/down/medial footprint spans, calibration mm. */
    readonly footprint: readonly [number, number, number, number];

    /** Own side; reflection retains the same source law and its medial/lateral meaning. */
    readonly side: 1 | -1;
  }

  /** A public semantic constraint and its actual first-authoring state. */
  export interface IConstraint {
    /** Public or derived anatomical measurement name. */
    readonly name: string;

    /** Requested physical value, calibration mm. */
    readonly target: number;

    /** The complete common-plane profile, or surface course, owns the eventual reading. */
    readonly reading: "breadth" | "depth" | "taut-hull" | "surface-course";

    /** Actual request state; polygon/course closure is separate from a continuous error certificate. */
    readonly state: "unrequested" | "sampled-source-closed";
  }

  /** One caller-owned source plan, with all dimensions in calibration mm. */
  export interface IOutput {
    /** Stable generated-stream name. */
    readonly name: "S00";

    /** Actual supplied/resolved public measurements; never read from a mesh. */
    readonly measures: IAutoMovieHumanBodyMeasures;

    /** Calibration mm per world mm, applied at the input boundary once. */
    readonly scale: number;

    /** Shared lower/upper physical source stations. */
    readonly domain: readonly [number, number];

    /** Native wall guide controls in the common body frame; not an independent output loft. */
    readonly wall: IAutoMovieHumanTrunkViews;

    /** Exact original neck family, borrowed before either adjoining consumer lofts it. */
    readonly neck: AutoMovieHumanTrunkConnection.IConnection;

    /** Same neck radius/origin/course functions, including the complete base course below the planar split. */
    readonly neckFamily: AutoMovieHumanNeckFamily.IOutput;

    /** Periodic physical start heights: anterior axilla and lateral/posterior acromion datums. */
    readonly collarStart: IAutoMovieViewPart.IOutline;

    /** Original scaffold joint datum, distinct from the shared surface partition plane. */
    readonly neckJointDatum: readonly [number, number, number];

    /** Actual constructor stages; deferred source/phase queries remain separate. */
    readonly preparationMilliseconds: Readonly<{
      inputs: number;
      neckScaffold: number;
      headLayout: number;
      neckOriginal: number;
      neckWork: AutoMovieHumanHeadNeckLayout.IOutput["milliseconds"]["neckWork"];

      /** This constructor borrowed the same actual neck owner instead of running its constraints again. */
      neckPreparationReused?: boolean;

      /** Earlier shared-owner interval, referenced rather than added to this constructor's elapsed work. */
      upstreamNeckOriginalMilliseconds?: number;

      sharedNeck: number;
      wallControls: number;
    }>;

    /** Four original regional controls; no independent mass loft or surface contact solve. */
    readonly regions: readonly IRegion[];

    /** Semantic measurement constraints remain distinct from these direct source controls. */
    readonly constraints: readonly IConstraint[];
  }

  /** Available wall/region controls and normal boundary; lower neck and collar remain unresolved. */
  export interface IDefinition extends Omit<
    IOutput,
    "neckFamily" | "collarStart" | "neck"
  > {
    /** Complete independently determined boundary, without an unresolved lower interval part. */
    readonly neck: AutoMovieHumanTrunkConnection.IDefinition;

    /** Shared normal preparation, retained for the explicit lower-family constraint. */
    readonly neckPreparation: AutoMovieHumanHeadNeckLayout.IOutput;
  }

  /**
   * Author one physical-plane torso candidate directly from public measures and existing source laws.
   *
   * This calls the pure head/neck original preparation for the actual regular neck. It never requests Head C, lower raw loft, the old trunk solve, TrunkBuild, mass contact, leg cuts or a completed body. BodyPlaces retains its documented ankle-relative AP prior; no observed reference vertex supplies a datum.
   */
  export function create(
    parameters: IAutoMovieHumanParameters,
    shared?: AutoMovieHumanHeadPose.IShared,
  ): IOutput {
    return close(define(parameters, shared));
  }

  /** Construct independently available wall controls and the normal band before requesting lower-neck closure. */
  export function define(
    parameters: IAutoMovieHumanParameters,
    shared?: AutoMovieHumanHeadPose.IShared,
  ): IDefinition {
    const started: number = performance.now();
    if (
      shared !== undefined &&
      shared.parameters !== parameters &&
      JSON.stringify(shared.parameters) !== JSON.stringify(parameters)
    )
      throw new Error("The shared neck belongs to different public inputs");
    const measures: IAutoMovieHumanBodyMeasures =
      AutoMovieHumanBodyAnatomy.resolve(parameters);
    const limbs: AutoMovieHumanBodyLaw.ILimbInputs =
      AutoMovieHumanBodyLaw.limbInputs(parameters);
    const inputs: ReturnType<typeof AutoMovieHumanBodyLaw.headInputs> =
      shared?.inputs ?? AutoMovieHumanBodyLaw.headInputs(parameters);
    const inputDone: number = performance.now();
    const neckSource: AutoMovieHumanNeckSource.IOutput =
      shared?.neckSource ??
      AutoMovieHumanNeckSource.of(inputs, limbs.legs.scale);
    const scaffoldDone: number = performance.now();
    const layout: ReturnType<typeof AutoMovieHumanHeadLayout.create> =
      shared?.pose.neck.layout ??
      AutoMovieHumanHeadLayout.create(neckSource, inputs);
    const layoutDone: number = performance.now();
    const head: AutoMovieHumanHeadNeckLayout.IOutput =
      shared?.pose.neck ??
      AutoMovieHumanHeadNeckLayout.define(
        layout,
        neckSource.bottom[1],
        AutoMovieHumanHeadMassPart.SPACING,
        layout.vertex -
          AutoMovieHumanHeadArcs.tragionDrop(inputs.head, measures.sex) *
            layout.scale,
      );
    const headDone: number = performance.now();
    const normal: AutoMovieHumanHeadNeckLayout.IOutput["definition"] =
      head.definition;
    if (normal === null)
      throw new Error("S00 wall needs the shared normal boundary definition");
    const neck: AutoMovieHumanTrunkConnection.IDefinition =
      AutoMovieHumanTrunkConnection.normal(normal);
    const neckDone: number = performance.now();
    const values: { extents: number[]; shoulders: number[] } = {
      extents: neck.field.inputs.extents.map(
        (jet: readonly number[]): number => jet[0]!,
      ),
      shoulders: neck.field.inputs.shoulders.map(
        (jet: readonly number[]): number => jet[0]!,
      ),
    };
    const scale: number = limbs.legs.scale;
    const crotch: number = limbs.crotch;
    const top: number = measures.cervicaleHeight * scale;
    const chest: number = AutoMovieHumanTrunkLandmarks.at(
      crotch,
      top,
      AutoMovieHumanTrunkLandmarks.CHEST,
    );

    // Both original families consume the same generating body-frame C7;

    // the local neck prior is registered to it before curve construction.
    const bodyFrame: AutoMovieHumanBodyFrame.IOutput =
      AutoMovieHumanBodyFrame.create(measures, scale);
    const originX: number = bodyFrame.cervicale;
    const table: typeof AutoMovieHumanReferenceOutlines =
      AutoMovieHumanReferenceOutlines;
    const upper: AutoMovieHumanTrunkViews.ILaws["upper"] = [
      {
        site: "axilla",
        y: measures.axillaHeight * scale,
        half:
          (measures.biacromialBreadth / 2 -
            measures.upperArmCircumference / (2 * Math.PI)) *
          scale,
      },
      {
        site: "acromion",
        y: measures.acromialHeight * scale,
        half: (measures.biacromialBreadth * scale) / 2,
      },
    ]
      .filter(
        (site: { y: number }): boolean =>
          site.y > chest && site.y < neck.boundary.y,
      )
      .map(
        (site: {
          site: string;
          y: number;
          half: number;
        }): AutoMovieHumanTrunkViews.ILaws["upper"][number] => {
          const share: number = (site.y - crotch) / (top - crotch);
          return {
            ...site,
            front:
              originX + table.at(table.TRUNK, "front", share) * limbs.stature,
            back:
              originX + table.at(table.TRUNK, "back", share) * limbs.stature,
            shoulder:
              (table.at(table.TRUNK, "shoulderFront", share) +
                table.at(table.TRUNK, "shoulderBack", share)) /
              2,
          };
        },
      );
    upper.push({
      site: "neck",
      y: neck.boundary.y,
      half: values.extents[1],
      front: neck.boundary.frame.origin[0] + values.extents[0],
      back: neck.boundary.frame.origin[0] - values.extents[2],
      shoulder: values.shoulders[0],
    });
    const laws: AutoMovieHumanTrunkViews.ILaws = AutoMovieHumanTrunkLaws.of(
      measures,
      scale,
      crotch,
      {
        chest,
        cervicale: originX,
        perineum: bodyFrame.perineum,
        upper,
      },
    );
    const wall: IAutoMovieHumanTrunkViews = AutoMovieHumanTrunkViews.of(
      measures,
      crotch,
      scale,
      laws,
      {
        breast: AutoMovieHumanMassInterim.breastAmplitude(measures, scale),
        gluteal: AutoMovieHumanMassInterim.glutealAmplitude(measures, scale),
      },
      neck,
    );
    const regions: IRegion[] = [];
    const breast: ReturnType<typeof AutoMovieHumanMassInterim.breast> =
      AutoMovieHumanMassInterim.breast(measures, scale, laws, 0);
    const fold: IAutoMovieHumanTrunkViews.ISite = wall.sites.find(
      (site: IAutoMovieHumanTrunkViews.ISite): boolean =>
        site.site === "underbust",
    )!;
    const chestSite: IAutoMovieHumanTrunkViews.ISite = wall.sites.find(
      (site: IAutoMovieHumanTrunkViews.ISite): boolean => site.site === "chest",
    )!;
    const buttock: number = AutoMovieHumanTrunkLandmarks.at(
      crotch,
      top,
      AutoMovieHumanTrunkLandmarks.BUTTOCK,
    );
    const gluteal: AutoMovieHumanReferenceOutlines.IFootprint =
      measures.sex === "female"
        ? table.GLUTEAL_FOOTPRINT.female
        : table.GLUTEAL_FOOTPRINT.male;
    for (const side of [1, -1] as const) {
      const suffix: string = side === 1 ? "left" : "right";
      if (breast !== null)
        regions.push({
          name: "breast." + suffix,
          outward: 1,
          side,
          apex: [breast.target[0], breast.target[1], side * breast.target[2]],
          footprint: [
            chest - fold.y,
            chestSite.half - breast.target[2],
            chest - fold.y,
            breast.target[2],
          ],
        });
      regions.push({
        name: "gluteal." + suffix,
        outward: -1,
        side,
        apex: [
          laws.back(buttock),
          buttock,
          (side *
            AutoMovieHumanGlutealDome.LATERAL *
            measures.hipBreadth *
            scale) /
            2,
        ],
        footprint: [
          gluteal.values.up * limbs.stature,
          ((1 - AutoMovieHumanGlutealDome.LATERAL) *
            measures.hipBreadth *
            scale) /
            2,
          Math.min(gluteal.values.down * limbs.stature, buttock - crotch),
          (AutoMovieHumanGlutealDome.LATERAL * measures.hipBreadth * scale) / 2,
        ],
      });
    }
    const constraint: (
      name: string,
      target: number,
      reading: IConstraint["reading"],
    ) => IConstraint = (
      name: string,
      target: number,
      reading: IConstraint["reading"],
    ): IConstraint => ({
      name,
      target: target * scale,
      reading,
      state: "unrequested",
    });
    return {
      name: "S00",
      measures,
      scale,
      wall,
      neck,
      neckPreparation: head,
      neckJointDatum: AutoMovieHumanHeadNeckScalars.axis(
        normal.input.neck,
      ).point(neckSource.bottom[1]),
      preparationMilliseconds: {
        inputs: inputDone - started,
        neckScaffold: scaffoldDone - inputDone,
        headLayout:
          layoutDone -
          scaffoldDone +
          (shared === undefined ? head.milliseconds.placement : 0),
        neckOriginal: shared === undefined ? head.milliseconds.neckOriginal : 0,
        neckPreparationReused: shared !== undefined,
        ...(shared === undefined
          ? {}
          : {
              upstreamNeckOriginalMilliseconds: head.milliseconds.neckOriginal,
            }),
        neckWork: head.milliseconds.neckWork,
        sharedNeck: neckDone - headDone,
        wallControls: performance.now() - neckDone,
      },
      domain: [crotch, neck.boundary.y],
      regions,
      constraints: [
        constraint("chestBreadth", measures.chestBreadth, "breadth"),
        constraint("chestDepth", measures.chestDepth, "depth"),
        constraint(
          "chestCircumference",
          measures.chestCircumference,
          "taut-hull",
        ),
        constraint("hipBreadth", measures.hipBreadth, "breadth"),
        constraint("buttockDepth", measures.buttockDepth, "depth"),
        constraint("hipCircumference", measures.hipCircumference, "taut-hull"),
        constraint(
          "backNeckToWaist",
          measures.backNeckToWaist,
          "surface-course",
        ),
        constraint(
          "sideNeckToBustPoint",
          measures.sideNeckToBustPoint,
          "surface-course",
        ),
      ],
    };
  }

  /** Request the lower measurement constraint explicitly; refusal does not alter the independently authored definition. */
  export function close(definition: IDefinition): IOutput {
    const started: number = performance.now();
    const head: AutoMovieHumanHeadNeckLayout.IOutput =
      AutoMovieHumanHeadNeckLayout.close(definition.neckPreparation);
    const neckControls: typeof head.layout.neck.curves =
      head.layout.neck.curves;
    if (neckControls === undefined)
      throw new Error("S00 needs a closed lower-neck family");
    const closed: number = performance.now();
    const neckFamily: AutoMovieHumanNeckFamily.IOutput =
      AutoMovieHumanNeckFamily.create(
        neckControls,
        definition.measures.axillaHeight * definition.scale,
      );
    const collarStart: IAutoMovieViewPart.IOutline = {
      parameter: neckControls.height.parameter,
      knots: [0, 1, 2, 3, 4].map(
        (quarter: number): IAutoMovieViewPart.IKnot => ({
          site: "collar.start.quarter." + quarter,
          station: (neckControls.baseClock * quarter) / 4,
          value:
            (quarter === 0 || quarter === 4
              ? definition.measures.axillaHeight
              : definition.measures.acromialHeight) * definition.scale,
          jet: { first: 0, second: 0 },
        }),
      ),
    };
    const neck: AutoMovieHumanTrunkConnection.IConnection =
      AutoMovieHumanTrunkConnection.captureOriginal(
        neckFamily.part,
        neckFamily.curve.domain[1],
      );
    return {
      ...definition,
      neck,
      neckFamily,
      collarStart,
      preparationMilliseconds: {
        ...definition.preparationMilliseconds,
        neckOriginal:
          definition.preparationMilliseconds.neckOriginal + closed - started,
        neckWork: head.milliseconds.neckWork,
        sharedNeck:
          definition.preparationMilliseconds.sharedNeck +
          performance.now() -
          closed,
      },
    };
  }
}

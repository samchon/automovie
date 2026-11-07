import {
  type AutoMovieLoftContract,
  type AutoMovieLoftFrame,
  AutoMovieSolidFoot,
  type AutoMovieViewAxis,
  AutoMovieViewLoft,
  type IAutoMovieLoftChain,
  type IAutoMovieSolidSurface,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { IAutoMovieHumanEar } from "../../structures/head/IAutoMovieHumanEar";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadEarParts } from "./AutoMovieHumanHeadEarParts";
import { AutoMovieHumanHeadFeatures } from "./AutoMovieHumanHeadFeatures";
import { AutoMovieHumanHeadInnerParts } from "./AutoMovieHumanHeadInnerParts";
import { AutoMovieHumanHeadMassPart } from "./AutoMovieHumanHeadMassPart";
import { AutoMovieHumanHeadMasses } from "./AutoMovieHumanHeadMasses";

/**
 * The head subtree's parts placed: the head mass lofted from its views
 * (`AutoMovieHumanHeadMassPart`), and every face part drawn from its own
 * (`AutoMovieHumanHeadFeatures` and kin), each stood on its parent's lofted
 * skin by its landmark's foot there. The joins are not made here: the
 * construction tree (`AutoMovieHumanHeadTree`) names each merge and diff,
 * and the engine realizes them (`realizeAutoMovieConstruction`).
 */
export namespace AutoMovieHumanHeadComposer {
  /** A placed part and its loft. */
  export interface IPlaced {
    /** The part. */
    feature: AutoMovieHumanHeadFeatures.IFeature;

    /** Its loft, which the parts placed on it stand on. */
    loft: AutoMovieViewLoft.IResult;
  }

  /** The composed head. */
  export interface IOutput {
    /** The head mass's loft. */
    mass: AutoMovieViewLoft.IResult;

    /** The head mass's view part, the root of its construction tree (`AutoMovieHumanHeadTree`). */
    massPart: IAutoMovieViewPart;

    /** Every face part, placed and lofted. */
    parts: IPlaced[];

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

  /** Largest gap accepted on a landmark's foot, mm. */
  export const TOLERANCE: number = 0.05;

  /**
   * Compose the head.
   *
   * @param skeleton The landmark skeleton, the vault exponent solved.
   * @param ears The two auricles' inputs, world mm.
   * @param neckChain The neck chain, whose bottom layer the head mass's neck starts at inside the trunk; absent, the neck ring's height.
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
        : {
            ...skeleton,
            landmarks: {
              ...skeleton.landmarks,
              tragion: [skeleton.landmarks.tragion[0], places.tragion],
            },
          };
    const massPart: IAutoMovieViewPart = AutoMovieHumanHeadMassPart.of(
      plan,
      places?.faceExponent,
      neckChain?.layers[0]?.y,
    );
    const mass: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(massPart);
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [
      ...mass.diagnostics,
    ];

    // Parents before their inner parts, each stood on its parent's bare
    // surface.
    const surfaces: Map<string, IAutoMovieSolidSurface | null> = new Map([
      ["head.mass", mass.surface],
    ]);
    const features: AutoMovieHumanHeadFeatures.IFeature[] = [
      ...AutoMovieHumanHeadFeatures.of(plan),
      ...AutoMovieHumanHeadMasses.of(plan),
      ...AutoMovieHumanHeadEarParts.of(plan, ears, places?.ears),
      ...AutoMovieHumanHeadInnerParts.of(plan),
    ];
    const views: Map<string, IAutoMovieViewPart> = new Map([
      ["head.mass", massPart],
    ]);
    const parts: IPlaced[] = features.map(
      (placed: AutoMovieHumanHeadFeatures.IFeature): IPlaced => {
        // The seed: the landmark's foot on the parent, from the chart point
        // the landmark stands over in the parent's own frame.
        const host: IAutoMovieSolidSurface | null =
          surfaces.get(placed.parent) ?? null;
        const parentView: IAutoMovieViewPart | undefined = views.get(
          placed.parent,
        );
        const foot: AutoMovieSolidFoot.IFoot | null =
          host === null || parentView === undefined
            ? null
            : AutoMovieSolidFoot.of(
                host,
                placed.seed,
                chartOf(parentView, placed.seed),
                TOLERANCE,
              );

        // The part stands on its parent's surface: moved by its landmark's
        // offset from that foot, since a landmark placed from the skeleton
        // (the midline profile at an off-midline part, a frame's guessed
        // place) lies in front of or behind the parent's actual skin.
        const feature: AutoMovieHumanHeadFeatures.IFeature =
          foot === null
            ? placed
            : {
                ...placed,
                part: moved(placed.part, sub(foot.point, placed.seed)),
                seed: [foot.point[0], foot.point[1], foot.point[2]],
              };
        const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(
          feature.part,
        );
        diagnostics.push(...loft.diagnostics);
        surfaces.set(feature.part.name, loft.surface);
        views.set(feature.part.name, feature.part);
        if (host !== null && foot === null)
          diagnostics.push({
            producer: `head.${feature.part.name}`,
            level: 2,
            contract: "seed",
            detail: `the landmark has no foot on ${feature.parent}`,
          });
        return { feature, loft };
      },
    );

    return { mass, massPart, parts, diagnostics };
  }

  /**
   * The chart point `[station, phase]` a point stands over in a part's own
   * frame: the station whose plane holds the point, found by bisection of
   * the point's offset along the plane's normal `v x u` over the part's
   * stations (a level axis drifts, so no one direction serves), and its
   * polar angle in that plane from `u` toward `v`.
   */
  function chartOf(
    part: IAutoMovieViewPart,
    p: readonly number[],
  ): [number, number] {
    const offset = (s: number): number => {
      const f: AutoMovieLoftFrame.IFrame = part.axis.at(s);
      const n: number[] = [
        f.v[1] * f.u[2] - f.v[2] * f.u[1],
        f.v[2] * f.u[0] - f.v[0] * f.u[2],
        f.v[0] * f.u[1] - f.v[1] * f.u[0],
      ];
      return dot(sub(p, f.origin), n);
    };
    let lo: number = part.stations[0]!;
    let hi: number = part.stations[part.stations.length - 1]!;
    let station: number;
    if (offset(lo) <= 0) station = lo;
    else if (offset(hi) >= 0) station = hi;
    else {
      for (let k: number = 0; k < 60; k++) {
        const mid: number = (lo + hi) / 2;
        if (offset(mid) > 0) lo = mid;
        else hi = mid;
      }
      station = (lo + hi) / 2;
    }
    const frame: AutoMovieLoftFrame.IFrame = part.axis.at(station);
    const r: number[] = sub(p, frame.origin);
    return [station, Math.atan2(dot(r, frame.v), dot(r, frame.u))];
  }

  /** A part moved rigidly by an offset: every plane of its axis carried along. */
  function moved(
    part: IAutoMovieViewPart,
    offset: readonly number[],
  ): IAutoMovieViewPart {
    // A part in level sections (the nose) keeps its stations as heights: it
    // moves only across them. Carried up or down, its planes no longer stood
    // at their stations' heights, the tree wrote it as a curved axis whose
    // phase ran the other way round, and the engine kept the nose's inside,
    // a recess in the face.
    const a: AutoMovieLoftFrame.IFrame = part.axis.at(part.stations[0]!);
    const level: boolean =
      a.u[0] === 1 &&
      a.v[2] === 1 &&
      Math.abs(a.origin[1] - part.stations[0]!) < 1e-9;
    const by: readonly number[] = level ? [offset[0]!, 0, offset[2]!] : offset;
    // A rigid translation moves every origin and leaves every derivative.
    const carry = (
      f: AutoMovieLoftFrame.IFrame,
    ): AutoMovieLoftFrame.IFrame => ({
      ...f,
      origin: [
        f.origin[0] + by[0]!,
        f.origin[1] + by[1]!,
        f.origin[2] + by[2]!,
      ],
    });
    return {
      ...part,
      axis: {
        at: (station: number): AutoMovieLoftFrame.IFrame =>
          carry(part.axis.at(station)),
        jet: (station: number): AutoMovieViewAxis.IJet => {
          const jet: AutoMovieViewAxis.IJet = part.axis.jet(station);
          return { ...jet, frame: carry(jet.frame) };
        },
      },
    };
  }

  /** Difference of two points. */
  function sub(
    a: readonly number[],
    b: readonly number[],
  ): [number, number, number] {
    return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  }

  /** Dot product. */
  function dot(a: readonly number[], b: readonly number[]): number {
    return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  }
}

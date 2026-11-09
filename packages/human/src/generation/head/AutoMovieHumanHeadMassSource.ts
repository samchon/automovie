import {
  type AutoMovieLoftFrame,
  type AutoMovieViewAxis,
  AutoMovieViewOutline,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { AutoMovieHumanHeadBackProfile } from "../AutoMovieHumanHeadBackProfile";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadVault } from "../AutoMovieHumanHeadVault";
import type { IAutoMovieHumanHeadLandmarks } from "../IAutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadFrontSource } from "./AutoMovieHumanHeadFrontSource";
import { AutoMovieHumanHeadMassProfile } from "./AutoMovieHumanHeadMassProfile";
import { AutoMovieHumanHeadSectionConstraints } from "./AutoMovieHumanHeadSectionConstraints";
import { AutoMovieHumanHeadSourceAxis } from "./AutoMovieHumanHeadSourceAxis";

/** Original mass outlines, fullness and placement, retaining the existing source controls before any loft. */
export namespace AutoMovieHumanHeadMassSource {
  /** Existing public mass resolution, independent of anatomical dimensions. */
  export interface IDensity {
    /** Widest authored station interval in calibration millimetres. */
    spacing: number;
    /** Existing periodic compatibility-row order. */
    order: number;
    /** Existing display ring population. */
    samples: number;
  }

  /** Author one mass by explicitly preparing its fixed inputs and evaluating its requested cranial power. */
  export function of(
    plan: IAutoMovieHumanHeadLayout,
    density: IDensity,
    faceExponent?: number,
    bottom?: number,
  ): IAutoMovieViewPart {
    return prepare(plan, density, faceExponent, bottom)(plan.cranialTapePower);
  }

  /**
   * Prepare the common axis, outlines and two lower named calipers once.
   * Only cranial fullness and its frontal point constraint vary with power.
   * The caller owns this immutable family; a changed layout, face exponent,
   * boundary or density requires another preparation, not a cross-trial cache.
   */
  export function prepare(
    plan: IAutoMovieHumanHeadLayout,
    density: IDensity,
    faceExponent?: number,
    bottom?: number,
  ): (cranialTapePower?: number) => IAutoMovieViewPart {
    const SPACING: number = density.spacing;
    const ORDER: number = density.order;
    const SAMPLES: number = density.samples;
    const {
      centreAt,
      shoulder,
      smooth,
    }: Pick<
      typeof AutoMovieHumanHeadMassProfile,
      "centreAt" | "shoulder" | "smooth"
    > = AutoMovieHumanHeadMassProfile;
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const g: number = m.glabella[1];
    const neck: typeof plan.neck.curves = plan.neck.curves;
    const preparedRadius:
      | AutoMovieViewOutline.IOutline
      | AutoMovieViewOutline.IFailure
      | null =
      neck === undefined ? null : AutoMovieViewOutline.create(neck.radius);
    if (preparedRadius !== null && "detail" in preparedRadius)
      throw new Error(`Head neck radius: ${preparedRadius.detail}`);
    const radius: AutoMovieViewOutline.IOutline | null = preparedRadius;

    // Preserve the original lower scalar support. The actual part domain
    // starts at the regular shared boundary without refitting that support.
    const throat: number =
      neck?.bottom ??
      Math.min((bottom ?? plan.y0) - plan.neck.radius, plan.menton - SPACING);
    const top: number = plan.vertex - g;

    // The sites the outlines carry knots at, by station: the profile's
    // turns (the chin's front at the pogonion and its turn at the gnathion
    // among them, which a spline from the stomion to the menton cut across)
    // and the vault's; by station (the axis point's
    // height, the axis being near vertical).
    const sites: [string, number][] = [
      ["throat", throat],
      ...(neck === undefined
        ? []
        : [
            ...neck.radius.knots.map(
              (k: IAutoMovieViewPart.IKnot): [string, number] => [
                k.site,
                k.station,
              ],
            ),
            ...neck.height.knots
              .slice(0, -1)
              .map((k: IAutoMovieViewPart.IKnot): [string, number] => [
                k.site,
                k.value,
              ]),
          ]),
      ["cervicale", plan.neck.backLevel],
      ["menton", plan.menton],
      ["gnathion", m.gnathion[1]],
      ["pogonion", m.pogonion[1]],
      ["gonion", m.gonion[1]],
      ["zygion", m.zygion[1]],
      ["stomion", plan.stomion],
      ["labrale.inferius", m.labraleInferius[1]],
      ["labrale.superius", m.labraleSuperius[1]],
      ["subnasale", plan.subnasale],
      ["tragion", m.tragion[1]],
      ["nasion", plan.nasion],
      ["glabella", g],
      ["vault.lower", g + 0.35 * top],
      ["vault.upper", g + 0.7 * top],
      ["vertex", plan.vertex],
    ];
    sites.sort(
      (a: [string, number], b: [string, number]): number => a[1] - b[1],
    );
    const knotted: [string, number][] = sites.filter(
      (site: [string, number], i: number): boolean =>
        i === 0 || site[1] > sites[i - 1]![1],
    );

    // Layers: every site and as many even steps between as keep them within
    // the spacing.
    const first: number = knotted[0]![1];
    const last: number = knotted[knotted.length - 1]![1];
    const stations: number[] = [];
    for (let i: number = 0; i + 1 < knotted.length; i++) {
      const a: number = knotted[i]![1];
      const b: number = knotted[i + 1]![1];
      const n: number = Math.max(1, Math.ceil((b - a) / SPACING));
      for (let k: number = 0; k < n; k++) stations.push(a + ((b - a) * k) / n);
    }
    stations.push(last);
    if (
      bottom !== undefined &&
      !(Number.isFinite(bottom) && bottom >= first && bottom < last)
    )
      throw new Error(
        "Head mass needs a regular lower boundary inside its unchanged original source domain",
      );

    const coordinate: (component: 0 | 1 | 2) => IAutoMovieViewPart.IOutline = (
      component: 0 | 1 | 2,
    ): IAutoMovieViewPart.IOutline => ({
      knots: stations.map(
        (station: number, i: number): IAutoMovieViewPart.IKnot => ({
          site: `head.axis.${i}`,
          station,
          value:
            component === 0
              ? centreAt(plan, station)
              : component === 1
                ? station
                : 0,
          ...(component === 0 && station >= m.tragion[1]
            ? { jet: { first: 0, second: 0 } }
            : {}),
        }),
      ),
    });
    const axis: AutoMovieViewAxis.IAxis = AutoMovieHumanHeadSourceAxis.of(
      { x: neck?.centre ?? coordinate(0), y: coordinate(1), z: coordinate(2) },
      [1, 0, 0],
      [0, 0, 1],
    );
    const profile: AutoMovieHumanHeadBackProfile.IProfile =
      AutoMovieHumanHeadVault.backProfile(plan);
    const named: Map<number, string> = new Map(
      knotted.map(([site, station]: [string, number]): [number, string] => [
        station,
        site,
      ]),
    );
    const front: IAutoMovieViewPart.IOutline = AutoMovieHumanHeadFrontSource.of(
      plan,
      axis,
      stations.map(
        (
          station: number,
          k: number,
        ): Pick<IAutoMovieViewPart.IKnot, "site" | "station"> => ({
          site: named.get(station) ?? `head.${k}`,
          station,
        }),
      ),
      radius,
    );
    const preparedFront:
      | AutoMovieViewOutline.IOutline
      | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(front, {
      top: last,
    });
    if ("detail" in preparedFront)
      throw new Error(`Head front declaration: ${preparedFront.detail}`);
    const readFront: (y: number) => number = (y: number): number => {
      const value: number | string = AutoMovieViewOutline.value(
        preparedFront,
        y,
      );
      if (typeof value === "string")
        throw new Error(`Head front declaration: ${value}`);
      return value;
    };

    // Named caliper points constrain the actual section at their own X/Y.
    // A lateral maximum at the axis is not that point's breadth.
    const vault: number = shoulder(plan.vault);
    const face: number = shoulder(
      faceExponent ?? AutoMovieHumanHeadPrior.PRIOR.frame.plan,
    );
    const extentsAt: (y: number) => [number, number, number, number] = (
      y: number,
    ): [number, number, number, number] => {
      const centre: number = axis.at(y).origin[0];
      return [
        readFront(y),
        plan.breadth / 2,
        centre - AutoMovieHumanHeadBackProfile.at(profile, y),
        plan.breadth / 2,
      ];
    };
    const widths: number[] = [m.gonion, m.zygion].map(
      (site: [number, number], i: number): number =>
        AutoMovieHumanHeadSectionConstraints.lateral(
          extentsAt(site[1]),
          [face, vault, vault, face],
          site[0] - axis.at(site[1]).origin[0],
          i === 0 ? plan.mandibularWidth : plan.faceWidth,
        ),
    );
    const widthAt: (y: number) => number = (y: number): number => {
      if (y >= g)
        return (
          (plan.breadth / 2) * AutoMovieHumanHeadVault.cranialWidth(plan, y)
        );
      if (y >= m.zygion[1])
        return (
          widths[1]! +
          (plan.breadth / 2 - widths[1]!) *
            smooth((y - m.zygion[1]) / (g - m.zygion[1]))
        );
      if (y >= m.gonion[1])
        return (
          widths[0]! +
          (widths[1]! - widths[0]!) *
            smooth((y - m.gonion[1]) / (m.zygion[1] - m.gonion[1]))
        );
      const lower: number = neck?.band[1] ?? plan.y0;
      return (
        plan.neck.radius +
        (widths[0]! - plan.neck.radius) *
          smooth((y - lower) / (m.gonion[1] - lower))
      );
    };

    // Every layer's plane and the outlines' values there, so each outline
    // follows P, B and L at the layers' spacing: knots at the sites alone let
    // the spline swing across the jaw's turn to the neck and carried the
    // neck's front behind the axis.
    const back: IAutoMovieViewPart.IKnot[] = [];
    const left: IAutoMovieViewPart.IKnot[] = [];
    const right: IAutoMovieViewPart.IKnot[] = [];
    const rootSpan: number = Math.sqrt(plan.vertex - first);
    for (const [k, station] of stations.entries()) {
      const site: string = named.get(station) ?? `head.${k}`;
      const frame: AutoMovieLoftFrame.IFrame = axis.at(station);
      const atPole: boolean = site === "vertex";
      const radial: AutoMovieViewOutline.IReading | string | null =
        radius !== null && station <= neck!.band[1]
          ? AutoMovieViewOutline.at(radius, station)
          : null;
      if (typeof radial === "string")
        throw new Error(`Head neck radial source: ${radial}`);
      const p: number = readFront(station);
      const b: number = atPole
        ? 0
        : radial === null
          ? frame.origin[0] - AutoMovieHumanHeadBackProfile.at(profile, station)
          : (neck!.extents[2] * radial.value) / neck!.lateral;
      const l: number = atPole
        ? 0
        : radial === null
          ? widthAt(frame.origin[1])
          : radial.value;
      if (
        !atPole &&
        ![p, b, l].every(
          (value: number): boolean => value > 0 && Number.isFinite(value),
        )
      )
        throw new Error(
          `Head source ${site}@${station}: level axis is outside front/back/side supports [${p},${b},${l}]`,
        );
      back.push({ site, station, value: -b });
      left.push({ site, station, value: l });
      right.push({ site, station, value: -l });
      if (radial !== null) {
        const first: number = radial.parameterJet[0] * rootSpan;
        const second: number = radial.parameterJet[1] * rootSpan * rootSpan;
        back.at(-1)!.jet = {
          first: (-neck!.extents[2] * first) / neck!.lateral,
          second: (-neck!.extents[2] * second) / neck!.lateral,
        };
        left.at(-1)!.jet = { first, second };
        right.at(-1)!.jet = { first: -first, second: -second };
      }
    }
    if (back.length) {
      back[back.length - 1]!.value = 0;
      left[left.length - 1]!.value = 0;
      right[right.length - 1]!.value = 0;
    }

    // Domain restriction changes publication, not the original scalar support.
    const retainedStations: number[] =
      bottom === undefined
        ? stations
        : [
            bottom,
            ...stations.filter((station: number): boolean => station > bottom),
          ];
    const frontEdges: IAutoMovieViewPart["front"] = {
      positive: front,
      negative: { knots: back },
    };
    // The side edges keep only their sign bound. The lateral support is
    // generated from the section solves, which can exceed the published
    // half-breadth by a fraction of a millimetre near tragion; declaring that
    // half-breadth as a hard cap then leaves no in-range control hull there.
    const sideEdges: IAutoMovieViewPart["side"] = {
      positive: {
        knots: left,
        range: { minimum: 0, maximum: null },
      },
      negative: {
        knots: right,
        range: { minimum: null, maximum: 0 },
      },
    };

    // Every candidate borrows the exact same lower controls and section solves.
    return (cranialTapePower?: number): IAutoMovieViewPart => {
      const cranial: number = shoulder(cranialTapePower ?? plan.vault);
      const frontal: number = AutoMovieHumanHeadSectionConstraints.frontal(
        extentsAt(g),
        cranial,
        m.frontal[0] - axis.at(g).origin[0],
        plan.frontalWidth,
      );

      // The quarters' fullness: the vault's shoulder, the face's in front
      // under the nasion, returning to the vault's over the forehead.
      const flatAt: (value: number) => IAutoMovieViewPart.IOutline = (
        value: number,
      ): IAutoMovieViewPart.IOutline => ({
        knots: [
          { site: knotted[0]![0], station: first, value },
          { site: knotted[knotted.length - 1]![0], station: last, value },
        ],
      });
      const faceDeparture: IAutoMovieViewPart.IOutline = {
        knots: [
          {
            site: knotted[0]![0],
            station: first,
            value: neck === undefined ? face - vault : 0,
          },
          ...(neck === undefined
            ? []
            : [
                {
                  site: "neck.cylinder.upper",
                  station: neck.band[1],
                  value: 0,
                },
              ]),
          { site: "gonion", station: m.gonion[1], value: face - vault },
          { site: "zygion", station: m.zygion[1], value: face - vault },
          { site: "nasion", station: plan.nasion, value: face - vault },
          { site: "frontotemporale", station: g, value: frontal - cranial },
          { site: "vault.lower", station: g + 0.35 * top, value: 0 },
          { site: knotted[knotted.length - 1]![0], station: last, value: 0 },
        ]
          .filter(
            (
              k: IAutoMovieViewPart.IKnot,
              i: number,
              all: IAutoMovieViewPart.IKnot[],
            ): boolean => i === 0 || k.station > all[i - 1]!.station,
          )
          .map(
            (k: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => ({
              ...k,
              jet: { first: 0, second: 0 },
            }),
          ),
      };

      return {
        name: "head.mass",
        axis,
        stations: retainedStations,
        front: frontEdges,
        side: sideEdges,
        fullness: {
          kind: "shoulder",
          shoulder:
            cranialTapePower === undefined
              ? neck === undefined
                ? flatAt(vault)
                : {
                    knots: [
                      [first, AutoMovieViewSection.ELLIPSE],
                      [neck.band[1], AutoMovieViewSection.ELLIPSE],
                      [m.gonion[1], vault],
                      [last, vault],
                    ].map(
                      (
                        [station, value]: number[],
                        i: number,
                      ): IAutoMovieViewPart.IKnot => ({
                        site: `head.shoulder.${i}`,
                        station: station!,
                        value: value!,
                        jet: { first: 0, second: 0 },
                      }),
                    ),
                  }
              : {
                  knots: [
                    [
                      first,
                      neck === undefined ? vault : AutoMovieViewSection.ELLIPSE,
                    ],
                    ...(neck === undefined
                      ? []
                      : [
                          [neck.band[1], AutoMovieViewSection.ELLIPSE],
                          [m.gonion[1], vault],
                        ]),
                    [plan.nasion, vault],
                    [g, cranial],
                    [last, cranial],
                  ].map(
                    (
                      [station, value]: number[],
                      i: number,
                    ): IAutoMovieViewPart.IKnot => ({
                      site: `head.shoulder.${i}`,
                      station: station!,
                      value: value!,
                      jet: { first: 0, second: 0 },
                    }),
                  ),
                },
          departures: [faceDeparture, flatAt(0), flatAt(0), faceDeparture],
        },
        pole: "top",
        order: ORDER,
        samples: SAMPLES,
      };
    };
  }
}

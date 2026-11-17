import {
  AutoMovieViewOutline,
  AutoMovieViewParameter,
} from "@automovie/engine";
import type {
  IAutoMovieHumanSiteConstraints,
  IAutoMovieHumanSiteControls,
  IAutoMovieHumanSiteRegionControls,
  IAutoMovieHumanSiteViewPart,
  IAutoMovieLoftViewSource,
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanSiteConstraints } from "./AutoMovieHumanSiteConstraints";
import { AutoMovieHumanSiteControls } from "./AutoMovieHumanSiteControls";

/**
 * A shared distal C2 scalar region, directly authored from original site inputs.
 * Its bounded local law replaces whole-limb natural-spline coupling. Both
 * consumers receive the same angle coordinate and original parameter jets;
 * world continuity separately requires their shared axis/native field.
 * The angle endpoints still depend on the limb's proximal/distal reaches;
 * this removes proximal constraints, not every proximal shape dependency.
 */
export namespace AutoMovieHumanSiteRegionControls {
  /** Prepare the named support site through the actual distal cap in the common material chart. */
  export function create(
    input: IAutoMovieHumanSiteViewPart.IInput,
    supportName: string,
  ): IAutoMovieHumanSiteRegionControls.IOutput {
    const support: IAutoMovieHumanSiteViewPart.ISite | undefined =
      input.sites.find(
        (site: IAutoMovieHumanSiteViewPart.ISite): boolean =>
          site.site === supportName,
      );
    const pole: IAutoMovieHumanSiteViewPart.IInput["pole"] = input.pole;
    if (support === undefined || pole?.end !== "both")
      throw new Error(
        "A shared distal law requires its named support and actual two-pole material chart",
      );
    const sites: IAutoMovieHumanSiteViewPart.ISite[] = input.sites.filter(
      (site: IAutoMovieHumanSiteViewPart.ISite): boolean =>
        site.station >= support.station,
    );
    const parameter: NonNullable<
      IAutoMovieHumanSiteViewPart.IInput["parameter"]
    > = {
      type: "angle",
      bottom: pole.bottom,
      top: pole.top,
    };
    if (
      input.parameter !== undefined &&
      (input.parameter.type !== "angle" ||
        input.parameter.bottom !== pole.bottom ||
        input.parameter.top !== pole.top)
    )
      throw new Error(
        "The distal source requires its actual original two-pole angle coordinate",
      );
    const constraints: IAutoMovieHumanSiteConstraints.IOwner =
      AutoMovieHumanSiteConstraints.create();
    const edgeScale: number =
      (Math.PI - AutoMovieViewParameter.at(parameter, support.station)) /
      Math.PI;
    const fullnessScale: number =
      (pole.top - support.station) / (pole.top - pole.bottom);
    const scaled: (
      jet: IAutoMovieViewPart.IKnot["jet"],
      factor: number,
    ) => IAutoMovieViewPart.IKnot["jet"] = (
      jet: IAutoMovieViewPart.IKnot["jet"],
      factor: number,
    ): IAutoMovieViewPart.IKnot["jet"] =>
      jet === undefined
        ? undefined
        : {
            first: jet.first === null ? null : jet.first * factor,
            second: jet.second === null ? null : jet.second * factor * factor,
          };
    const local: IAutoMovieHumanSiteViewPart.IInput = {
      ...input,
      sites: sites.map(
        (
          site: IAutoMovieHumanSiteViewPart.ISite,
        ): IAutoMovieHumanSiteViewPart.ISite => ({
          ...site,
          ...(site.jets === undefined
            ? {}
            : {
                jets: site.jets.map(
                  (
                    jet: IAutoMovieViewPart.IKnot["jet"],
                  ): IAutoMovieViewPart.IKnot["jet"] => scaled(jet, edgeScale),
                ) as IAutoMovieHumanSiteViewPart.ISite["jets"],
              }),
          fullness: {
            ...site.fullness,
            jet: scaled(site.fullness.jet, fullnessScale),
          },
        }),
      ),
      pole: { end: "top", station: pole.top },
      poleJets: {
        top: input.poleJets?.top?.map(
          (
            jet: IAutoMovieViewPart.IKnot["jet"],
          ): IAutoMovieViewPart.IKnot["jet"] => scaled(jet, edgeScale),
        ) as NonNullable<IAutoMovieHumanSiteViewPart.IInput["poleJets"]>["top"],
      },
      fullnessPoleJets: {
        top: scaled(input.fullnessPoleJets?.top, fullnessScale),
      },
      parameter,
      ranges: [0, 1, 2, 3].map(
        (
          q: number,
        ): NonNullable<
          IAutoMovieHumanSiteViewPart.IInput["ranges"]
        >[number] => ({
          minimum:
            q < 2
              ? 0
              : Math.min(
                  ...sites.map(
                    (site: IAutoMovieHumanSiteViewPart.ISite): number =>
                      site.edges[q]!,
                  ),
                ),
          maximum:
            q < 2
              ? Math.max(
                  ...sites.map(
                    (site: IAutoMovieHumanSiteViewPart.ISite): number =>
                      site.edges[q]!,
                  ),
                )
              : 0,
        }),
      ) as NonNullable<IAutoMovieHumanSiteViewPart.IInput["ranges"]>,
    };
    const original: IAutoMovieHumanSiteControls.IOutput =
      AutoMovieHumanSiteControls.prepare(local, constraints);

    // The local owner derives the hull from its actual closed tape values.
    // Bounds precede coefficient preparation and preserve any genuine jets.
    if (
      original.controls !== null &&
      original.controls.scalars.fullness.kind === "shoulder"
    ) {
      const shoulder: IAutoMovieViewPart.IOutline =
        original.controls.scalars.fullness.shoulder;
      shoulder.range = {
        minimum: Math.min(
          ...shoulder.knots.map(
            (k: IAutoMovieViewPart.IKnot): number => k.value,
          ),
        ),
        maximum: Math.max(
          ...shoulder.knots.map(
            (k: IAutoMovieViewPart.IKnot): number => k.value,
          ),
        ),
      };
    }
    const field: IAutoMovieLoftViewSource.ISource | null =
      original.controls?.field() ?? null;

    const connect: (
      host: IAutoMovieHumanSiteViewPart.IInput,
    ) => IAutoMovieHumanSiteViewPart.IInput = (
      host: IAutoMovieHumanSiteViewPart.IInput,
    ): IAutoMovieHumanSiteViewPart.IInput => {
      if (field === null || field.fullness.kind !== "shoulder")
        throw new Error(
          "The actual shared distal scalar preparation is unavailable",
        );
      if (
        host.name !== input.name ||
        host.axis !== input.axis ||
        host.departures !== input.departures ||
        host.pole?.end !== "both" ||
        host.pole.bottom !== pole.bottom ||
        host.pole.top !== pole.top
      )
        throw new Error(
          "Shared distal controls require their original frame and angle endpoints",
        );
      if (
        host.parameter !== undefined &&
        (host.parameter.type !== "angle" ||
          host.parameter.bottom !== pole.bottom ||
          host.parameter.top !== pole.top)
      )
        throw new Error(
          "Changed distal parameter requires its own generating controls",
        );
      const actual: IAutoMovieHumanSiteViewPart.ISite[] = host.sites.filter(
        (site: IAutoMovieHumanSiteViewPart.ISite): boolean =>
          site.station >= support.station,
      );
      if (actual.length !== sites.length)
        throw new Error(
          "Changed distal sites require their own generating controls",
        );
      for (const site of actual) {
        const expected: IAutoMovieHumanSiteViewPart.ISite | undefined =
          sites.find(
            (candidate: IAutoMovieHumanSiteViewPart.ISite): boolean =>
              candidate.site === site.site &&
              candidate.station === site.station,
          );
        if (
          expected === undefined ||
          !site.edges.every((value: number, q: number): boolean =>
            Object.is(value, expected.edges[q]),
          ) ||
          ("girth" in site.fullness
            ? !("girth" in expected.fullness) ||
              !Object.is(site.fullness.girth, expected.fullness.girth)
            : !("shoulder" in expected.fullness) ||
              !Object.is(site.fullness.shoulder, expected.fullness.shoulder))
        )
          throw new Error(
            "Changed distal inputs require their own generating controls: " +
              site.site,
          );
      }
      const fullness: IAutoMovieViewOutline.IOutline = field.fullness.owner;
      const span: number = pole.top - pole.bottom;
      const jet: (
        outline: IAutoMovieViewOutline.IOutline,
        station: number,
        normalization: number,
      ) => NonNullable<IAutoMovieViewPart.IKnot["jet"]> = (
        outline: IAutoMovieViewOutline.IOutline,
        station: number,
        normalization: number,
      ): NonNullable<IAutoMovieViewPart.IKnot["jet"]> => {
        const reading: IAutoMovieViewOutline.IReading | string =
          AutoMovieViewOutline.at(outline, station);
        if (typeof reading === "string")
          throw new Error(`Shared distal parameter jet: ${reading}`);
        return {
          first: reading.parameterJet[0] * normalization,
          second: reading.parameterJet[1] * normalization * normalization,
        };
      };
      const edges: (
        station: number,
      ) => NonNullable<IAutoMovieHumanSiteViewPart.ISite["jets"]> = (
        station: number,
      ): NonNullable<IAutoMovieHumanSiteViewPart.ISite["jets"]> =>
        field.extents.map(
          (
            outline: IAutoMovieViewOutline.IOutline,
          ): IAutoMovieViewPart.IKnot["jet"] => jet(outline, station, Math.PI),
        ) as NonNullable<IAutoMovieHumanSiteViewPart.ISite["jets"]>;
      const closing: NonNullable<IAutoMovieHumanSiteViewPart.ISite["jets"]> =
        edges(pole.top);
      const fullnessClosing: IAutoMovieViewPart.IKnot["jet"] = jet(
        fullness,
        pole.top,
        span,
      );
      if (
        !sameQuarters(host.poleJets?.bottom, input.poleJets?.bottom) ||
        !(
          sameQuarters(host.poleJets?.top, input.poleJets?.top) ||
          sameQuarters(host.poleJets?.top, closing)
        ) ||
        !sameJet(
          host.fullnessPoleJets?.bottom,
          input.fullnessPoleJets?.bottom,
        ) ||
        !(
          sameJet(host.fullnessPoleJets?.top, input.fullnessPoleJets?.top) ||
          sameJet(host.fullnessPoleJets?.top, fullnessClosing)
        )
      )
        throw new Error(
          "Changed distal pole jets require their own generating controls",
        );

      // The actual shared parameter derivatives determine both polynomials.
      // Whole-source jet normalization differs between the local and host domains.
      return {
        ...host,
        parameter,
        sites: host.sites.map(
          (
            site: IAutoMovieHumanSiteViewPart.ISite,
          ): IAutoMovieHumanSiteViewPart.ISite => {
            if (site.station < support.station) return site;
            const expected: IAutoMovieHumanSiteViewPart.ISite = sites.find(
              (original: IAutoMovieHumanSiteViewPart.ISite): boolean =>
                original.site === site.site,
            )!;
            const qualified: NonNullable<
              IAutoMovieHumanSiteViewPart.ISite["jets"]
            > = edges(site.station);
            const fullnessJet: IAutoMovieViewPart.IKnot["jet"] = jet(
              fullness,
              site.station,
              span,
            );
            if (
              !(
                sameQuarters(site.jets, expected.jets) ||
                sameQuarters(site.jets, qualified)
              ) ||
              !(
                sameJet(site.fullness.jet, expected.fullness.jet) ||
                sameJet(site.fullness.jet, fullnessJet)
              )
            )
              throw new Error(
                "Changed distal site jets require their own generating controls: " +
                  site.site,
              );
            return {
              ...site,
              jets: qualified,
              fullness: {
                ...site.fullness,
                jet: fullnessJet,
              },
            };
          },
        ),
        poleJets: { ...host.poleJets, top: closing },
        fullnessPoleJets: {
          ...host.fullnessPoleJets,
          top: fullnessClosing,
        },
      };
    };
    return {
      local: original,
      connect,
      prepare(
        host: IAutoMovieHumanSiteViewPart.IInput,
      ): IAutoMovieHumanSiteControls.IOutput {
        if (original.controls === null) return original;
        return AutoMovieHumanSiteControls.prepare(connect(host), constraints, {
          definition: input.axis,
          value: original.controls.axis,
        });
      },
    };
  }
}

/** Compare authored normalized components, including explicit null auto-components and absence. */
function sameJet(
  a: IAutoMovieViewPart.IKnot["jet"],
  b: IAutoMovieViewPart.IKnot["jet"],
): boolean {
  return a === undefined || b === undefined
    ? a === b
    : Object.is(a.first, b.first) && Object.is(a.second, b.second);
}

/** The complete four-edge jet declaration belongs to the generating input. */
function sameQuarters(
  a: IAutoMovieHumanSiteViewPart.ISite["jets"],
  b: IAutoMovieHumanSiteViewPart.ISite["jets"],
): boolean {
  return a === undefined || b === undefined
    ? a === b
    : a.every((jet: IAutoMovieViewPart.IKnot["jet"], q: number): boolean =>
        sameJet(jet, b[q]),
      );
}

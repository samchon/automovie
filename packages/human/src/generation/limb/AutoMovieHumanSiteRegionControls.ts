import {
  type AutoMovieLoftViewSource,
  AutoMovieViewOutline,
  AutoMovieViewParameter,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { AutoMovieHumanSiteConstraints } from "./AutoMovieHumanSiteConstraints";
import { AutoMovieHumanSiteControls } from "./AutoMovieHumanSiteControls";
import type { AutoMovieHumanSiteViewPart as Site } from "./AutoMovieHumanSiteViewPart";

/**
 * A shared distal C2 scalar region, directly authored from original site inputs.
 * Its bounded local law replaces whole-limb natural-spline coupling. Both
 * consumers receive the same angle coordinate and original parameter jets;
 * world continuity separately requires their shared axis/native field.
 * The angle endpoints still depend on the limb's proximal/distal reaches;
 * this removes proximal constraints, not every proximal shape dependency.
 */
export namespace AutoMovieHumanSiteRegionControls {
  /** Both source consumers share one set of independent tape constraints. */
  export interface IOutput {
    /** Actual local scalar controls and site diagnostics, without any proximal constraint. */
    local: AutoMovieHumanSiteControls.IOutput;

    /** Supply the same complete local scalar boundary and qualified jets to the host input. */
    connect(input: Site.IInput): Site.IInput;

    /** Explicit whole-host scalar demand; local sites are reused only for identical numeric tuples. */
    prepare(input: Site.IInput): AutoMovieHumanSiteControls.IOutput;
  }

  /** Prepare the named support site through the actual distal cap in the common material chart. */
  export function create(input: Site.IInput, supportName: string): IOutput {
    const support: Site.ISite | undefined = input.sites.find(
      (site: Site.ISite): boolean => site.site === supportName,
    );
    const pole: Site.IInput["pole"] = input.pole;
    if (support === undefined || pole?.end !== "both")
      throw new Error(
        "A shared distal law requires its named support and actual two-pole material chart",
      );
    const sites: Site.ISite[] = input.sites.filter(
      (site: Site.ISite): boolean => site.station >= support.station,
    );
    const parameter: NonNullable<Site.IInput["parameter"]> = {
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
    const constraints: AutoMovieHumanSiteConstraints.IOwner =
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
    const local: Site.IInput = {
      ...input,
      sites: sites.map(
        (site: Site.ISite): Site.ISite => ({
          ...site,
          ...(site.jets === undefined
            ? {}
            : {
                jets: site.jets.map(
                  (
                    jet: IAutoMovieViewPart.IKnot["jet"],
                  ): IAutoMovieViewPart.IKnot["jet"] => scaled(jet, edgeScale),
                ) as Site.ISite["jets"],
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
        ) as NonNullable<Site.IInput["poleJets"]>["top"],
      },
      fullnessPoleJets: {
        top: scaled(input.fullnessPoleJets?.top, fullnessScale),
      },
      parameter,
      ranges: [0, 1, 2, 3].map(
        (q: number): NonNullable<Site.IInput["ranges"]>[number] => ({
          minimum:
            q < 2
              ? 0
              : Math.min(
                  ...sites.map((site: Site.ISite): number => site.edges[q]!),
                ),
          maximum:
            q < 2
              ? Math.max(
                  ...sites.map((site: Site.ISite): number => site.edges[q]!),
                )
              : 0,
        }),
      ) as NonNullable<Site.IInput["ranges"]>,
    };
    const original: AutoMovieHumanSiteControls.IOutput =
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
    const field: AutoMovieLoftViewSource.ISource | null =
      original.controls?.field() ?? null;

    const connect: (host: Site.IInput) => Site.IInput = (
      host: Site.IInput,
    ): Site.IInput => {
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
      const actual: Site.ISite[] = host.sites.filter(
        (site: Site.ISite): boolean => site.station >= support.station,
      );
      if (actual.length !== sites.length)
        throw new Error(
          "Changed distal sites require their own generating controls",
        );
      for (const site of actual) {
        const expected: Site.ISite | undefined = sites.find(
          (candidate: Site.ISite): boolean =>
            candidate.site === site.site && candidate.station === site.station,
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
      const fullness: AutoMovieViewOutline.IOutline = field.fullness.owner;
      const span: number = pole.top - pole.bottom;
      const jet: (
        outline: AutoMovieViewOutline.IOutline,
        station: number,
        normalization: number,
      ) => NonNullable<IAutoMovieViewPart.IKnot["jet"]> = (
        outline: AutoMovieViewOutline.IOutline,
        station: number,
        normalization: number,
      ): NonNullable<IAutoMovieViewPart.IKnot["jet"]> => {
        const reading: AutoMovieViewOutline.IReading | string =
          AutoMovieViewOutline.at(outline, station);
        if (typeof reading === "string")
          throw new Error(`Shared distal parameter jet: ${reading}`);
        return {
          first: reading.parameterJet[0] * normalization,
          second: reading.parameterJet[1] * normalization * normalization,
        };
      };
      const edges: (station: number) => NonNullable<Site.ISite["jets"]> = (
        station: number,
      ): NonNullable<Site.ISite["jets"]> =>
        field.extents.map(
          (
            outline: AutoMovieViewOutline.IOutline,
          ): IAutoMovieViewPart.IKnot["jet"] => jet(outline, station, Math.PI),
        ) as NonNullable<Site.ISite["jets"]>;
      const closing: NonNullable<Site.ISite["jets"]> = edges(pole.top);
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
        sites: host.sites.map((site: Site.ISite): Site.ISite => {
          if (site.station < support.station) return site;
          const expected: Site.ISite = sites.find(
            (original: Site.ISite): boolean => original.site === site.site,
          )!;
          const qualified: NonNullable<Site.ISite["jets"]> = edges(
            site.station,
          );
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
        }),
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
      prepare(host: Site.IInput): AutoMovieHumanSiteControls.IOutput {
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
function sameQuarters(a: Site.ISite["jets"], b: Site.ISite["jets"]): boolean {
  return a === undefined || b === undefined
    ? a === b
    : a.every((jet: IAutoMovieViewPart.IKnot["jet"], q: number): boolean =>
        sameJet(jet, b[q]),
      );
}

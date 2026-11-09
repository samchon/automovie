import {
  AutoMovieConstructionViews,
  type AutoMovieLoftContract,
  AutoMovieLoftViewSource,
  type AutoMovieViewAxis,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { AutoMovieHumanSiteConstraints } from "./AutoMovieHumanSiteConstraints";
import type { AutoMovieHumanSiteViewPart as Site } from "./AutoMovieHumanSiteViewPart";

/** Common generating scalar controls and local native field, before either adjoining original is published. */
export namespace AutoMovieHumanSiteControls {
  /** Explicitly shared frame preparation of the identical canonical axis declaration. */
  export interface IFrame {
    /** Original immutable metre axis record, checked before reuse. */
    definition: Site.IInput["axis"];

    /** Its actual calibration-mm engine frame, including available axis jets. */
    value: AutoMovieViewAxis.IAxis;
  }

  /** Original mathematical inputs and scalar declarations, before a part, tree view or loft is made. */
  export interface IControls {
    /** The unchanged generating inputs and canonical axis declaration. */
    readonly input: Site.IInput;

    /** Actual engine frame mapping, separate from scalar chart coordinates. */
    readonly axis: AutoMovieViewAxis.IAxis;

    /** Full scalar knots/parameters needed by the existing global interpolation; no complete neighbour is acquired. */
    readonly scalars: AutoMovieLoftViewSource.IInput;

    /** Explicit native scalar preparation, shared by contact consumers; its physical2 refusal stays observable. */
    field(): AutoMovieLoftViewSource.ISource;
  }

  /** Actual control admission, retaining failed input/tape diagnostics without an alternative source. */
  export interface IOutput {
    /** Null after the original source-control admission failed. */
    controls: IControls | null;

    /** Original source/tape premises in their original order. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * Resolve original scalar controls directly from anatomical/site input.
   * Global natural interpolation requires its whole original knot set; that
   * mathematical dependency is kept without constructing a neighbouring part.
   * Native contact readers and actual part publication consume this same
   * call-owned declaration, physical parameter and available source jets.
   */
  export function prepare(
    input: Site.IInput,
    constraints?: AutoMovieHumanSiteConstraints.IOwner,
    sharedFrame?: IFrame,
  ): IOutput {
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const producer: string = `view.${input.name}`;
    const fail: (contract: string, detail: string) => IOutput = (
      contract: string,
      detail: string,
    ): IOutput => {
      diagnostics.push({ producer, level: 2, contract, detail });
      return { controls: null, diagnostics };
    };
    if (sharedFrame !== undefined && sharedFrame.definition !== input.axis)
      return fail(
        "axis",
        "Shared frame belongs to another canonical axis declaration",
      );
    const frame: AutoMovieViewAxis.IAxis | string =
      sharedFrame?.value ?? AutoMovieConstructionViews.frame(input.axis);
    if (typeof frame === "string") return fail("axis", frame);
    const sites: Site.ISite[] = input.sites;
    if (sites.length < 2)
      return fail("sites", `${sites.length} sites; a part needs at least two`);
    for (let k: number = 0; k < sites.length; k++) {
      const s: Site.ISite = sites[k]!;
      if (k > 0 && !(s.station > sites[k - 1]!.station))
        return fail(
          "sites",
          `site ${s.site} at ${s.station} mm does not rise above ${sites[k - 1]!.site}`,
        );
      if (
        !(s.edges[0] > 0 && s.edges[1] > 0 && s.edges[2] < 0 && s.edges[3] < 0)
      )
        return fail(
          "sites",
          `site ${s.site}: edges [${s.edges.join(", ")}] mm do not hold the axis inside the box`,
        );
    }
    const pole: Site.IInput["pole"] = input.pole;
    const bottom: number | null =
      pole === undefined || pole.end === "top"
        ? null
        : pole.end === "both"
          ? pole.bottom
          : pole.station;
    const top: number | null =
      pole === undefined || pole.end === "bottom"
        ? null
        : pole.end === "both"
          ? pole.top
          : pole.station;
    if (
      (input.poleJets?.bottom !== undefined && bottom === null) ||
      (input.poleJets?.top !== undefined && top === null)
    )
      return fail(
        "pole jets",
        "closing-knot jets require the corresponding declared pole",
      );
    if (bottom !== null && !(bottom < sites[0]!.station))
      return fail(
        "pole",
        `the bottom pole at ${bottom} mm does not lie below the first site`,
      );
    if (top !== null && !(top > sites.at(-1)!.station))
      return fail(
        "pole",
        `the top pole at ${top} mm does not lie above the last site`,
      );

    // A tape solve remains owned by the shared section factory, once per site.
    const shoulders: number[] = [];
    for (const site of sites) {
      if ("shoulder" in site.fullness) {
        shoulders.push(site.fullness.shoulder);
        continue;
      }
      const solve: AutoMovieHumanSiteConstraints.IOwner["solve"] =
        constraints?.solve ??
        ((
          name: string,
          extents: [number, number, number, number],
          girth: number,
        ): AutoMovieViewSection.ISolved =>
          AutoMovieViewSection.solve(name, { extents }, girth));
      const solved: AutoMovieViewSection.ISolved = solve(
        `${producer} ${site.site}`,
        [site.edges[0], site.edges[1], -site.edges[2], -site.edges[3]],
        site.fullness.girth,
      );
      diagnostics.push(...solved.diagnostics);
      if (solved.section === null)
        return fail(
          "fullness",
          `site ${site.site}: no section fits the tape ${site.fullness.girth} mm`,
        );
      shoulders.push(solved.section.shoulders[0]);
    }
    const shoulderKnots: IAutoMovieViewPart.IKnot[] = sites.map(
      (site: Site.ISite, k: number): IAutoMovieViewPart.IKnot => ({
        site: site.site,
        station: site.station,
        value: shoulders[k]!,
        ...(site.fullness.jet !== undefined ? { jet: site.fullness.jet } : {}),
      }),
    );
    if (bottom !== null)
      shoulderKnots.unshift({
        site: "bottom pole",
        station: bottom,
        value: shoulders[0]!,
        ...(input.fullnessPoleJets?.bottom === undefined
          ? {}
          : { jet: input.fullnessPoleJets.bottom }),
      });
    if (top !== null)
      shoulderKnots.push({
        site: "top pole",
        station: top,
        value: shoulders.at(-1)!,
        ...(input.fullnessPoleJets?.top === undefined
          ? {}
          : { jet: input.fullnessPoleJets.top }),
      });
    const stations: number[] = sites.map(
      (site: Site.ISite): number => site.station,
    );
    if (bottom !== null) stations.unshift(bottom);
    if (top !== null) stations.push(top);
    const scalars: AutoMovieLoftViewSource.IInput = {
      stations: subdivide(stations, input.gap),
      front: { positive: outline(input, 0), negative: outline(input, 2) },
      side: { positive: outline(input, 1), negative: outline(input, 3) },
      fullness: {
        kind: "shoulder",
        shoulder: {
          knots: shoulderKnots,
          ...(input.fullnessRange === undefined
            ? {}
            : { range: input.fullnessRange }),
        },
        ...(input.departures === undefined
          ? {}
          : { departures: input.departures }),
      },
      ...(pole === undefined ? {} : { pole: pole.end }),
    };
    return {
      controls: {
        input,
        axis: frame,
        scalars,
        field: native(input.name, scalars),
      },
      diagnostics,
    };
  }

  /**
   * Own one explicit native preparation for an original scalar declaration.
   * Replacing a scalar requires a new supplier; unchanged contact readers
   * share the same admitted physical-parameter coefficients and refusal.
   */
  export function native(
    name: string,
    scalars: AutoMovieLoftViewSource.IInput,
  ): IControls["field"] {
    let retained: AutoMovieLoftViewSource.ISource | undefined;
    return (): AutoMovieLoftViewSource.ISource => {
      if (retained !== undefined) return retained;
      const admitted: AutoMovieLoftViewSource.IResult | null =
        AutoMovieLoftViewSource.create(scalars);
      if (admitted === null || admitted.source === null)
        throw new Error(
          `The actual ${name} has no direct original field: ${JSON.stringify(admitted)}`,
        );
      retained = admitted.source;
      return retained;
    };
  }

  /** Copy a signed original scalar, including its authored normalized jets, bounds and zero closing knots. */
  export function outline(
    input: Pick<
      Site.IInput,
      "sites" | "pole" | "poleJets" | "ranges" | "parameter"
    >,
    quarter: 0 | 1 | 2 | 3,
  ): IAutoMovieViewPart.IOutline {
    const knots: IAutoMovieViewPart.IKnot[] = input.sites.map(
      (site: Site.ISite): IAutoMovieViewPart.IKnot => ({
        site: site.site,
        station: site.station,
        value: site.edges[quarter],
        ...(site.jets?.[quarter] === undefined
          ? {}
          : { jet: site.jets[quarter] }),
      }),
    );
    const pole: Site.IInput["pole"] = input.pole;
    if (pole !== undefined && pole.end !== "top")
      knots.unshift({
        site: "bottom pole",
        station: pole.end === "both" ? pole.bottom : pole.station,
        value: 0,
        ...(input.poleJets?.bottom?.[quarter] === undefined
          ? {}
          : { jet: input.poleJets.bottom[quarter] }),
      });
    if (pole !== undefined && pole.end !== "bottom")
      knots.push({
        site: "top pole",
        station: pole.end === "both" ? pole.top : pole.station,
        value: 0,
        ...(input.poleJets?.top?.[quarter] === undefined
          ? {}
          : { jet: input.poleJets.top[quarter] }),
      });
    const range: IAutoMovieViewPart.IOutline["range"] = input.ranges?.[quarter];
    return {
      knots,
      ...(range === undefined ? {} : { range }),
      ...(input.parameter === undefined ? {} : { parameter: input.parameter }),
    };
  }
}

/** Retain every named station and the original bounded-spacing subdivision rule. */
function subdivide(kept: readonly number[], gap: number): number[] {
  const out: number[] = [kept[0]!];
  for (let k: number = 1; k < kept.length; k++) {
    const a: number = kept[k - 1]!;
    const b: number = kept[k]!;
    const count: number = Math.max(1, Math.ceil((b - a) / gap - 1e-9));
    for (let i: number = 1; i <= count; i++)
      out.push(i === count ? b : a + ((b - a) * i) / count);
  }
  return out;
}

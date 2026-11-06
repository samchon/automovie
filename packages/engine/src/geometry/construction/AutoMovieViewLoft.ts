import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

import { AutoMovieLoftCoefficientSource } from "./AutoMovieLoftCoefficientSource";
import { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieLoftFrameSource } from "./AutoMovieLoftFrameSource";
import type { AutoMoviePolarSector } from "./AutoMoviePolarSector";
import { AutoMovieSeamStation } from "./AutoMovieSeamStation";
import { AutoMovieSolidChain } from "./AutoMovieSolidChain";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import { AutoMovieViewSection } from "./AutoMovieViewSection";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Existing ordered quarter layout shared with the view input owner. */
type Quarters<T> = IAutoMovieViewPart.IQuarters<T>;

/**
 * Loft a view part through its four signed source outlines and fullness owner.
 * Each admitted section touches its box at four guides and becomes the existing
 * periodic cubic through `order` uniform polar samples. Coefficients use natural
 * station interpolation or their common closing root/angle coordinate; analytic
 * frames keep actual source jets, while numerical axes retain the smooth plane fit.
 *
 * C2 applies to phase and regular station interpolation. True-pole station jets
 * are singular; exact section fidelity and geometric G2 at the apex remain
 * unproved by the Cartesian phase approximation. The surviving-layer domain stays.
 *
 * Broken boxes/fullness omit the station with its named numeric diagnostic.
 * Unreachable girth keeps its reach endpoint with a diagnostic. Fewer than two
 * surviving sections publish no final chain. Source records and inputs remain immutable.
 *
 * @evidence contracts/common.md#principled-implementation A part's sections come from its four outlines and its fullness owner at each station, lofted into one C2 chain whose layers read back the outlines at their sites.
 * @evidence contracts/common.md#clear-and-simple-design One create function from a view part to its chain, surface, sections and diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A broken station is left out with its diagnostic; no section is replaced by a fallback shape.
 * @evidence contracts/common.md#meaningful-documentation States the inputs' premises, the poles' domes and the result's fields.
 * @evidence contracts/performance.md#efficient-algorithms One section solve per station plus the poles' added rings.
 * @evidence contracts/performance.md#reuse-equivalent-work Each outline's spline is built once and read at every station.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains the chain and the emitted sections.
 */
export namespace AutoMovieViewLoft {
  /**
   * The operator's result.
   *
   * @evidence contracts/common.md#principled-implementation Separates the final loft chain/surface from admitted sections, source diagnostics and the declared phase/station continuity.
   * @evidence contracts/common.md#clear-and-simple-design Nullable final geometry and retained sections/diagnostics express partial and total admission failures.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing chain remains null; surviving sections are not described as the complete original source curve.
   * @evidence contracts/common.md#meaningful-documentation Members state null cases, section identity and continuity.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Result data has no algorithm; create owns realization cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Result data coordinates no requests.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the returned chain, sections and diagnostics.
   */
  export interface IResult {
    /** The chain under the part's name, or null when fewer than two stations survive. */
    chain: IAutoMovieLoftChain | null;

    /** The chain as a solid surface for merge and diff, or null with the chain. */
    surface: IAutoMovieSolidSurface | null;

    /** Each surviving station's section, by station. */
    sections: IStation[];

    /** Every broken premise. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];

    /** C2 phase and regular-station interpolation. A true pole has no finite station 2-jet; geometric G2 of the complete phase approximation is not certified by this literal. */
    continuity: { phase: "C2"; station: "C2" };
  }

  /**
   * One emitted station.
   *
   * @evidence contracts/common.md#principled-implementation Stores one admitted section with its station and actual input plane, before final coefficient/frame interpolation.
   * @evidence contracts/common.md#clear-and-simple-design Station, frame and section preserve the section owner's inputs and result.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not claim an emitted section exists at a failed station or closing pole.
   * @evidence contracts/common.md#meaningful-documentation Members distinguish source station units, plane and admitted section.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Section data has no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Section data coordinates no requests.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The containing loft result owns the section and frame.
   */
  export interface IStation {
    /** Station, mm. */
    station: number;

    /** Its section plane. */
    frame: AutoMovieLoftFrame.IFrame;

    /** Its section. */
    section: AutoMovieViewSection.ISection;
  }

  /**
   * Loft a part from its views.
   *
   * @param part The part.
   * @returns The chain, its surface, its sections and its diagnostics.
   *
   * @evidence contracts/common.md#principled-implementation Reads original scalar sources and admitted sections, preserves actual analytic frame jets and prepares a new principal-coefficient natural interpolant in the common closing coordinate when capped; ordinary fields use SeamStation.
   * @evidence contracts/common.md#clear-and-simple-design Source admission, section construction and final chain construction remain consecutive stages with explicit diagnostics.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid source/fullness/sections retain their diagnostics; no mesh-derived outline or fallback section is introduced.
   * @evidence contracts/common.md#meaningful-documentation The namespace describes ownership, totality, the pole rule and the final coefficient interpolation; source values use the value-only owner.
   * @evidence contracts/performance.md#efficient-algorithms Each source is prepared once, each station solves one section, then coefficient/frame source preparation and ordinary field solves are linear in layer rows and their component widths.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses prepared scalar sources across station values; SeamStation skips source-owned tables and reuses each ordinary curvature table for its slope solve.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Source preparation and temporary section samples are call-local; the returned chain and sections own retained output and no cross-part cache is added.
   */
  export function create(part: IAutoMovieViewPart): IResult {
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const producer: string = `view.${part.name}`;
    /** Keep every failed input premise with the view producer that encountered it. */
    const report: (contract: string, detail: string) => void = (
      contract: string,
      detail: string,
    ): void => {
      diagnostics.push({ producer, level: 2, contract, detail });
    };
    /** A failed admission retains diagnostics without publishing partial final geometry. */
    const empty: () => IResult = (): IResult => ({
      chain: null,
      surface: null,
      sections: [],
      diagnostics,
      continuity: CONTINUITY,
    });

    // Inputs: stations, the order and every curve's knots.
    if (
      !(Number.isInteger(part.order) && part.order >= 8 && part.order % 4 === 0)
    ) {
      report(
        "order",
        `order ${part.order} is not a positive multiple of 4 of at least 8`,
      );
      return empty();
    }
    /** Source stations must be ordered with the existing numerical spline-gap premise. */
    const rising: (values: readonly number[]) => boolean = (
      values: readonly number[],
    ): boolean =>
      values.length >= 2 &&
      values.every(
        (v: number, i: number): boolean =>
          Number.isFinite(v) &&
          (i === 0 ||
            (v > values[i - 1]! &&
              v - values[i - 1]! >= AutoMovieLoftContract.splineGap(values))),
      );
    if (!rising(part.stations)) {
      report(
        "stations",
        `stations [${part.stations.join(", ")}] are not at least two strictly increasing finite values`,
      );
      return empty();
    }
    // The poles' end stations close in points and carry no section.
    const first: number = part.stations[0]!;
    const last: number = part.stations[part.stations.length - 1]!;
    const closes: ("bottom" | "top")[] =
      part.pole === "both"
        ? ["bottom", "top"]
        : part.pole === undefined
          ? []
          : [part.pole];
    const tips: number[] = closes.map((end: "bottom" | "top"): number =>
      end === "bottom" ? first : last,
    );

    /** Prepare one original scalar source once; closure changes its coordinate, never its knots. */
    const curve: (
      name: string,
      outline: IAutoMovieViewPart.IOutline,
      closing?: boolean,
    ) => ((s: number) => number) | null = (
      name: string,
      outline: IAutoMovieViewPart.IOutline,
      closing: boolean = false,
    ): ((s: number) => number) | null => {
      const ends: AutoMovieViewOutline.IEnds = {};
      if (closing)
        for (const end of closes) ends[end] = end === "bottom" ? first : last;
      const prepared:
        | AutoMovieViewOutline.IOutline
        | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
        outline,
        ends,
      );
      if ("detail" in prepared) {
        report(prepared.contract, `${name}: ${prepared.detail}`);
        return null;
      }
      return (s: number): number => {
        const value: number | string = AutoMovieViewOutline.value(prepared, s);
        if (typeof value === "string") {
          report("outline", `${name}: ${value}`);
          return NaN;
        }
        return value;
      };
    };
    /** Quarter departures share the scalar owner and retain their ordered input identities. */
    const quarters: (
      name: string,
      outlines: Quarters<IAutoMovieViewPart.IOutline> | undefined,
    ) => ((s: number) => Quarters<number>) | null = (
      name: string,
      outlines: Quarters<IAutoMovieViewPart.IOutline> | undefined,
    ): ((s: number) => Quarters<number>) | null => {
      if (outlines === undefined) return (): Quarters<number> => [0, 0, 0, 0];
      const qs: (((s: number) => number) | null)[] = outlines.map(
        (
          o: IAutoMovieViewPart.IOutline,
          q: number,
        ): ((s: number) => number) | null => curve(`${name} ${q}`, o),
      );
      if (qs.some((q: ((s: number) => number) | null): boolean => q === null))
        return null;
      return (s: number): Quarters<number> =>
        qs.map((q: ((s: number) => number) | null): number =>
          q!(s),
        ) as Quarters<number>;
    };
    const lateral: ((s: number) => number) | null = curve(
      "front positive",
      part.front.positive,
      true,
    );
    const medial: ((s: number) => number) | null = curve(
      "front negative",
      part.front.negative,
      true,
    );
    const ahead: ((s: number) => number) | null = curve(
      "side positive",
      part.side.positive,
      true,
    );
    const behind: ((s: number) => number) | null = curve(
      "side negative",
      part.side.negative,
      true,
    );
    const fullness: IAutoMovieViewPart.Fullness = part.fullness;
    const owner: ((s: number) => number) | null =
      fullness.kind === "girth"
        ? curve("girth", fullness.girth, true)
        : fullness.kind === "shoulder"
          ? curve("shoulder", fullness.shoulder)
          : (): number => 0;
    const shoulders: ((s: number) => Quarters<number>) | null =
      fullness.kind === "top"
        ? quarters("top shoulder", fullness.shoulders)
        : quarters("departure", fullness.departures);
    if (
      lateral === null ||
      medial === null ||
      ahead === null ||
      behind === null ||
      owner === null ||
      shoulders === null
    )
      return empty();

    // Each cap: between its pole and the given station nearest it, rings at
    // equal root-distance steps. Existing density uses the mean half extent
    // over the authored station gap, not a certified physical arc spacing.
    // Within the cap span to the nearest other outline knot, shoulders reach
    // the ellipse by quintic smoothstep: the osculating section of a
    // nondegenerate quadratic cap. This policy alone does not certify apex G2.
    const given: number[] = part.stations.filter(
      (s: number): boolean => !tips.includes(s),
    );
    let stations: number[] = given;
    const caps: ((s: number) => number)[] = [];
    const knots: number[] = [
      part.front.positive,
      part.front.negative,
      part.side.positive,
      part.side.negative,
    ].flatMap((o: IAutoMovieViewPart.IOutline): number[] =>
      o.knots.map((k: IAutoMovieViewPart.IKnot): number => k.station),
    );
    const gap: number = (last - first) / (part.stations.length - 1);
    for (const tip of given.length > 0 ? tips : []) {
      const near: number = tip === first ? given[0]! : given[given.length - 1]!;
      const halves: number[] = [
        lateral(near),
        ahead(near),
        -medial(near),
        -behind(near),
      ];
      const mean: number =
        halves.reduce((a: number, b: number): number => a + b, 0) / 4;
      const rings: number = Math.max(0, Math.ceil(mean / gap) - 1);
      const added: number[] = Array.from(
        { length: rings },
        (_: unknown, j: number): number => {
          const share: number = (j + 1) / (rings + 1);
          return tip + (near - tip) * share * share;
        },
      );
      stations = [...stations, ...added];
      const span: number = Math.min(
        ...knots
          .filter((s: number): boolean => !tips.includes(s))
          .map((s: number): number => Math.abs(s - tip)),
      );
      caps.push((s: number): number => {
        const x: number = Math.min(1, Math.abs(s - tip) / span);
        return 1 - x * x * x * (10 - 15 * x + 6 * x * x);
      });
    }
    stations.sort((a: number, b: number): number => a - b);
    /** Existing cap-shoulder blend, independent of the coefficient source coordinate. */
    const cap: (s: number) => number = (s: number): number =>
      Math.max(0, ...caps.map((c: (s: number) => number): number => c(s)));
    /** Preserve the established shoulder policy while the coefficient interpolant is repaired separately. */
    const domed: (r: Quarters<number>, s: number) => Quarters<number> = (
      r: Quarters<number>,
      s: number,
    ): Quarters<number> => {
      const w: number = cap(s);
      return w === 0
        ? r
        : (r.map(
            (x: number): number => x + w * (AutoMovieViewSection.ELLIPSE - x),
          ) as Quarters<number>);
    };

    const sections: IStation[] = [];
    for (const s of stations) {
      const at: string = `station ${s} mm`;

      // The box: each outline on its own side of the axis, and the opposite
      // edges apart.
      const signed: [number, number, number, number] = [
        lateral(s),
        ahead(s),
        medial(s),
        behind(s),
      ];
      if (!(signed[0] > signed[2]) || !(signed[1] > signed[3])) {
        report(
          "outline order",
          `${at}: an outline crosses its opposite (front ${signed[0]} over ${signed[2]} mm, side ${signed[1]} over ${signed[3]} mm)`,
        );
        continue;
      }
      const extents: Quarters<number> = [
        signed[0],
        signed[1],
        -signed[2],
        -signed[3],
      ];
      if (!extents.every((e: number): boolean => e > 0)) {
        report(
          "half extent",
          `${at}: half extents [${extents.join(", ")}] mm; the axis must lie strictly inside the box`,
        );
        continue;
      }
      const box: AutoMovieViewSection.IBox = { extents };

      // The quarters' fullness from its owner.
      let section: AutoMovieViewSection.ISection | null;
      if (fullness.kind === "girth") {
        const solved: AutoMovieViewSection.ISolved = AutoMovieViewSection.solve(
          `${producer} ${at}`,
          box,
          owner(s),
          shoulders(s),
        );
        diagnostics.push(...solved.diagnostics);
        section =
          solved.section !== null && cap(s) > 0
            ? AutoMovieViewSection.of(box, domed(solved.section.shoulders, s))
            : solved.section;
      } else {
        const r: Quarters<number> = domed(
          shoulders(s).map((d: number): number =>
            fullness.kind === "top" ? d : owner(s) + d,
          ) as Quarters<number>,
          s,
        );
        if (!r.every((x: number): boolean => x > 0 && x < 1)) {
          report(
            "shoulder",
            `${at}: shoulders [${r.join(", ")}] outside (0, 1)`,
          );
          continue;
        }
        section = AutoMovieViewSection.of(box, r);
        const fault: string | null = AutoMovieViewSection.fault(section);
        if (fault !== null) {
          report(
            "view section",
            `${at}: shoulders [${r.join(", ")}] on the box [${extents.join(", ")}] mm: ${fault}`,
          );
          section = null;
        }
      }
      if (section === null) continue;
      sections.push({ station: s, frame: part.axis.at(s), section });
    }
    if (sections.length < 2) {
      report(
        "stations",
        `${sections.length} of ${part.stations.length} stations carry a section; a chain needs two`,
      );
      return { ...empty(), sections };
    }

    const N: number = part.order;
    const layers: IAutoMovieLoftChain.ILayer[] = sections.map(
      (st: IStation): IAutoMovieLoftChain.ILayer => {
        const points: [number, number][] = Array.from(
          { length: N },
          (_: unknown, m: number): [number, number] => {
            const phi: number = (2 * Math.PI * m) / N;
            const r: number = AutoMovieViewSection.radius(st.section, phi)[0];
            return [r * Math.cos(phi), r * Math.sin(phi)];
          },
        );
        const coefficients: number[] = AutoMovieSplineCurve.interpolate(points);
        const s: AutoMovieViewSection.ISection = st.section;
        return {
          y: st.station,
          frame: st.frame,
          coefficients,
          slopes: new Array<number>(coefficients.length).fill(0),
          view: {
            extents: [...s.box.extents],
            shoulders: [...s.shoulders],
            curvatures: s.guides.map(
              (g: AutoMoviePolarSector.IGuide): number =>
                (g.value - g.curvature) / (g.value * g.value),
            ) as Quarters<number>,
          },
        };
      },
    );
    const poles: { end: "bottom" | "top"; point: [number, number, number] }[] =
      closes.map(
        (
          end: "bottom" | "top",
          k: number,
        ): { end: "bottom" | "top"; point: [number, number, number] } => ({
          end,
          point: [...part.axis.at(tips[k]!).origin],
        }),
      );
    let chain: IAutoMovieLoftChain = {
      name: part.name,
      basis: "spline",
      order: N,
      rule: "polar",
      samples: part.samples,
      layers,
      ...(poles[0] !== undefined ? { pole: poles[0] } : {}),
      ...(poles[1] !== undefined ? { opposite: poles[1] } : {}),
    };
    if (closes.length !== 0) {
      const parameter: AutoMovieConstructionOutlineParameter =
        closes.length === 2
          ? { type: "angle", bottom: first, top: last }
          : { type: "root", end: closes[0]!, pole: tips[0]! };
      const coefficients: IAutoMovieLoftChain | string =
        AutoMovieLoftCoefficientSource.prepare(chain, parameter);
      if (typeof coefficients === "string") {
        report("coefficient parameter", coefficients);
        return { ...empty(), sections };
      }
      chain = coefficients;
    }
    const source: IAutoMovieLoftChain | string =
      AutoMovieLoftFrameSource.retain(chain, part.axis);
    if (typeof source === "string") {
      report("axis jet", source);
      return { ...empty(), sections };
    }
    chain = AutoMovieSeamStation.continuous(source);
    const surface: IAutoMovieSolidSurface | null =
      AutoMovieSolidChain.surface(chain);
    if (surface === null)
      report(
        "solid surface",
        "the chain does not read as a solid surface (no jets or a degenerate middle section)",
      );
    return { chain, surface, sections, diagnostics, continuity: CONTINUITY };
  }
}

/** The continuity every emitted chain carries. */
const CONTINUITY: AutoMovieViewLoft.IResult["continuity"] = {
  phase: "C2",
  station: "C2",
};

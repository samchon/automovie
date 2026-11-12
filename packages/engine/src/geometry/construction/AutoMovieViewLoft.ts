import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

import { AutoMovieLoftCapSource } from "./AutoMovieLoftCapSource";
import { AutoMovieLoftCoefficientSource } from "./AutoMovieLoftCoefficientSource";
import { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieLoftFrameSource } from "./AutoMovieLoftFrameSource";
import { AutoMovieLoftSectionNative } from "./AutoMovieLoftSectionNative";
import { AutoMovieLoftSectionSource } from "./AutoMovieLoftSectionSource";
import { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";
import { AutoMovieLoftViewSource } from "./AutoMovieLoftViewSource";
import type { AutoMoviePolarSector } from "./AutoMoviePolarSector";
import { AutoMovieSeamStation } from "./AutoMovieSeamStation";
import { AutoMovieSolidChain } from "./AutoMovieSolidChain";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import { AutoMovieViewChain } from "./AutoMovieViewChain";
import { AutoMovieViewLoftInputs } from "./AutoMovieViewLoftInputs";
import { AutoMovieViewSection } from "./AutoMovieViewSection";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Existing ordered quarter layout shared with the view input owner. */
type Quarters<T> = IAutoMovieViewPart.IQuarters<T>;

/** One emitted station's plane, radius reader and four-quarter metadata, in station order. */
interface Row {
  station: number;
  frame: AutoMovieLoftFrame.IFrame;
  radius: (phi: number) => number;
  view: IAutoMovieLoftChain.IView | undefined;
}

/**
 * Loft a view part through its four signed source outlines and fullness owner.
 * Direct shoulder/top fields retain their original scalar generators for final
 * points, phase derivatives and available physical total2. Emitted uniform-polar
 * cubic coefficients remain the explicit compatibility representation; generic
 * girth retains that existing representation. Analytic frames keep actual source
 * jets, while numerical axes retain their existing smooth plane fit.
 *
 * A top fullness declaring touch offsets or splits makes each station a
 * conic chain (`AutoMovieViewChain`, through the native reader's mapping),
 * returned in `chains`; its compatibility rows sample that chain and carry no
 * four-quarter metadata, and its outlines join the same knot coverage as the
 * extents and shoulders. Such a result declares C1 in phase and in station:
 * a chain join moves with the station at phase theta(s), and where its two
 * arcs' curvatures differ the radius keeps r and r_phi continuous across it
 * while r_phiphi jumps; differentiating the two continuities along the join
 * gives the jumps [r_sphi] = -theta' [r_phiphi] and [r_ss] = theta'^2
 * [r_phiphi], so C2 holds only within the smooth pieces between joins.
 *
 * Regular C2 requires the admitted scalar/section/frame derivative premises.
 * Physical pole jets and geometric G2 at an apex are not supplied here. The
 * surviving-layer domain and the original polar phase meaning stay unchanged.
 *
 * Broken boxes/fullness omit the station with its named numeric diagnostic.
 * A direct source with any rejected prepared station publishes only inspection
 * sections, because skipping a row cannot remove that invalid original field.
 * Unreachable girth keeps its reach endpoint with a diagnostic. Fewer than two
 * surviving sections publish no final chain. Source records and inputs remain immutable.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the inputs' premises, the poles' domes, the chain stations' continuity with its derivation and the result's fields.
 * @evidence contracts/development/design.md#principled-representation The result carries its actual four-quarter sections and split chains separately, with their source frames, the final field and its continuity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One create operation owns view-part admission and publication. Station records expose the admitted geometry to inspection and the compatibility layer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A rejected source keeps its diagnostic, never publishes a replacement shape, and a split chain declares only the continuity of its joins.
 */
export namespace AutoMovieViewLoft {
  /**
   * The operator's result.
   *
   * @evidence contracts/development/design.md#principled-representation Separates the final loft chain/surface from admitted sections, source diagnostics and the declared phase/station continuity.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Nullable final geometry and retained sections/diagnostics express partial and total admission failures.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing chain remains null; surviving sections are not described as the complete original source curve.
   * @evidence contracts/development/common.md#meaningful-documentation Members state null cases, section identity and continuity.
   */
  export interface IResult {
    /** Bare chain, null on input/station/coefficient/frame preparation failure; regular-surface qualification is separate. */
    chain: IAutoMovieLoftChain | null;

    /** Regular surface for merge/diff, null for an absent chain, unavailable physical2 or failed anchor admission. */
    surface: IAutoMovieSolidSurface | null;

    /** Each surviving four-quarter station's section, by station. */
    sections: IStation[];

    /** Each surviving chain station's section, by station, for a source declaring touch offsets or splits. */
    chains: IChainStation[];

    /** Every broken premise. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];

    /** C2 in phase and regular station for four-quarter sections; C1 in both once a chain station is present (moving G1 joins with unequal curvatures; C2 only within the pieces between them). A true pole has no finite station 2-jet; geometric G2 of the complete phase approximation is not certified by this literal. */
    continuity: { phase: "C2" | "C1"; station: "C2" | "C1" };
  }

  /**
   * One emitted station.
   *
   * @evidence contracts/development/design.md#principled-representation Stores one admitted section with its station and actual input plane, before final coefficient/frame interpolation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Station, frame and section preserve the section owner's inputs and result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Does not claim an emitted section exists at a failed station or closing pole.
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish source station units, plane and admitted section.
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
   * One emitted chain station.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members distinguish source station units, plane and the chain with its join curvatures.
   * @evidence contracts/development/design.md#principled-representation Stores one admitted conic chain with its physical station and exact input plane.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The loft result exposes its split station to the compatibility layer and inspection alongside ordinary section stations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only an admitted chain is stored and its individual arc geometry remains available.
   */
  export interface IChainStation {
    /** Station, mm. */
    station: number;

    /** Its section plane. */
    frame: AutoMovieLoftFrame.IFrame;

    /** Its chain section. */
    chain: AutoMovieViewChain.ISection;
  }

  /**
   * Loft a part from its views.
   *
   * @param part The part.
   * @returns The chain, its surface, its sections and its diagnostics.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Retains original direct scalar sources as final local authority and actual analytic frame jets; explicit compatibility coefficients keep their existing common closing coordinate or ordinary SeamStation law, sampled from each station's own section or chain.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Source admission, section construction and final chain construction remain consecutive stages with explicit diagnostics.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid source/fullness/sections retain their diagnostics. A direct field with a rejected prepared station is not published through surviving compatibility rows, and no fallback section is introduced.
   * @evidence contracts/development/common.md#meaningful-documentation The namespace describes ownership, totality, the pole rule, the chain stations and the final coefficient interpolation; source values use the value-only owner.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each source is prepared once. An O(L+K) station-set and declared-knot coverage pass precedes section solves; each station then solves one section or prepares one chain, and coefficient/frame preparation and ordinary field solves are linear in layer rows and component widths.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses prepared scalar sources across station values; SeamStation skips source-owned tables and reuses each ordinary curvature table for its slope solve.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned direct chain owns original scalar preparations and O(LN) compatibility bindings alongside its sections; temporary samples are call-local and no cross-part cache is added.
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
      chains: [],
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

    const admitted: AutoMovieLoftViewSource.IResult | null =
      AutoMovieLoftViewSource.create(part);
    if (admitted !== null) {
      for (const fault of admitted.diagnostics)
        report(fault.contract, fault.detail);
      if (admitted.source === null) return empty();
    }
    const direct: AutoMovieLoftViewSource.ISource | null =
      admitted?.source ?? null;
    const inputs: ReturnType<typeof AutoMovieViewLoftInputs> =
      AutoMovieViewLoftInputs(part, direct, report);
    if (inputs === null) return empty();
    const { lateral, medial, ahead, behind, owner, shoulders } = inputs;
    const fullness: IAutoMovieViewPart.Fullness = part.fullness;

    // Generic girth coefficients interpolate emitted rows; direct fields keep their original continuous source.
    const required: [string, IAutoMovieViewPart.IOutline][] = [
      ["front positive", part.front.positive],
      ["front negative", part.front.negative],
      ["side positive", part.side.positive],
      ["side negative", part.side.negative],
    ];
    if (fullness.kind === "top") {
      required.push(...fullness.shoulders.map((outline: IAutoMovieViewPart.IOutline, q: number): [string, IAutoMovieViewPart.IOutline] => [`top shoulder ${q}`, outline]));
      if (fullness.touch !== undefined)
        required.push(...fullness.touch.map((outline: IAutoMovieViewPart.IOutline, q: number): [string, IAutoMovieViewPart.IOutline] => [`touch ${q}`, outline]));
      if (fullness.splits !== undefined)
        required.push(
          ...fullness.splits.flatMap((split: IAutoMovieViewPart.ISplit, q: number): [string, IAutoMovieViewPart.IOutline][] => [
            [`split ${q} u`, split.u],
            [`split ${q} v`, split.v],
            [`split ${q} angle`, split.angle],
            [`split ${q} shoulder`, split.shoulder],
          ]),
        );
    } else {
      required.push(fullness.kind === "girth" ? ["girth", fullness.girth] : ["shoulder", fullness.shoulder]);
      if (fullness.departures !== undefined)
        required.push(
          ...fullness.departures.map(
            (
              outline: IAutoMovieViewPart.IOutline,
              q: number,
            ): [string, IAutoMovieViewPart.IOutline] => [
              `departure ${q}`,
              outline,
            ],
          ),
        );
    }
    const declared: Set<number> = new Set(part.stations);
    let missing: boolean = false;
    for (const [name, outline] of direct === null ? required : [])
      for (const knot of outline.knots)
        if (
          knot.station >= first &&
          knot.station <= last &&
          !declared.has(knot.station)
        ) {
          report(
            "stations",
            `${name} knot ${knot.site}@${knot.station} mm lies inside the retained interval but is absent from declared stations`,
          );
          missing = true;
        }
    if (missing) return empty();

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
    const chains: IChainStation[] = [];
    for (const s of stations) {
      const at: string = `station ${s} mm`;
      const actual: AutoMovieLoftViewRead.IValues | string | null =
        direct === null ? null : AutoMovieLoftViewRead.values(direct, s);
      if (typeof actual === "string") {
        report("outline", actual);
        continue;
      }

      // The box: each outline on its own side of the axis, and the opposite
      // edges apart.
      const signed: [number, number, number, number] =
        actual === null
          ? [lateral(s), ahead(s), medial(s), behind(s)]
          : [
              actual.extents[0]!,
              actual.extents[1]!,
              -actual.extents[2]!,
              -actual.extents[3]!,
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

      // A declared touch/split source: the station's own conic chain.
      if (
        actual !== null &&
        (actual.touch !== undefined || actual.splits !== undefined || actual.pieces !== undefined)
      ) {
        const prepared: AutoMovieViewChain.ISection | string =
          AutoMovieLoftSectionNative.chain(actual);
        if (typeof prepared === "string") {
          report("view chain", `${at}: ${prepared}`);
          continue;
        }
        chains.push({ station: s, frame: part.axis.at(s), chain: prepared });
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
        const r: Quarters<number> =
          actual === null
            ? domed(
                shoulders(s).map((d: number): number =>
                  fullness.kind === "top" ? d : owner(s) + d,
                ) as Quarters<number>,
                s,
              )
            : (actual.shoulders as Quarters<number>);
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
    const emitted: number = sections.length + chains.length;
    if (emitted < 2) {
      report(
        "stations",
        `${emitted} of ${part.stations.length} stations carry a section; a chain needs two`,
      );
      return { ...empty(), sections, chains };
    }

    // A skipped compatibility row does not erase the original source there.
    // Keep the diagnosed sections for inspection without publishing that field.
    if (direct !== null && emitted !== stations.length)
      return { ...empty(), sections, chains };

    const N: number = part.order;
    const rows: Row[] = [
      ...sections.map(
        (st: IStation): Row => ({
          station: st.station,
          frame: st.frame,
          radius: (phi: number): number =>
            AutoMovieViewSection.radius(st.section, phi)[0],
          view: {
            extents: [...st.section.box.extents],
            shoulders: [...st.section.shoulders],
            curvatures: st.section.guides.map(
              (g: AutoMoviePolarSector.IGuide): number =>
                (g.value - g.curvature) / (g.value * g.value),
            ) as Quarters<number>,
          },
        }),
      ),
      ...chains.map(
        (st: IChainStation): Row => ({
          station: st.station,
          frame: st.frame,
          radius: (phi: number): number =>
            AutoMovieViewChain.radius(st.chain, phi),
          view: undefined,
        }),
      ),
    ].sort((a: Row, b: Row): number => a.station - b.station);
    const layers: IAutoMovieLoftChain.ILayer[] = [];
    for (const row of rows) {
      const points: [number, number][] = Array.from(
        { length: N },
        (_: unknown, m: number): [number, number] => {
          const phi: number = (2 * Math.PI * m) / N;
          const r: number = row.radius(phi);
          return [r * Math.cos(phi), r * Math.sin(phi)];
        },
      );
      if (!points.every((p: [number, number]): boolean => p.every(Number.isFinite))) {
        report(
          "view chain",
          `station ${row.station} mm: a compatibility row sample has no finite radius`,
        );
        return { ...empty(), sections, chains };
      }
      const coefficients: number[] = AutoMovieSplineCurve.interpolate(points);
      layers.push({
        y: row.station,
        frame: row.frame,
        coefficients,
        slopes: new Array<number>(coefficients.length).fill(0),
        ...(row.view === undefined ? {} : { view: row.view }),
      });
    }
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
        return { ...empty(), sections, chains };
      }
      chain = coefficients;
    }
    const source: IAutoMovieLoftChain | string =
      AutoMovieLoftFrameSource.retain(chain, part.axis);
    if (typeof source === "string") {
      report("axis jet", source);
      return { ...empty(), sections, chains };
    }
    chain = AutoMovieSeamStation.continuous(source);
    if (direct !== null)
      chain = AutoMovieLoftSectionSource.retain(chain, direct);
    chain = AutoMovieLoftCapSource.retain(chain, part.axis);
    // The part's reliefs ride on the chain it returns, as its owner composes
    // them (`{ ...chain, reliefs }`), so the surface and every reader of the
    // chain, a realized construction face included, carry them.
    if (part.reliefs !== undefined) chain = { ...chain, reliefs: part.reliefs };
    // Declared ring phases ride on it the same way; a list that is not `samples` phases strictly increasing within one turn is refused.
    if (part.phases !== undefined) {
      const phases: number[] = part.phases;
      if (!(phases.length === part.samples && phases.every((p: number, k: number): boolean => Number.isFinite(p) && (k === 0 || p > phases[k - 1]!)) && phases[phases.length - 1]! - phases[0]! < 2 * Math.PI)) {
        report("ring phases", "the declared ring phases are not `samples` finite phases strictly increasing within one turn");
        return { ...empty(), sections, chains };
      }
      chain = { ...chain, phases: [...phases] };
    }
    const surface: IAutoMovieSolidSurface | null =
      AutoMovieSolidChain.surface(chain);
    if (surface === null)
      report(
        "solid surface",
        "the chain does not read as a solid surface (no jets or a degenerate middle section)",
      );
    return {
      chain,
      surface,
      sections,
      chains,
      diagnostics,
      continuity: chains.length === 0 ? CONTINUITY : { phase: "C1", station: "C1" },
    };
  }
}

/** The continuity every four-quarter chain carries. */
const CONTINUITY: AutoMovieViewLoft.IResult["continuity"] = {
  phase: "C2",
  station: "C2",
};

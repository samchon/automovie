import type {
  IAutoMovieConstructionOutlineParameter,
  IAutoMovieLoftChain,
  IAutoMovieLoftContract,
  IAutoMovieLoftSectionJet,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftViewRead,
  IAutoMovieLoftViewSource,
  IAutoMoviePolarSector,
  IAutoMovieSolidSurface,
  IAutoMovieViewChain,
  IAutoMovieViewLoft,
  IAutoMovieViewLoftInputsInputs,
  IAutoMovieViewPart,
  IAutoMovieViewSection,
} from "@automovie/interface";

import { AutoMovieLoftCapSource } from "./AutoMovieLoftCapSource";
import { AutoMovieLoftCoefficientSource } from "./AutoMovieLoftCoefficientSource";
import { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import { AutoMovieLoftFrameSource } from "./AutoMovieLoftFrameSource";
import { AutoMovieLoftSectionNative } from "./AutoMovieLoftSectionNative";
import { AutoMovieLoftSectionOriginal } from "./AutoMovieLoftSectionOriginal";
import { AutoMovieLoftSectionSource } from "./AutoMovieLoftSectionSource";
import { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";
import { AutoMovieLoftViewSource } from "./AutoMovieLoftViewSource";
import { AutoMovieSeamStation } from "./AutoMovieSeamStation";
import { AutoMovieSolidChain } from "./AutoMovieSolidChain";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import { AutoMovieViewChain } from "./AutoMovieViewChain";
import { AutoMovieViewLoftInputs } from "./AutoMovieViewLoftInputs";
import { AutoMovieViewSection } from "./AutoMovieViewSection";

/** Existing ordered quarter layout shared with the view input owner. */
type Quarters<T> = IAutoMovieViewPart.IQuarters<T>;

/** One emitted station's plane, radius reader and four-quarter metadata, in station order. */
interface Row {
  station: number;
  frame: IAutoMovieLoftSectionFrame;
  point: (phi: number) => [number, number];
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
 */
export namespace AutoMovieViewLoft {
  /**
   * Loft a part from its views.
   *
   * @param part The part.
   * @returns The chain, its surface, its sections and its diagnostics.
   */
  export function create(part: IAutoMovieViewPart): IAutoMovieViewLoft.IResult {
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [];
    const producer: string = `view.${part.name}`;
    /** Keep every failed input premise with the view producer that encountered it. */
    const report: (contract: string, detail: string) => void = (
      contract: string,
      detail: string,
    ): void => {
      diagnostics.push({ producer, level: 2, contract, detail });
    };
    /** A failed admission retains diagnostics without publishing partial final geometry. */
    const empty: () => IAutoMovieViewLoft.IResult =
      (): IAutoMovieViewLoft.IResult => ({
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

    const admitted: IAutoMovieLoftViewSource.IResult | null =
      AutoMovieLoftViewSource.create(part);
    if (admitted !== null) {
      for (const fault of admitted.diagnostics)
        report(fault.contract, fault.detail);
      if (admitted.source === null) return empty();
    }
    const direct: IAutoMovieLoftViewSource.ISource | null =
      admitted?.source ?? null;
    const directRead: ReturnType<typeof AutoMovieLoftViewRead.prepare> | null =
      direct === null ? null : AutoMovieLoftViewRead.prepare(direct);
    const field = part.originalSection;
    if (field !== undefined) {
      const fault = AutoMovieLoftSectionOriginal.fault(
        field,
        first,
        last,
        closes.length !== 0,
      );
      if (fault !== null || direct === null || closes.includes("bottom")) {
        report("original section", fault ?? "a bounded original section needs a direct regular proximal field and a retained native tail");
        return empty();
      }
      if (field.regular !== true) {
        if (direct.caps.some(({ pole, span }): boolean => span === null || field.domain[1] > pole - span)) {
          report("original section", "the original section overlaps the original distal cap");
          return empty();
        }
        const mark = field.domain[1], retained = directRead!.jets(mark);
        if (typeof retained === "string") {
          report("original section", retained);
          return empty();
        }
        const tail = AutoMovieLoftSectionNative.jet(retained);
        const before =
          field.jetAt?.(mark) ?? ((phi: number) => field.jet(mark, phi));
        for (let k = 0; k < 2 * part.order; ++k) {
          const phi = Math.PI * k / part.order;
          if (!sameJet(before(phi), tail(phi))) {
            report("original section", "the original section does not preserve its protected local 0/1/2 jets");
            return empty();
          }
        }
      }
    }
    const inputs: IAutoMovieViewLoftInputsInputs | null =
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
      required.push(
        ...fullness.shoulders.map(
          (
            outline: IAutoMovieViewPart.IOutline,
            q: number,
          ): [string, IAutoMovieViewPart.IOutline] => [
            `top shoulder ${q}`,
            outline,
          ],
        ),
      );
      if (fullness.touch !== undefined)
        required.push(
          ...fullness.touch.map(
            (
              outline: IAutoMovieViewPart.IOutline,
              q: number,
            ): [string, IAutoMovieViewPart.IOutline] => [`touch ${q}`, outline],
          ),
        );
      if (fullness.splits !== undefined)
        required.push(
          ...fullness.splits.flatMap(
            (
              split: IAutoMovieViewPart.ISplit,
              q: number,
            ): [string, IAutoMovieViewPart.IOutline][] => [
              [`split ${q} u`, split.u],
              [`split ${q} v`, split.v],
              [`split ${q} angle`, split.angle],
              [`split ${q} shoulder`, split.shoulder],
            ],
          ),
        );
    } else {
      required.push(
        fullness.kind === "girth"
          ? ["girth", fullness.girth]
          : ["shoulder", fullness.shoulder],
      );
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

    const sections: IAutoMovieViewLoft.IStation[] = [];
    const chains: IAutoMovieViewLoft.IChainStation[] = [];
    const original: NonNullable<IAutoMovieViewLoft.IResult["original"]> = [];
    for (const s of stations) {
      if (AutoMovieLoftSectionOriginal.active(field, s)) {
        original.push({ station: s, frame: part.axis.at(s), field: field! });
        continue;
      }
      const at: string = `station ${s} mm`;
      const actual: IAutoMovieLoftViewRead.IValues | string | null =
        directRead === null ? null : directRead.values(s);
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
        (actual.touch !== undefined ||
          actual.splits !== undefined ||
          actual.pieces !== undefined)
      ) {
        const prepared: IAutoMovieViewChain.ISection | string =
          AutoMovieLoftSectionNative.chain(actual);
        if (typeof prepared === "string") {
          report("view chain", `${at}: ${prepared}`);
          continue;
        }
        chains.push({ station: s, frame: part.axis.at(s), chain: prepared });
        continue;
      }
      const box: IAutoMovieViewSection.IBox = { extents };

      // The quarters' fullness from its owner.
      let section: IAutoMovieViewSection.ISection | null;
      if (fullness.kind === "girth") {
        const solved: IAutoMovieViewSection.ISolved =
          AutoMovieViewSection.solve(
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
    const emitted: number = sections.length + chains.length + original.length;
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
        (st: IAutoMovieViewLoft.IStation): Row => ({
          station: st.station,
          frame: st.frame,
          point: (phi: number): [number, number] => polar(AutoMovieViewSection.radius(st.section, phi)[0], phi),
          view: {
            extents: [...st.section.box.extents],
            shoulders: [...st.section.shoulders],
            curvatures: st.section.guides.map(
              (g: IAutoMoviePolarSector.IGuide): number =>
                (g.value - g.curvature) / (g.value * g.value),
            ) as Quarters<number>,
          },
        }),
      ),
      ...chains.map(
        (st: IAutoMovieViewLoft.IChainStation): Row => ({
          station: st.station,
          frame: st.frame,
          point: (phi: number): [number, number] => polar(AutoMovieViewChain.radius(st.chain, phi), phi),
          view: undefined,
        }),
      ),
      ...original.map((row): Row => ({
        station: row.station,
        frame: row.frame,
        point:
          row.field.pointAt?.(row.station) ??
          ((phi) => row.field.point(row.station, phi)),
        view: undefined,
      })),
    ].sort((a: Row, b: Row): number => a.station - b.station);
    const layers: IAutoMovieLoftChain.ILayer[] = [];
    for (const row of rows) {
      const points: [number, number][] = Array.from(
        { length: N },
        (_: unknown, m: number): [number, number] => {
          const phi: number = (2 * Math.PI * m) / N;
          return row.point(phi);
        },
      );
      if (
        !points.every((p: [number, number]): boolean =>
          p.every(Number.isFinite),
        )
      ) {
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
      const parameter: IAutoMovieConstructionOutlineParameter =
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
    if (field !== undefined) chain = { ...chain, originalSection: field };
    chain = AutoMovieLoftCapSource.retain(chain, part.axis);
    // The part's reliefs ride on the chain it returns, as its owner composes
    // them (`{ ...chain, reliefs }`), so the surface and every reader of the
    // chain, a realized construction face included, carry them.
    if (part.reliefs !== undefined) chain = { ...chain, reliefs: part.reliefs };
    // Declared ring phases ride on it the same way; a list that is not `samples` phases strictly increasing within one turn is refused.
    if (part.phases !== undefined) {
      const phases: number[] = part.phases;
      if (
        !(
          phases.length === part.samples &&
          phases.every(
            (p: number, k: number): boolean =>
              Number.isFinite(p) && (k === 0 || p > phases[k - 1]!),
          ) &&
          phases[phases.length - 1]! - phases[0]! < 2 * Math.PI
        )
      ) {
        report(
          "ring phases",
          "the declared ring phases are not `samples` finite phases strictly increasing within one turn",
        );
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
      ...(field === undefined ? {} : { original }),
      diagnostics,
      continuity:
        chains.length === 0 && field?.regular !== true
          ? CONTINUITY
          : { phase: "C1", station: "C1" },
    };
  }
}

function polar(r: number, phi: number): [number, number] {
  return [r * Math.cos(phi), r * Math.sin(phi)];
}

/** Match the old continuation's numeric scale at the protected original local section. */
function sameJet(a: IAutoMovieLoftSectionJet, b: IAutoMovieLoftSectionJet): boolean {
  return (["p", "s", "t", "ss", "st", "tt"] as const).every((key): boolean =>
    a[key].length === 2 && a[key].every((x, i): boolean =>
      Number.isFinite(x) && Math.abs(x - b[key][i]!) <= 32 * Number.EPSILON * Math.max(1, Math.abs(x), Math.abs(b[key][i]!))));
}

/** The continuity every four-quarter chain carries. */
const CONTINUITY: IAutoMovieViewLoft.IResult["continuity"] = {
  phase: "C2",
  station: "C2",
};

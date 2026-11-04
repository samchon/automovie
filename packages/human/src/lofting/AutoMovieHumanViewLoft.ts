import { AutoMovieHumanLoftContract } from "./AutoMovieHumanLoftContract";
import type { AutoMovieHumanLoftFrame } from "./AutoMovieHumanLoftFrame";
import { AutoMovieHumanNaturalSpline } from "./AutoMovieHumanNaturalSpline";
import type { AutoMovieHumanPolarSector } from "./AutoMovieHumanPolarSector";
import { AutoMovieHumanSeamStation } from "./AutoMovieHumanSeamStation";
import { AutoMovieHumanSolidChain } from "./AutoMovieHumanSolidChain";
import { AutoMovieHumanSplineCurve } from "./AutoMovieHumanSplineCurve";
import { AutoMovieHumanViewSection } from "./AutoMovieHumanViewSection";
import type { IAutoMovieHumanLoftChain } from "./IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanSolidSurface } from "./IAutoMovieHumanSolidSurface";
import type { IAutoMovieHumanViewPart } from "./IAutoMovieHumanViewPart";

type Quarters<T> = IAutoMovieHumanViewPart.IQuarters<T>;

/**
 * The view-to-section operator: a part lofted from its own views in its own
 * frame (campaign #3044, construction step 1).
 *
 * At every station of the part (`IAutoMovieHumanViewPart.stations`) the four
 * outlines give the box about the axis, the fullness owner gives each
 * quarter's conic shoulder (solved from the girth, read from a sourced law, or
 * read from the top view), and `AutoMovieHumanViewSection` makes the section
 * that touches the box at its four guides. The section is written as the
 * periodic cubic B-spline through its points at `order` uniform polar
 * angles, so each guide is a knot and its point is the outline's value; the
 * layers are made C2 in station by the natural spline of every coefficient
 * and of the plane (`AutoMovieHumanSeamStation.continuous`), so every layer
 * carries the jets a solid operator reads.
 *
 * Continuity it publishes: C2 in phase (the periodic cubic B-spline) and C2
 * in station (the quintic station rule with the natural spline's curvatures),
 * so the chain is a host and a part for `AutoMovieHumanSolidMerge` and
 * `AutoMovieHumanSolidDiff` unchanged (`surface`).
 *
 * Totality: a station whose box is broken (an outline crossing its opposite,
 * a non-positive half extent) or whose fullness has no valid section is left
 * out of the chain with one diagnostic naming the part, the station and the
 * numbers; a girth outside the box's reach keeps the reach's end shape with
 * one diagnostic. Fewer than two surviving stations give no chain.
 */
export namespace AutoMovieHumanViewLoft {
  /** The operator's result. */
  export interface IResult {
    /** The chain under the part's name, or null when fewer than two stations survive. */
    chain: IAutoMovieHumanLoftChain | null;

    /** The chain as a solid surface for merge and diff, or null with the chain. */
    surface: IAutoMovieHumanSolidSurface | null;

    /** Each surviving station's section, by station. */
    sections: IStation[];

    /** Every broken premise. */
    diagnostics: AutoMovieHumanLoftContract.IDiagnostic[];

    /** The continuity the chain carries in phase and in station. */
    continuity: { phase: "C2"; station: "C2" };
  }

  /** One emitted station. */
  export interface IStation {
    /** Station, mm. */
    station: number;

    /** Its section plane. */
    frame: AutoMovieHumanLoftFrame.IFrame;

    /** Its section. */
    section: AutoMovieHumanViewSection.ISection;
  }

  /**
   * Loft a part from its views.
   *
   * @param part The part.
   * @returns The chain, its surface, its sections and its diagnostics.
   */
  export function create(part: IAutoMovieHumanViewPart): IResult {
    const diagnostics: AutoMovieHumanLoftContract.IDiagnostic[] = [];
    const producer: string = `view.${part.name}`;
    const report = (contract: string, detail: string): void => {
      diagnostics.push({ producer, level: 2, contract, detail });
    };
    const empty = (): IResult => ({ chain: null, surface: null, sections: [], diagnostics, continuity: CONTINUITY });

    // Inputs: stations, the order and every curve's knots.
    if (!(Number.isInteger(part.order) && part.order >= 8 && part.order % 4 === 0)) {
      report("order", `order ${part.order} is not a positive multiple of 4 of at least 8`);
      return empty();
    }
    const rising = (values: readonly number[]): boolean =>
      values.length >= 2 &&
      values.every((v: number, i: number): boolean => Number.isFinite(v) && (i === 0 || v - values[i - 1]! >= AutoMovieHumanLoftContract.LEAST_SPLINE_GAP));
    if (!rising(part.stations)) {
      report("stations", `stations [${part.stations.join(", ")}] are not at least two strictly increasing finite values`);
      return empty();
    }
    const curve = (name: string, outline: IAutoMovieHumanViewPart.IOutline): ((s: number) => number) | null => {
      const xs: number[] = outline.knots.map((k: IAutoMovieHumanViewPart.IKnot): number => k.station);
      if (!rising(xs) || !outline.knots.every((k: IAutoMovieHumanViewPart.IKnot): boolean => Number.isFinite(k.value))) {
        report("outline", `${name}: knots ${outline.knots.map((k: IAutoMovieHumanViewPart.IKnot): string => `${k.site}@${k.station}=${k.value}`).join(", ")} are not finite by strictly increasing station`);
        return null;
      }
      const spline: AutoMovieHumanNaturalSpline.ISpline = AutoMovieHumanNaturalSpline.create(
        xs,
        outline.knots.map((k: IAutoMovieHumanViewPart.IKnot): number => k.value),
      );
      return (s: number): number => AutoMovieHumanNaturalSpline.evaluate(spline, s);
    };
    const quarters = (name: string, outlines: Quarters<IAutoMovieHumanViewPart.IOutline> | undefined): ((s: number) => Quarters<number>) | null => {
      if (outlines === undefined) return (): Quarters<number> => [0, 0, 0, 0];
      const qs: (((s: number) => number) | null)[] = outlines.map(
        (o: IAutoMovieHumanViewPart.IOutline, q: number): ((s: number) => number) | null => curve(`${name} ${q}`, o),
      );
      if (qs.some((q: ((s: number) => number) | null): boolean => q === null)) return null;
      return (s: number): Quarters<number> => qs.map((q: ((s: number) => number) | null): number => q!(s)) as Quarters<number>;
    };
    const lateral: ((s: number) => number) | null = curve("front positive", part.front.positive);
    const medial: ((s: number) => number) | null = curve("front negative", part.front.negative);
    const ahead: ((s: number) => number) | null = curve("side positive", part.side.positive);
    const behind: ((s: number) => number) | null = curve("side negative", part.side.negative);
    const fullness: IAutoMovieHumanViewPart.Fullness = part.fullness;
    const owner: ((s: number) => number) | null =
      fullness.kind === "girth" ? curve("girth", fullness.girth) : fullness.kind === "shoulder" ? curve("shoulder", fullness.shoulder) : (): number => 0;
    const shoulders: ((s: number) => Quarters<number>) | null =
      fullness.kind === "top" ? quarters("top shoulder", fullness.shoulders) : quarters("departure", fullness.departures);
    if (lateral === null || medial === null || ahead === null || behind === null || owner === null || shoulders === null) return empty();

    // The pole's end station closes in a point and carries no section.
    const first: number = part.stations[0]!;
    const last: number = part.stations[part.stations.length - 1]!;
    const tip: number | null = part.pole === "bottom" ? first : part.pole === "top" ? last : null;

    const sections: IStation[] = [];
    for (const s of part.stations) {
      if (s === tip) continue;
      const at: string = `station ${s} mm`;

      // The box: each outline on its own side of the axis, and the opposite
      // edges apart.
      const signed: [number, number, number, number] = [lateral(s), ahead(s), medial(s), behind(s)];
      if (!(signed[0] > signed[2]) || !(signed[1] > signed[3])) {
        report("outline order", `${at}: an outline crosses its opposite (front ${signed[0]} over ${signed[2]} mm, side ${signed[1]} over ${signed[3]} mm)`);
        continue;
      }
      const extents: Quarters<number> = [signed[0], signed[1], -signed[2], -signed[3]];
      if (!extents.every((e: number): boolean => e > 0)) {
        report("half extent", `${at}: half extents [${extents.join(", ")}] mm; the axis must lie strictly inside the box`);
        continue;
      }
      const box: AutoMovieHumanViewSection.IBox = { extents };

      // The quarters' fullness from its owner.
      let section: AutoMovieHumanViewSection.ISection | null;
      if (fullness.kind === "girth") {
        const solved: AutoMovieHumanViewSection.ISolved = AutoMovieHumanViewSection.solve(`${producer} ${at}`, box, owner(s), shoulders(s));
        diagnostics.push(...solved.diagnostics);
        section = solved.section;
      } else {
        const r: Quarters<number> = shoulders(s).map((d: number): number => (fullness.kind === "top" ? d : owner(s) + d)) as Quarters<number>;
        if (!r.every((x: number): boolean => x > 0 && x < 1)) {
          report("shoulder", `${at}: shoulders [${r.join(", ")}] outside (0, 1)`);
          continue;
        }
        section = AutoMovieHumanViewSection.of(box, r);
        const fault: string | null = AutoMovieHumanViewSection.fault(section);
        if (fault !== null) {
          report("view section", `${at}: shoulders [${r.join(", ")}] on the box [${extents.join(", ")}] mm: ${fault}`);
          section = null;
        }
      }
      if (section === null) continue;
      sections.push({ station: s, frame: part.axis.at(s), section });
    }
    if (sections.length < 2) {
      report("stations", `${sections.length} of ${part.stations.length} stations carry a section; a chain needs two`);
      return { ...empty(), sections };
    }

    // Each section as the B-spline through its points at uniform angles.
    const N: number = part.order;
    const layers: IAutoMovieHumanLoftChain.ILayer[] = sections.map((st: IStation): IAutoMovieHumanLoftChain.ILayer => {
      const points: [number, number][] = Array.from({ length: N }, (_: unknown, m: number): [number, number] => {
        const phi: number = (2 * Math.PI * m) / N;
        const r: number = AutoMovieHumanViewSection.radius(st.section, phi)[0];
        return [r * Math.cos(phi), r * Math.sin(phi)];
      });
      const coefficients: number[] = AutoMovieHumanSplineCurve.interpolate(points);
      const s: AutoMovieHumanViewSection.ISection = st.section;
      return {
        y: st.station,
        frame: st.frame,
        coefficients,
        slopes: new Array<number>(coefficients.length).fill(0),
        view: {
          extents: [...s.box.extents],
          shoulders: [...s.shoulders],
          curvatures: s.guides.map((g: AutoMovieHumanPolarSector.IGuide): number => (g.value - g.curvature) / (g.value * g.value)) as Quarters<number>,
        },
      };
    });
    const pole: IAutoMovieHumanLoftChain["pole"] =
      tip === null ? undefined : { end: part.pole!, point: [...part.axis.at(tip).origin] };
    const chain: IAutoMovieHumanLoftChain = AutoMovieHumanSeamStation.continuous({
      name: part.name,
      basis: "spline",
      order: N,
      rule: "polar",
      samples: part.samples,
      layers,
      ...(pole !== undefined ? { pole } : {}),
    });
    const surface: IAutoMovieHumanSolidSurface | null = AutoMovieHumanSolidChain.surface(chain);
    if (surface === null) report("solid surface", "the chain does not read as a solid surface (no jets or a degenerate middle section)");
    return { chain, surface, sections, diagnostics, continuity: CONTINUITY };
  }
}

/** The continuity every emitted chain carries. */
const CONTINUITY: AutoMovieHumanViewLoft.IResult["continuity"] = { phase: "C2", station: "C2" };

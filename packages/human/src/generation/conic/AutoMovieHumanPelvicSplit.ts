import {
  AutoMovieConstructionSplitCourses,
  AutoMovieConstructionSplitPrepared,
  AutoMovieLoftViewFullSource as Full,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionSplit,
  IAutoMovieConstructionSplitBand,
  IAutoMovieConstructionSplitCompose,
  IAutoMovieHumanTrunkBuild,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import { AutoMovieHumanGlutealRelief } from "../AutoMovieHumanGlutealRelief";
import { AutoMovieHumanLegMedialSource } from "../leg/AutoMovieHumanLegMedialSource";
import { AutoMovieHumanBranchClock } from "./AutoMovieHumanBranchClock";
import { AutoMovieHumanDigitalSection as Section } from "./AutoMovieHumanDigitalSection";
import { AutoMovieHumanPelvicChordChart } from "./AutoMovieHumanPelvicChordChart";
import { AutoMovieHumanPelvicCut } from "./AutoMovieHumanPelvicCut";
import { AutoMovieHumanPelvicFore } from "./AutoMovieHumanPelvicFore";
import { AutoMovieHumanPelvicGraphPatch } from "./AutoMovieHumanPelvicGraphPatch";
import { AutoMovieHumanPelvicMedialConic } from "./AutoMovieHumanPelvicMedialConic";
import { AutoMovieHumanPelvicMedialLoft } from "./AutoMovieHumanPelvicMedialLoft";
import { AutoMovieHumanPelvicMedian } from "./AutoMovieHumanPelvicMedian";
import { AutoMovieHumanPelvicMesh } from "./AutoMovieHumanPelvicMesh";
import { AutoMovieHumanPelvicRegistration } from "./AutoMovieHumanPelvicRegistration";
import { AutoMovieHumanPelvicSaddle } from "./AutoMovieHumanPelvicSaddle";

/** The actual trunk and both protected thighs define one pelvic split. */
export namespace AutoMovieHumanPelvicSplit {
  /** Maximum chord error, mm, shared by the two samples of the same saddle. */
  const CHORD_MM: number = 0.01;

  /** The same complete source reader that serves the original owned surfaces. */
  type Owner = {
    part: IAutoMovieViewPart;
    field: IAutoMovieLoftViewFullSource.IReader;
  };

  /** A whole lower branch and the unchanged thigh whose rail belongs to it. */
  export interface IBranch {
    /** The identical thigh original used by the construction tree. */
    part: IAutoMovieViewPart;
    /** The thigh with its already declared foot and toe descendants. */
    branch: IAutoMovieConstructionNode;
  }

  /** A single real sagittal field shared by both incident panels. */
  export interface IAuthoredMedian {
    /** Measured cardinal source and its own ordered world reader. */
    cardinal: ReturnType<typeof AutoMovieHumanPelvicMedian.cardinal>;

    /** The original pelvis with the same curve in its divider descriptors. */
    source: Exclude<ReturnType<typeof retained>, string>;
  }

  /** Put the real sagittal boundary on the split source and both panels. */
  export function authoredMedian(
    source: Exclude<ReturnType<typeof retained>, string>,
    parent: Owner["field"],
    chordMm: number,
  ): IAuthoredMedian {
    const cardinal = AutoMovieHumanPelvicMedian.cardinal(
      source,
      parent,
      chordMm,
    );
    return {
      cardinal,
      source: {
        ...source,
        guide: cardinal.guide,
        input: {
          ...source.input,
          dividers: source.input.dividers.map((divider) => ({
            ...divider,
            guide: cardinal.guide,
          })),
        },
      },
    };
  }

  /** The complete original input to the physical anterior and posterior faces. */
  export interface IMedial {
    /** The same source and sagittal guide carried by both incident panels. */
    authored: ReturnType<typeof authoredMedian>;

    /** Original exterior and protected end courses. */
    raw: Exclude<
      ReturnType<typeof AutoMovieConstructionSplitCourses.prepare>,
      string
    >;

    /** Each original thigh arc in the physical median's clock. */
    registration: ReturnType<typeof AutoMovieHumanPelvicRegistration.prepare>;

    /** Native transverse conic courses. */
    conic: ReturnType<typeof AutoMovieHumanPelvicMedialConic.prepare>;

    /** Original tangent-plane connections through the median conic. */
    loft: ReturnType<typeof AutoMovieHumanPelvicMedialLoft.prepare>;
  }

  /** Prepare the composed medial sources once in ordinary construction units. */
  export function medial(
    source: Exclude<ReturnType<typeof retained>, string>,
    parent: Owner["field"],
    chordMm: number,
  ): IMedial | string {
    const authored = authoredMedian(source, parent, chordMm);
    const raw = AutoMovieConstructionSplitCourses.prepare(
      { ...authored.source.input, radialContact: false },
      false,
    );
    if (typeof raw === "string") return raw;
    const registration = AutoMovieHumanPelvicRegistration.prepare(
      authored.source,
      raw,
    );
    const conic = AutoMovieHumanPelvicMedialConic.prepare(
      authored.source,
      authored.cardinal,
      raw,
      registration,
    );
    return {
      authored,
      raw,
      registration,
      conic,
      loft: AutoMovieHumanPelvicMedialLoft.prepare(
        authored.source,
        raw,
        conic.charts,
      ),
    };
  }

  /** The original generators and first-order fields of both medial panels. */
  export interface IPhysical {
    /** The fixed original chord charts through the common and outer curves. */
    charts: ReturnType<typeof AutoMovieHumanPelvicChordChart.prepare>;

    /** Prepared physical anterior section sources, one per receiving thigh. */
    fore: ReturnType<typeof AutoMovieHumanPelvicFore.prepareLoft>;

    /** Prepare one demanded posterior section per distinct original phase. */
    rear(
      side: number,
      stations: readonly number[],
      phases: readonly number[],
    ): ReturnType<typeof AutoMovieHumanPelvicGraphPatch.rear>;
  }

  /** Compose both physical faces directly from the person's owned source. */
  export function physical(medial: IMedial): IPhysical {
    const charts = AutoMovieHumanPelvicChordChart.prepare(medial.loft);
    const projection = charts.map((chart) => [
      AutoMovieHumanPelvicChordChart.projection(chart, false),
      AutoMovieHumanPelvicChordChart.projection(chart, true),
    ]);
    const sagittal = AutoMovieHumanPelvicMedian.regularFore(
      medial.authored.source,
    );
    const fore = AutoMovieHumanPelvicFore.prepareLoft(
      medial.raw,
      medial.loft,
      projection.map(([front]) => front!),
      sagittal,
    );
    return {
      charts,
      fore,
      rear: (side, stations, phases) =>
        AutoMovieHumanPelvicGraphPatch.rear(
          charts[side]!,
          projection[side]![1]!,
          stations,
          phases,
        ),
    };
  }

  /** The actual source coordinates of one receiving-and-parent wire. */
  export interface IPhysicalWire {
    /** Points at the true parent cut or sagittal boundary. */
    parent: P3[];

    /** World positions on the same original receiving thigh ring. */
    child: P3[];

    /** Original parent phase at each point, with the seam's first fork phase. */
    parentPhases: number[];

    /** Protected receiving phases, lifted in one ordered native revolution. */
    childPhases: number[];

    /** Original fork, exact common middle and opposite fork in this wire. */
    transverse: readonly [number, number, number];
  }

  /**
   * Sample the original outer and medial boundaries once for both incident
   * faces. The medial phase count is even so the physical same-AP point belongs
   * to the receiving ring and to both adjoining face plans.
   */
  export function wire(
    medial: IMedial,
    side: number,
    quarter: number,
  ): IPhysicalWire {
    const { edges } = medial.raw.jets[side]!;
    const exterior = edges[0]!;
    const inside = edges[1]!;
    if (
      !(
        quarter >= 2 &&
        quarter % 2 === 0 &&
        edges.length === 2 &&
        exterior.bodyPhase !== undefined &&
        inside.seam !== undefined
      )
    )
      throw new Error(
        "The physical pelvic wire needs one original exterior and two medial halves",
      );
    const registration = medial.registration[side]!;
    const guide = medial.authored.cardinal.guide;
    const cut = medial.authored.source.input.parent.cut;
    const endpoint = exterior.bodyPhase(1);
    const samples = Array.from({ length: 4 * quarter }, (_, i) => {
      if (i < 3 * quarter) {
        const t = i / (3 * quarter);
        const parentPhase = exterior.bodyPhase!(t);
        const child = exterior.course(t);
        return {
          parent: cut.point(parentPhase),
          child: child.controls.at(-1)!,
          parentPhase,
          childPhase: child.phase,
        };
      }
      const t = (i - 3 * quarter) / quarter;
      const v = inside.seam!.reverse ? 1 - t : t;
      const child = registration.receive(v);
      return {
        parent: guide.at(v).p,
        child: child.q.p,
        parentPhase: endpoint,
        childPhase: child.phase,
      };
    });
    const childPhases: number[] = [];
    for (const { childPhase } of samples) {
      const previous = childPhases.at(-1);
      const delta = previous === undefined ? 0 : childPhase - previous;
      childPhases.push(
        previous === undefined
          ? childPhase
          : previous + Math.atan2(Math.sin(delta), Math.cos(delta)),
      );
    }
    const forks: [number, number, number] = [3 * quarter, (7 * quarter) / 2, 0];
    if (inside.seam.reverse) [forks[0], forks[2]] = [forks[2], forks[0]];
    return {
      parent: samples.map(({ parent }) => parent),
      child: samples.map(({ child }) => child),
      parentPhases: samples.map(({ parentPhase }) => parentPhase),
      childPhases,
      transverse: forks,
    };
  }

  /** Declare the production split from whole lower branches and original skin. */
  export function production(
    parent: IAutoMovieViewPart,
    host: IAutoMovieConstructionNode,
    left: IBranch,
    right: IBranch,
    continued?: { gluteal: IAutoMovieHumanTrunkBuild.IMassLaw | null },
  ) {
    const owner = (part: IAutoMovieViewPart): Owner => ({
      part,
      field: Full.create(part),
    });
    try {
      const hostSource = owner(parent);
      const receivers = [owner(left.part), owner(right.part)] as const;
      const native =
        continued === undefined
          ? source(hostSource, receivers, CHORD_MM)
          : retained(hostSource, receivers, CHORD_MM, continued.gluteal);
      if (typeof native === "string") return native;
      const branches = [left.branch, right.branch] as const;
      if (continued === undefined) return prepare(native, host, branches);
      const thighs = native.rails.map((rail) =>
        owner(
          AutoMovieHumanLegMedialSource.fromRail(rail, native.datum, CHORD_MM),
        ),
      );
      const revised = retained(
        hostSource,
        [thighs[0]!, thighs[1]!],
        CHORD_MM,
        continued.gluteal,
      );
      return typeof revised === "string"
        ? revised
        : preparePhysical(revised, hostSource.field, host, branches);
    } catch (error: unknown) {
      return error instanceof Error ? error.message : String(error);
    }
  }

  /**
   * Continue the original radial courses and retain authored crests where
   * present.
   */
  export function retained(
    parent: Owner,
    donors: readonly [Owner, Owner],
    chordMm: number,
    gluteal: IAutoMovieHumanTrunkBuild.IMassLaw | null,
    stations?: readonly [number, number],
  ): ReturnType<typeof source> {
    const graphs = gluteal === null ? [] : (parent.part.originalGraphs ?? []);
    if (gluteal !== null && graphs.length === 0)
      return "The pelvic split has no prepared native gluteal graph";
    const crests = (): [number, number] | undefined => {
      if (gluteal === null) return undefined;
      const [, y, z] = gluteal.target;
      const row = parent.field.pointAt(y);
      return [
        AutoMovieHumanGlutealRelief.posteriorPhase(row, z, 1),
        2 * Math.PI - AutoMovieHumanGlutealRelief.posteriorPhase(row, -z, -1),
      ];
    };
    const input = source(
      parent,
      donors,
      chordMm,
      stations,
      "continued",
      crests(),
    );
    if (typeof input === "string") return input;
    const { parent: cut } = input.input;
    return {
      ...input,
      input: {
        ...input.input,
        radial: true,
        radialContact: true,
        parent:
          graphs.length === 0
            ? cut
            : {
                ...cut,
                forwardWeight: (phase): number => {
                  const station = cut.station(phase);
                  return Math.max(
                    0,
                    ...graphs.map((graph) => graph.weight(station, phase)),
                  );
                },
              },
      },
    };
  }

  /** The root ring, anatomical median and both native receiving sections. */
  export function source(
    parent: Owner,
    donors: readonly [Owner, Owner],
    chordMm: number,
    stations?: readonly [number, number],
    mode: "original" | "osculating" | "continued" = "original",
    retainedCrests?: readonly [number, number],
  ) {
    const station: number | undefined = parent.field.regular?.[0];
    if (station === undefined)
      return "The pelvis has no common regular trunk section";
    const axes = parent.part.axis.at(station);
    const forward: P3 = Vec.unit(Vec.cross(axes.u, axes.v))!;
    // The original trunk closes in the person's measured perineal datum.
    const datum: P3 = parent.field.point(parent.field.domain[0], 0);
    const origin: P3 = axes.origin;
    const normal: P3 = Vec.scale(axes.v, -1);
    const median: P3 = Vec.add(
      origin,
      Vec.scale(normal, Vec.dot(Vec.sub(datum, origin), normal)),
    );
    const estimatedReach: number = Vec.dot(Vec.sub(datum, origin), forward);
    const forks: [number, number] = [0, Math.PI];
    const outward = [Vec.scale(normal, -1), normal];
    const envelopes =
      mode === "continued"
        ? outward.map((side) =>
            AutoMovieHumanPelvicCut.envelope(
              parent.part,
              parent.field,
              station,
              side,
            ),
          )
        : [];
    const failed = envelopes.filter((entry) => typeof entry === "string");
    if (failed.length !== 0) return failed.join("\n");
    const widest = envelopes.filter((entry) => typeof entry !== "string");
    const actual = donors.map(({ part, field }, i) => {
      const rail =
        stations?.[i] ??
        part.front.positive.knots.find(({ site }) => site === "thigh")?.station;
      if (rail === undefined)
        return `${part.name}: no protected original thigh section`;
      const side = outward[i]!;
      const section = (s: number) => {
        const at = {
          point: field.pointAt(s),
          jet: (phase: number) => field.jet(s, phase),
        };
        const tape: P3[] = Array.from({ length: part.samples }, (_, k) =>
          at.point((2 * Math.PI * k) / part.samples),
        );
        const medial = Section.support(at, Vec.scale(side, -1), tape);
        const lateral = Section.support(at, side, tape);
        const clearance: number = Vec.dot(Vec.sub(medial.p, median), side);
        const near = Section.support(at, Vec.scale(forward, -1), tape);
        const reach: number = Vec.dot(Vec.sub(near.p, origin), forward);
        return {
          part,
          field,
          station: s,
          at,
          tape,
          reach,
          medial,
          lateral,
          outward: side,
          clearance,
        };
      };
      const envelope = widest[i];
      if (envelope === undefined) return section(rail);
      const support = envelope.at(envelope.widest).p;
      const knee = part.front.positive.knots.find(
        ({ site }) => site === "knee",
      )?.station;
      if (knee === undefined)
        return `${part.name}: the original thigh has no distal bound`;
      // Use the first original section with resolvable separation and a
      // lateral line that tapers into its native ray. Half one native phase
      // interval on either side of the stationary support measures the
      // original contour's signed resolution at this exact dividing plane.
      const halfPhase = Math.PI / part.samples;
      for (const s of [
        rail,
        ...part.stations.filter((value) => rail < value && value < knee),
      ]) {
        const candidate = section(s);
        const { phase, p } = candidate.medial;
        const resolution = Math.max(
          0,
          Vec.dot(Vec.sub(candidate.at.point(phase - halfPhase), p), side),
          Vec.dot(Vec.sub(candidate.at.point(phase + halfPhase), p), side),
        );
        const inward: number = -Vec.dot(
          AutoMovieHumanPelvicCut.transverse(candidate.lateral),
          side,
        );
        const width: number = Vec.dot(
          Vec.sub(support, candidate.lateral.p),
          side,
        );
        if (
          candidate.clearance > resolution &&
          candidate.reach > estimatedReach &&
          inward > 0 &&
          width > 0
        )
          return candidate;
      }
      return `${part.name}: the original thigh has no separated narrowing section in the pelvic envelope`;
    });
    const missing = actual.filter(
      (rail): rail is string => typeof rail === "string",
    );
    if (missing.length !== 0) return missing.join("\n");
    const known = actual.filter((rail) => typeof rail !== "string");
    const shape =
      mode === "continued"
        ? AutoMovieHumanPelvicCut.cut(
            station,
            widest.map(({ widest }) => widest),
            true,
            retainedCrests,
          )
        : AutoMovieHumanPelvicCut.prepare(
            parent.part,
            parent.field,
            station,
            known.map(({ outward, lateral }) => ({
              normal: outward,
              jet: lateral,
            })),
            forward,
            retainedCrests,
          );
    if (typeof shape === "string") return shape;
    const point = (phase: number): P3 =>
      parent.field.point(shape.cut(phase)[0], phase);
    const jet = (phase: number): IAutoMovieSolidSurface.IJet => {
      const [s, ds, dds] = shape.cut(phase);
      const j = parent.field.jet(s, phase);

      // The parent owns the native two-jet after substituting s(phase)-u.
      return {
        ...j,
        u: Vec.scale(j.u, -1),
        v: Vec.add(j.v, Vec.scale(j.u, ds)),
        uv: Vec.scale(Vec.add(j.uv, Vec.scale(j.uu, ds)), -1),
        vv: Vec.combine([
          [1, j.vv],
          [2 * ds, j.uv],
          [ds * ds, j.uu],
          [dds, j.u],
        ]),
      };
    };
    if (
      forks.some(
        (phase) =>
          Math.abs(Vec.dot(Vec.sub(point(phase), median), normal)) >
          Number.EPSILON * Vec.norm(origin),
      )
    )
      return "The two native sagittal cardinals do not lie on the person's median plane";
    const rails = known.map(({ at, tape, part, station, ...rail }, i) => {
      const arc: readonly [number, number] =
        i === 0 ? [0, Math.PI] : [Math.PI, 2 * Math.PI];
      const clock = AutoMovieHumanBranchClock(
        jet,
        arc,
        at,
        tape,
        part.axis.at(station),
      );
      return typeof clock === "string"
        ? `${part.name}: ${clock}`
        : { ...rail, part, station, clock };
    });
    const refusals = rails.filter(
      (rail): rail is string => typeof rail === "string",
    );
    if (refusals.length !== 0) return refusals.join("\n");
    const real = rails.filter((rail) => typeof rail !== "string");
    const medialMiddle: P3 = Vec.scale(
      Vec.add(real[0]!.medial.p, real[1]!.medial.p),
      0.5,
    );
    const saddlePoint: P3 = Vec.add(
      datum,
      Vec.scale(axes.u, Vec.dot(Vec.sub(medialMiddle, datum), axes.u)),
    );
    const guide = AutoMovieHumanPelvicSaddle(
      [jet(forks[0]), jet(forks[1])],
      saddlePoint,
      normal,
      forward,
      chordMm,
      mode !== "original",
    );
    if (typeof guide === "string") return guide;
    const input: AutoMovieConstructionSplitCourses.IInput = {
      parent: {
        field: parent.field,
        cut: { point, jet },
        proximal: station,
        phaseStart: 0,
        station: (phase): number => shape.cut(phase)[0],
      },
      rails: real,
      forks: [forks],
      dividers: [{ point: median, normal, estimatedReach, guide }],
      forward,
      up: axes.u,
    };
    return {
      parent: parent.part,
      station,
      datum,
      rails: real,
      input,
      guide,
      shape,
    };
  }

  /** Construction and original source authorities for one complete pelvic split. */
  export interface IPrepared {
    /** Construction topology of both retained branches. */
    node: IAutoMovieConstructionSplit;

    /** The native face charts and their exact shared boundaries. */
    bands: IAutoMovieConstructionSplitBand.IPreparedStrip[];

    /** Both actual thigh continuations at publication. */
    parts: readonly IAutoMovieViewPart[];

    /** Actual parent contour in the original trunk coordinates. */
    cut: IAutoMovieConstructionSplitCompose.ParentCut;

    /** Station associated with each native receiving thigh. */
    rails: ReadonlyMap<string, number>;
  }

  /** Use the first-order source on the same body topology and protected loops. */
  export function preparePhysical(
    native: Exclude<ReturnType<typeof source>, string>,
    parent: Owner["field"],
    host: IAutoMovieConstructionNode,
    branches: readonly [IAutoMovieConstructionNode, IAutoMovieConstructionNode],
  ): IPrepared | string {
    const source = medial(native, parent, CHORD_MM);
    return typeof source === "string"
      ? source
      : prepare(source.authored.source, host, branches, source);
  }

  /**
   * Prepare the engine's existing shared-incidence topology on the native
   * pelvic curves.
   */
  export function prepare(
    native: Exclude<ReturnType<typeof source>, string>,
    host: IAutoMovieConstructionNode,
    branches: readonly [IAutoMovieConstructionNode, IAutoMovieConstructionNode],
    medialSource?: IMedial,
  ): IPrepared | string {
    const { input, parent, rails, shape } = native;
    const bandNames: string[] = rails.map(({ part }) => `groin.${part.name}`);
    const geometry = AutoMovieConstructionSplitPrepared.prepare(
      medialSource === undefined ? input : { ...input, radialContact: false },
      bandNames,
      medialSource?.raw,
    );
    if (typeof geometry === "string") return geometry;
    const bands = geometry.bands;
    if (medialSource !== undefined) {
      const skin = physical(medialSource);
      for (const [side, original] of bands.entries()) {
        const boundary = wire(medialSource, side, geometry.count / 4);
        const band: IAutoMovieConstructionSplitBand.IPreparedStrip = {
          ...original,
          loop: boundary.parent,
          phases: boundary.parentPhases,
          childPhases: boundary.childPhases,
          terminal: {
            receiving: boundary.child,
            prepare: (parent, child, firstId, orientation) =>
              AutoMovieHumanPelvicMesh.prepare({
                side,
                geometry: skin,
                band: {
                  ...original,
                  surface: { ...original.surface, orientation },
                },
                wire: boundary,
                parent,
                child,
                firstId,
              }),
          },
        };
        bands[side] = band;
      }
    }
    const children = branches.map(
      (part, i): IAutoMovieConstructionSplit.IChild => ({
        part,
        partFace: rails[i]!.part.name,
        partEnd: "bottom",
        band: bandNames[i]!,
        rail: rails[i]!.reach / 1000,
      }),
    );
    const node: IAutoMovieConstructionSplit = {
      type: "split",
      name: "split.pelvis",
      host,
      hostFace: parent.name,
      hostEnd: "bottom",
      seam: input.forks[0]!,
      count: geometry.count,
      rows: geometry.rows,
      children: [children[0]!, children[1]!],
    };
    return {
      node,
      bands,
      parts: rails.map(({ part }) => part),
      cut: shape.cut,
      rails: new Map(rails.map(({ part, station }) => [part.name, station])),
    };
  }
}

import {
  AutoMovieConstructionSplitCourses,
  AutoMovieConstructionSplitPrepared,
  AutoMovieLoftViewFullSource as Full,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionSplit,
  IAutoMovieHumanTrunkBuild,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import { AutoMovieHumanGlutealRelief } from "../AutoMovieHumanGlutealRelief";
import { AutoMovieHumanBranchClock } from "./AutoMovieHumanBranchClock";
import { AutoMovieHumanDigitalSection as Section } from "./AutoMovieHumanDigitalSection";
import { AutoMovieHumanPelvicCut } from "./AutoMovieHumanPelvicCut";
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
      return typeof native === "string"
        ? native
        : prepare(native, host, [left.branch, right.branch]);
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
      // Use the first original section whose enclosed loop lies on its own
      // side of the median and whose lateral line tapers into its native ray.
      // The true widest point has no lateral departure slope. The radial
      // quintic then sets its derivative budget from the actual chord.
      for (const s of [
        rail,
        ...part.stations.filter((value) => rail < value && value < knee),
      ]) {
        const candidate = section(s);
        const inward: number = -Vec.dot(
          AutoMovieHumanPelvicCut.transverse(candidate.lateral),
          side,
        );
        const width: number = Vec.dot(
          Vec.sub(support, candidate.lateral.p),
          side,
        );
        if (
          candidate.clearance > 0 &&
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

  /**
   * Prepare the engine's existing shared-incidence topology on the native
   * pelvic curves.
   */
  export function prepare(
    native: Exclude<ReturnType<typeof source>, string>,
    host: IAutoMovieConstructionNode,
    branches: readonly [IAutoMovieConstructionNode, IAutoMovieConstructionNode],
  ) {
    const { input, parent, rails, shape } = native;
    const bandNames: string[] = rails.map(({ part }) => `groin.${part.name}`);
    const geometry = AutoMovieConstructionSplitPrepared.prepare(
      input,
      bandNames,
    );
    if (typeof geometry === "string") return geometry;
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
      bands: geometry.bands,
      cut: shape.cut,
      rails: new Map(rails.map(({ part, station }) => [part.name, station])),
    };
  }
}

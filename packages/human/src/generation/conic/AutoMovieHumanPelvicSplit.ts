import {
  AutoMovieConstructionSplitCourses,
  AutoMovieConstructionSplitPrepared,
  AutoMovieLoftViewFullSource as Full,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionSplit,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

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
  ) {
    const owner = (part: IAutoMovieViewPart): Owner => ({
      part,
      field: Full.create(part),
    });
    try {
      const native = source(
        owner(parent),
        [owner(left.part), owner(right.part)],
        CHORD_MM,
      );
      return typeof native === "string"
        ? native
        : prepare(native, host, [left.branch, right.branch]);
    } catch (error: unknown) {
      return error instanceof Error ? error.message : String(error);
    }
  }

  /** The root ring, anatomical median and both native receiving sections. */
  export function source(
    parent: Owner,
    donors: readonly [Owner, Owner],
    chordMm: number,
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
    const actual = donors.map(({ part, field }, i) => {
      const rail = part.front.positive.knots.find(
        ({ site }) => site === "thigh",
      )?.station;
      if (rail === undefined)
        return `${part.name}: no protected original thigh section`;
      const at = {
        point: field.pointAt(rail),
        jet: (phase: number) => field.jet(rail, phase),
      };
      const tape: P3[] = Array.from({ length: part.samples }, (_, k) =>
        at.point((2 * Math.PI * k) / part.samples),
      );
      const outward: P3 = Vec.scale(normal, i === 0 ? -1 : 1);
      const medial = Section.support(at, Vec.scale(outward, -1), tape);
      const lateral = Section.support(at, outward, tape);
      const clearance: number = Vec.dot(Vec.sub(medial.p, median), outward);
      const near = Section.support(at, Vec.scale(forward, -1), tape);
      const reach: number = Vec.dot(Vec.sub(near.p, origin), forward);
      return {
        part,
        field,
        station: rail,
        at,
        tape,
        reach,
        medial,
        lateral,
        outward,
        clearance,
      };
    });
    const missing = actual.filter(
      (rail): rail is string => typeof rail === "string",
    );
    if (missing.length !== 0) return missing.join("\n");
    const known = actual.filter((rail) => typeof rail !== "string");
    const shape = AutoMovieHumanPelvicCut(
      parent.part,
      parent.field,
      station,
      known.map(({ outward, lateral }) => ({ normal: outward, jet: lateral })),
      forward,
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

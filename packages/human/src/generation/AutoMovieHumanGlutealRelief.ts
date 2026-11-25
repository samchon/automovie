import {
  AutoMovieIllinois,
  AutoMovieLoftViewFullSource as Full,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type {
  IAutoMovieHumanGlutealRelief,
  IAutoMovieHumanTrunkBuild,
  IAutoMovieHumanTrunkFeature,
  IAutoMovieLoftRelief,
  IAutoMovieViewPart,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import { AutoMovieHumanTrunkReliefNet } from "./AutoMovieHumanTrunkReliefNet";
import { AutoMovieHumanMammaryChart as Chart } from "./trunk/AutoMovieHumanMammaryChart";

/**
 * The buttocks merged into the trunk: the left gluteal mass sampled as a relief
 * window over the trunk's chart on the posterior sectors, moving the base along
 * the gluteal axis, and the right window its reflection (rule J6). The window
 * starts at the crotch ring and vanishes there with its slope and curvature
 * (J7), so the ring the legs share is untouched.
 */
export namespace AutoMovieHumanGlutealRelief {
  /** Prepare both gluteal crests over the actual original rear trunk wall. */
  export function source(
    part: IAutoMovieViewPart,
    law: IAutoMovieHumanTrunkBuild.IMassLaw,
  ): IAutoMovieViewPart {
    const field = Full.create(part);
    const [x, y, z] = law.target;
    const [up, lateral, down, medial] = law.footprint;
    const row = field.pointAt(y);
    const start = Math.max(y - down, field.domain[0]);
    const end = Math.min(y + up, field.domain[1]);
    const crests = [1, -1].map((side): IAutoMovieLoftRelief.IGraph => {
      const phase = posteriorPhase(row, side * z, side);
      const native = field.jet(y, phase);
      const pitch = Vec.norm(native.v);
      const projection = native.p[0] - x;
      const edges = [
        posteriorPhase(row, side * (z - medial), side),
        posteriorPhase(row, side * (z + lateral), side),
      ];
      const lo = Math.min(...edges);
      const hi = Math.max(...edges);
      if (
        !(
          projection > 0 &&
          pitch > 0 &&
          start < y &&
          y < end &&
          lo < phase &&
          phase < hi
        )
      )
        throw new Error(
          "The gluteal point has no interior rear source footprint",
        );
      // ESTIMATE. The local sagittal osculating circle uses the actual
      // inferior support reach as its half-chord. The longer iliocristale
      // reach bounds the upper aperture. The original wall and anatomical
      // depth form a convex pair in the native region.
      // https://doi.org/10.1002/ca.23988
      const chart = Chart.prepare({
        centre: [y, phase],
        pitch,
        apex: x,
        projection,
        sagittalReach: y - start,
        reaches: {
          up: end - y,
          down: y - start,
          plusV: (hi - phase) * pitch,
          minusV: (phase - lo) * pitch,
        },
      });
      return {
        name: `trunk.buttock.${side > 0 ? "left" : "right"}`,
        stations: [start, end],
        phases: [lo, hi],
        axis: [-1, 0, 0],
        target: -x,
        weight: chart.weight,
        phase: chart.weightPhase,
        jet: chart.weightJet,
      };
    });
    return {
      ...part,
      originalGraphs: [...(part.originalGraphs ?? []), ...crests],
    };
  }

  /** Read a physical posterior landmark on the existing level trunk. */
  export function posteriorPhase(
    row: (phase: number) => P3,
    site: number,
    side: number,
  ): number {
    const phase = AutoMovieIllinois.root(
      (t) => row(side * t)[2] - site,
      Math.PI / 2,
      Math.PI,
      Number.EPSILON * Math.PI,
      100,
    );
    if (phase === null)
      throw new Error("The gluteal site leaves the original posterior section");
    return side > 0 ? phase : 2 * Math.PI - phase;
  }

  /**
   * Both buttocks' windows.
   *
   * @param input The dome, the base and the phase map.
   * @returns The left and the right window; none when the dome has no height.
   */
  export function create(
    input: IAutoMovieHumanGlutealRelief.IInput,
  ): IAutoMovieLoftRelief[] {
    const dome: IAutoMovieHumanTrunkFeature = input.dome;
    if (!(dome.height(dome.apex[0], dome.apex[1]) > 0)) return [];
    const o: [number, number, number] = dome.frame.origin;
    const stations: [number, number] = [
      o[1] + dome.reach.v[0],
      o[1] + dome.reach.v[1],
    ];

    // On the back the phase falls as the lateral place rises, so the window's
    // phases run from the lateral edge (smaller z, larger phase is the midline).
    const lateralOf = (u: number): number => o[2] + u * dome.frame.lateral[2];
    const edges: number[] = [
      input.phaseOf(lateralOf(dome.reach.u[0])),
      input.phaseOf(lateralOf(dome.reach.u[1])),
    ];
    const phases: [number, number] = [Math.min(...edges), Math.max(...edges)];
    const apex: [number, number] = [
      (o[1] - stations[0]) / (stations[1] - stations[0]),
      (input.phaseOf(lateralOf(dome.apex[0])) - phases[0]) /
        (phases[1] - phases[0]),
    ];
    const left: IAutoMovieLoftRelief = AutoMovieHumanTrunkReliefNet.fromFeature(
      "trunk.buttock.left",
      dome,
      { stations, phases, apex },
      input.base,
    );

    return [
      left,
      AutoMovieHumanTrunkReliefNet.mirror(left, "trunk.buttock.right"),
    ];
  }
}

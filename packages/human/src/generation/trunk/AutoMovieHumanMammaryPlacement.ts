import {
  AutoMovieIllinois,
  AutoMovieLoftViewFullSource as Full,
} from "@automovie/engine";
import type {
  IAutoMovieHumanMammaryJoin,
  IAutoMovieViewPart,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import { AutoMovieHumanMammaryJoin } from "../AutoMovieHumanMammaryJoin";
import { AutoMovieHumanArmscyeOpening } from "../arm/AutoMovieHumanArmscyeOpening";
import { AutoMovieHumanMammaryChart } from "./AutoMovieHumanMammaryChart";

/** Place both breast roots in the original trunk's physical station/phase chart. */
export namespace AutoMovieHumanMammaryPlacement {
  /** Prepare a calibrated chest row in one local analytical tape trial. */
  export type Row = (phase: number) => [number, number];

  /** Both root curves and their chart placement can read the same original row. */
  export interface IPrepared {
    /** Both vertical root extents, calibration mm. */
    readonly domain: [number, number];
    /** Place and prepare both native graphs on the supplied chest section. */
    section(row: Row): AutoMovieHumanMammaryChart.IChart[];
  }

  /** Read the same two lifted skin sectors at one chest tape trial. */
  export function tape(plan: IPrepared, original: Row, station: number): Row {
    const lifts = plan.section(original).map((chart) => chart.pointAt(station));
    return (phase) => {
      const [x, z] = original(phase);
      return [lifts.reduce((value, lift) => lift(phase, value), x), z];
    };
  }

  /**
   * The four clinical landmarks and the actual anterior armscye determine the
   * native chart. The lateral root follows the original port's front meridian
   * down the torso; Wesselius et al.'s midaxillary line is the lateral limit.
   *
   * @see https://doi.org/10.1007/s00238-018-1431-2
   */
  export function prepare(
    torso: IAutoMovieViewPart,
    marks: IAutoMovieHumanMammaryJoin.IPlacement,
    datum: AutoMovieHumanArmscyeOpening.IProduction,
    target: P3,
  ): IPrepared {
    const arms = AutoMovieHumanArmscyeOpening.prepare(
      torso,
      datum.lower,
      datum.upper,
    );
    const field = arms.wall;
    const navel: P3 = field.point(marks.umbilicus, 0);
    const bounds = (["left", "right"] as const).map((name) => {
      const side = name === "left" ? 1 : -1;
      const arm = marks.arm(name);
      if (arm === null)
        throw new Error(`the actual ${name} axillary source is unavailable`);
      const opening = arms.arm(arm, name, {
        firstClearRing: false,
        medialTorso: false,
      });
      const front = opening.physical(Math.PI / 2).point;
      const angle = Math.atan2(Math.sin(front[1]), Math.cos(front[1]));
      const source = field.point(...front);
      const up: P3 = [0, 1, 0];
      const f = AutoMovieHumanMammaryJoin.footprint(
        { origin: target, u: up, v: [0, 0, -1] },
        {
          ...marks,
          up,
          bust: target,
          umbilicus: navel,
          armpitFront: [source[0], source[1], side * source[2]],
        },
        torso,
      );
      return {
        side,
        outward: side * Math.min(Math.PI / 2, side * angle),
        sternum: side * (target[2] - f.reaches.plusV),
        up: f.reaches.up,
        down: f.reaches.down,
      };
    });
    const domain: [number, number] = [
      target[1] - Math.max(...bounds.map(({ down }) => down)),
      target[1] + Math.max(...bounds.map(({ up }) => up)),
    ];
    const regular = field.regular;
    if (regular === null || !(domain[0] > regular[0] && domain[1] < regular[1]))
      throw new Error("the bilateral root extends outside the original thorax");
    // The phase scaling is derived once from the first trunk's original tape
    // datum. It only supplies millimetre units to the conic chart.
    const initial = field.pointAt(target[1]);
    const pitch = phaseLength(field, target, (phase) => {
      const p = initial(phase);
      return [p[0], p[2]];
    });
    return {
      domain,
      section: (row) =>
        bounds.map(({ side, outward, sternum, up, down }) => {
          const centre = address(row, side, side * target[2]);
          const medial = address(row, side, sternum);
          const lower = Math.min(medial, outward);
          const upper = Math.max(medial, outward);
          const projection = target[0] - row(centre)[0];
          if (!(lower < centre && centre < upper && projection > 0))
            throw new Error(
              "the placed bust point leaves its anterior root envelope",
            );
          return AutoMovieHumanMammaryChart.prepare({
            centre: [target[1], centre],
            pitch,
            apex: target[0],
            projection,
            reaches: {
              up,
              down,
              plusV: (upper - centre) * pitch,
              minusV: (centre - lower) * pitch,
            },
          });
        }),
    };
  }

  /** Native transverse coordinate in the original anterior quarter. */
  function address(row: Row, side: number, z: number): number {
    const phi = AutoMovieIllinois.root(
      (t) => row(side * t)[1] - z,
      0,
      Math.PI / 2,
      1e-10,
      100,
    );
    if (phi === null || Math.abs(row(side * phi)[1] - z) > 1e-7)
      throw new Error(
        `the mammary site ${z} mm leaves its original anterior quarter`,
      );
    return side * phi;
  }

  /** Original millimetres per radian on the common tape at the bust point. */
  function phaseLength(
    field: ReturnType<typeof Full.create>,
    target: P3,
    row: Row,
  ): number {
    const value = Math.hypot(
      ...field.jet(target[1], address(row, 1, target[2])).v,
    );
    if (!(Number.isFinite(value) && value > 0))
      throw new Error("the original breast phase is not regular");
    return value;
  }
}

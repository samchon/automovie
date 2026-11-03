import { AutoMovieHumanLoftChain } from "../../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanHandSide } from "../hand/AutoMovieHumanHandSide";
import { AutoMovieHumanHandVector } from "../hand/AutoMovieHumanHandVector";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { mean, TWO_PI }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
const { sided }: typeof AutoMovieHumanHandSide = AutoMovieHumanHandSide;

/**
 * The arm's scye: its arc of the shoulder ring, the bottom layer of the
 * shoulders' chain `upper` between the anterior and posterior axillary guides,
 * as the arm reads it in the left frame. The trunk owns the ring (the event
 * `upper` down, split `arm.<side>`); the arm's top layer is this ring, its
 * place, size and outline in the ring's level plane.
 */
export namespace AutoMovieHumanArmScye {
  /** The ring's place, size and outline. */
  export interface IRing {
    /** Mean of the arc's points, left frame, mm. */
    centre: Vec3;

    /** Mean distance of the arc's points from the centre, mm. */
    radius: number;

    /** The arc's points as `[x, z]` in the level plane, closed. */
    outline: [number, number][];
  }

  /** Samples of the arc. */
  const SAMPLES: number = 128;

  /**
   * The arc of a side.
   *
   * @param calibration Calibration holding `upper` and its event.
   * @param side Side.
   * @returns The ring in the left frame.
   */
  export function of(calibration: IAutoMovieHumanBodyCalibration, side: "left" | "right"): IRing {
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const upper: IAutoMovieHumanLoftChain | undefined = calibration.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === "upper",
    );
    const event: IAutoMovieHumanBodyCalibration.IEvent | undefined = calibration.events.find(
      (e: IAutoMovieHumanBodyCalibration.IEvent): boolean => e.parent === "upper" && e.direction === "down",
    );
    const split: IAutoMovieHumanBodyCalibration.ISplit | undefined = event?.splits.find(
      (s: IAutoMovieHumanBodyCalibration.ISplit): boolean => s.child === `arm.${side}`,
    );
    if (upper === undefined || split === undefined) throw new Error(`The shoulders hold no arc for arm.${side}`);

    const ring: Vec3[] = split.arcs
      .flatMap(([from, to]: [number, number]): Vec3[] => {
        const span: number = to >= from ? to - from : to + TWO_PI - from;
        return AutoMovieHumanLoftChain.ring(
          upper,
          upper.layers[0]!.y,
          Array.from({ length: SAMPLES }, (_: unknown, i: number): number => from + (span * i) / SAMPLES),
        );
      })
      .map((p: Vec3): Vec3 => sided(p, sign));
    const centre: Vec3 = [mean(ring, 0), mean(ring, 1), mean(ring, 2)];
    const radius: number =
      ring.reduce((s: number, p: Vec3): number => s + Math.hypot(p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]), 0) / ring.length;

    return { centre, radius, outline: ring.map((p: Vec3): [number, number] => [p[0], p[2]]) };
  }
}

import { AutoMovieHumanLoftChain } from "../../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLimbRootStrip } from "../AutoMovieHumanLimbRootStrip";
import { AutoMovieHumanHandSide } from "../hand/AutoMovieHumanHandSide";
import { AutoMovieHumanHandVector } from "../hand/AutoMovieHumanHandVector";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { mean, TWO_PI }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
const { sided }: typeof AutoMovieHumanHandSide = AutoMovieHumanHandSide;

/**
 * The arm's scye: its arc of the shoulder ring, the bottom layer of the
 * shoulders' chain `upper` between the anterior and posterior axillary guides,
 * as the arm reads it in the left frame. The trunk owns the ring (the event
 * `upper` down, split `arm.<side>`) and publishes it here with its jet down
 * across the ring, which the arm's root strip copies.
 */
export namespace AutoMovieHumanArmScye {
  /** The ring's place, size, outline and jet. */
  export interface IRing {
    /** Mean of the arc's points, left frame, mm. */
    centre: Vec3;

    /** Mean distance of the arc's points from the centre, mm. */
    radius: number;

    /** The arc's points as `[x, z]` in the level plane, closed. */
    outline: [number, number][];

    /** The arc's points, mm, the same as `outline` with their height. */
    points: Vec3[];

    /**
     * The shoulders' chain's jet at each point down across the ring: its first
     * and second derivatives per millimetre of the chain's station (height),
     * counted downward, read by one-sided differences of third order from
     * above the ring, since the chain ends there.
     */
    jets: AutoMovieHumanLimbRootStrip.IJet[];
  }

  /** Samples of the arc. */
  const SAMPLES: number = 128;

  /**
   * Step of the one-sided differences of the shoulders' chain at its bottom
   * ring, calibration mm: three steps span under a millimetre, well inside the
   * chain's last station span, where its station spline is one cubic.
   */
  export const STEP: number = 0.25;

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

    const phases: number[] = split.arcs.flatMap(([from, to]: [number, number]): number[] => {
      const span: number = to >= from ? to - from : to + TWO_PI - from;
      return Array.from({ length: SAMPLES }, (_: unknown, i: number): number => from + (span * i) / SAMPLES);
    });
    const bottom: number = upper.layers[0]!.y;

    // The rings a run down from the bottom ring: a negative run reads the
    // chain above it, where it exists.
    const rows: Map<number, Vec3[]> = new Map<number, Vec3[]>();
    const row: (run: number) => Vec3[] = (run: number): Vec3[] => {
      let found: Vec3[] | undefined = rows.get(run);
      if (found === undefined)
        rows.set(run, (found = AutoMovieHumanLoftChain.ring(upper, bottom - run, phases).map((p: Vec3): Vec3 => sided(p, sign))));
      return found;
    };
    const jets: AutoMovieHumanLimbRootStrip.IJet[] = phases.map(
      (_: number, i: number): AutoMovieHumanLimbRootStrip.IJet => AutoMovieHumanLimbRootStrip.edge((run: number): Vec3 => row(run)[i]!, 0, -STEP),
    );
    const ring: Vec3[] = jets.map((j: AutoMovieHumanLimbRootStrip.IJet): Vec3 => j.point);
    const centre: Vec3 = [mean(ring, 0), mean(ring, 1), mean(ring, 2)];
    const radius: number =
      ring.reduce((s: number, p: Vec3): number => s + Math.hypot(p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]), 0) / ring.length;

    return { centre, radius, outline: ring.map((p: Vec3): [number, number] => [p[0], p[2]]), points: ring, jets };
  }
}

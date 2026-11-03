import { AutoMovieHumanLoftChain } from "../../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLegCrotchFillet } from "./AutoMovieHumanLegCrotchFillet";
import { AutoMovieHumanLegCrotchSlope } from "./AutoMovieHumanLegCrotchSlope";
import { AutoMovieHumanLegSampling } from "./AutoMovieHumanLegSampling";
import { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

type Vec3 = AutoMovieHumanLegVector.Vec3;
const { lerp, norm, plus, sub } = AutoMovieHumanLegVector;

/**
 * The seam at the crotch: the trunk owns the bottom ring the leg ends on, and
 * the leg takes the arc of it that is its own, with the trunk's own station
 * derivative along it.
 *
 * The arc runs from the front pinch round the outside to the rear pinch, and
 * the slit between the thighs closes it. Over the last reach of the leg the
 * section hands over from the leg's own law to this ring: the ring leaves
 * straight down as a rounded loop ({@link AutoMovieHumanLegCrotchFillet}) and
 * hands over to the law at an even rate eased at both ends, and on top of that
 * the trunk's slope is carried in ({@link AutoMovieHumanLegCrotchSlope}), so the
 * two chains share one tangent plane on the open arc.
 *
 * Owner: the trunk. Neighbour: the leg.
 */
export namespace AutoMovieHumanLegCrotchRoot {
  /** The crotch ring a leg takes, canonical: the trunk's arc, front pinch first. */
  export interface IRoot {
    /** The arc from the front pinch round the outside to the rear pinch. */
    arc: Vec3[];

    /** The trunk's station derivative at each point of the arc, per mm up. */
    rates: Vec3[];

    /** Station of the ring. */
    y: number;

    /** Centre the ring's phases are read about, `[x, z]`. */
    centre: [number, number];

    /** The ring at depth 0 at the leg's phases, with its normals and outward slopes. */
    ring: AutoMovieHumanLegCrotchFillet.ILoop;

    /** Corner size at the ring. */
    corner: number;

    /** The trunk's outward slope at each of the leg's phases, per mm down. */
    slopes: number[];

    /** Reach of each phase's slope into the leg, mm. */
    spans: number[];
  }

  /** Height step of the trunk's derivative at its ring, mm. */
  export const TRUNK_STEP: number = 0.02;

  /**
   * The corner's size at the ring, in the leg's control pitches: two, the
   * narrowest turn its controls carry.
   */
  export const CORNER: number = 2;

  /** Share of the crotch's handover at each end over which its rate eases. */
  export const EASE: number = 0.25;

  /**
   * The trunk and the arcs of its bottom ring a leg takes.
   *
   * @param calibration Calibration holding `trunk` and its downward event.
   * @param side The leg's side.
   */
  export function arcs(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
  ): { trunk: IAutoMovieHumanLoftChain; arcs: [number, number][] } {
    const trunk: IAutoMovieHumanLoftChain = calibration.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === "trunk")!;
    const event: IAutoMovieHumanBodyCalibration.IEvent = calibration.events.find(
      (e: IAutoMovieHumanBodyCalibration.IEvent): boolean => e.parent === "trunk" && e.direction === "down",
    )!;
    return {
      trunk,
      arcs: event.splits.find((s: IAutoMovieHumanBodyCalibration.ISplit): boolean => s.child === `leg.${side}`)!.arcs,
    };
  }

  /** Phases along an arc, both ends included. */
  export function phases(from: number, to: number): number[] {
    const span: number = to >= from ? to - from : to + 2 * Math.PI - from;
    return Array.from({ length: AutoMovieHumanLegSampling.RING }, (_: unknown, i: number): number => from + (span * i) / (AutoMovieHumanLegSampling.RING - 1));
  }

  /** The arc of the trunk's bottom ring that a leg takes, world, in its own phase order. */
  export function ring(calibration: IAutoMovieHumanBodyCalibration, side: "left" | "right"): Vec3[] {
    const taken = arcs(calibration, side);
    return taken.arcs.flatMap(([from, to]: [number, number]): Vec3[] =>
      AutoMovieHumanLoftChain.ring(taken.trunk, taken.trunk.layers[0]!.y, phases(from, to)),
    );
  }

  /**
   * The crotch ring a leg takes, with the trunk's own derivative along it.
   *
   * @param calibration Calibration holding `trunk` and the event.
   * @param side The leg's side.
   * @param sign 1 for the left leg, -1 for the right's reflection.
   * @param centre Centre the ring's phases are read about, `[x, z]`: the law's own last centre.
   * @param reach Reach under the ring over which the leg hands over to it, mm.
   */
  export function of(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
    sign: 1 | -1,
    centre: [number, number],
    reach: number,
  ): IRoot {
    const taken = arcs(calibration, side);
    const trunk: IAutoMovieHumanLoftChain = taken.trunk;
    const y: number = trunk.layers[0]!.y;
    const ringPhases: number[] = taken.arcs.flatMap(([from, to]: [number, number]): number[] => phases(from, to));
    const at = (s: number): Vec3[] =>
      AutoMovieHumanLoftChain.ring(trunk, s, ringPhases).map((p: Vec3): Vec3 => [p[0], p[1], sign * p[2]]);

    // The trunk's station derivative at the ring: one-sided of second order.
    const here: Vec3[] = at(y);
    const a: Vec3[] = at(y + TRUNK_STEP);
    const b: Vec3[] = at(y + 2 * TRUNK_STEP);
    const rates: Vec3[] = here.map(
      (p: Vec3, i: number): Vec3 =>
        [0, 1, 2].map((c: number): number => (-3 * p[c]! + 4 * a[i]![c]! - b[i]![c]!) / (2 * TRUNK_STEP)) as Vec3,
    );

    // Front pinch first: the front pinch stands ahead of the rear one.
    const forward: boolean = here[0]![0] >= here[here.length - 1]![0];
    const arc: Vec3[] = forward ? here : [...here].reverse();
    const ordered: Vec3[] = forward ? rates : [...rates].reverse();
    let perimeter: number = norm(sub(arc[0]!, arc[arc.length - 1]!));
    for (let i: number = 1; i < arc.length; i++) perimeter += norm(sub(arc[i]!, arc[i - 1]!));
    const root: IRoot = {
      arc,
      rates: ordered,
      y,
      centre,
      ring: { points: [], normals: [], rates: [], edges: [] },
      corner: (CORNER * perimeter) / AutoMovieHumanLegSampling.ORDER,
      slopes: [],
      spans: [],
    };
    root.ring = AutoMovieHumanLegCrotchFillet.of(root, 0);
    const reading: AutoMovieHumanLegCrotchSlope.IReading = AutoMovieHumanLegCrotchSlope.of(root.ring, reach);
    root.slopes = reading.slopes;
    root.spans = reading.spans;
    return root;
  }

  /**
   * The leg's section where it hands over to the crotch ring.
   *
   * @param root The crotch ring the leg takes.
   * @param law The law's section at the station, world points at the leg's phases.
   * @param s The station.
   * @param reach Reach under the ring over which the leg hands over to it, mm.
   * @returns The section: the law below the reach, and above it the loop at that depth blended in at an even rate, with the trunk's slope carried.
   */
  export function join(root: IRoot, law: Vec3[], s: number, reach: number): Vec3[] {
    const depth: number = Math.max(0, root.y - s);
    if (!(depth < reach)) return law;

    // The ring leaves straight down and hands over to the law at an even
    // rate, so the difference between them turns the skin no more than it must.
    const w: number = 1 - handover(depth / reach);
    const loop: AutoMovieHumanLegCrotchFillet.ILoop = AutoMovieHumanLegCrotchFillet.of(root, depth);
    return law.map((p: Vec3, m: number): Vec3 => {
      const q: Vec3 = loop.points[m]!;
      const ringPoint: Vec3 = [q[0], q[1] - root.y + s, q[2]];
      const base: Vec3 = lerp(p, ringPoint, w);
      return plus(base, AutoMovieHumanLegCrotchSlope.carry(root, m, depth));
    });
  }

  /**
   * A step from 0 to 1 at an even rate, its rate eased in and out by the
   * smootherstep over {@link EASE} of its length at each end, so it is flat to
   * the second derivative at both ends and its steepest rate is
   * `1 / (1 - EASE)`.
   */
  export function handover(x: number): number {
    const t: number = Math.min(1, Math.max(0, x));
    const k: number = 1 / (1 - EASE);
    const eased = (y: number): number => EASE * (y ** 6 - 3 * y ** 5 + 2.5 * y ** 4);
    if (t <= EASE) return k * eased(t / EASE);
    if (t >= 1 - EASE) return 1 - k * eased((1 - t) / EASE);
    return k * (EASE / 2 + (t - EASE));
  }
}

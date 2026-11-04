import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanEventJoinRing } from "../AutoMovieHumanEventJoinRing";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLimbRootStrip } from "../AutoMovieHumanLimbRootStrip";
import { AutoMovieHumanLegCrotchFillet } from "./AutoMovieHumanLegCrotchFillet";
import { AutoMovieHumanLegSampling } from "./AutoMovieHumanLegSampling";
import { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

type Vec3 = AutoMovieHumanLegVector.Vec3;
const { fifth, norm, sub } = AutoMovieHumanLegVector;

/**
 * The crotch ring a leg takes: the trunk owns the bottom ring, and the leg takes
 * the arc of it that is its own, with the trunk's jet down across it, which the
 * leg's root strip copies (`AutoMovieHumanLimbRootStrip`).
 *
 * The arc runs from the front pinch round the outside to the rear pinch, and
 * the slit between the thighs closes it, its corners rounded
 * ({@link AutoMovieHumanLegCrotchFillet}). On the open arc the jet is the
 * trunk's own. Within the event join's taper of each pinch the trunk's jet is
 * its fold opening, which the rounded corner and the slit do not share, so
 * there the jet turns to the slit's, straight down with no curvature, by the
 * quintic smoothstep of the distance from the pinch.
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

    /** The trunk's second station derivative at each point of the arc, per mm squared. */
    seconds: Vec3[];

    /** Station of the ring. */
    y: number;

    /** Centre the ring's phases are read about, `[x, z]`. */
    centre: [number, number];

    /** The rounded ring at the leg's phases, with its normals and the trunk's derivatives. */
    ring: AutoMovieHumanLegCrotchFillet.ILoop;

    /** Corner size at the ring. */
    corner: number;
  }

  /**
   * Step of the one-sided differences of the trunk at its bottom ring, mm:
   * three steps span under a millimetre, inside the trunk's last station span,
   * where its station spline is one cubic.
   */
  export const TRUNK_STEP: number = 0.25;

  /**
   * The corner's size at the ring, in the leg's control pitches: two, the
   * narrowest turn its controls carry.
   */
  export const CORNER: number = 2;

  /** The trunk and the phase arcs of its bottom ring that one leg takes. */
  export interface IArcs {
    /** The trunk chain, owner of the ring. */
    trunk: IAutoMovieLoftChain;

    /** The arcs `[from, to]` of the trunk's phases the leg takes, radians. */
    arcs: [number, number][];
  }

  /**
   * The trunk and the arcs of its bottom ring a leg takes.
   *
   * @param calibration Calibration holding `trunk` and its downward event.
   * @param side The leg's side.
   */
  export function arcs(calibration: IAutoMovieHumanBodyCalibration, side: "left" | "right"): IArcs {
    const trunk: IAutoMovieLoftChain = calibration.chains.find((c: IAutoMovieLoftChain): boolean => c.name === "trunk")!;
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
    const taken: IArcs = arcs(calibration, side);
    return taken.arcs.flatMap(([from, to]: [number, number]): Vec3[] =>
      AutoMovieLoftChain.ring(taken.trunk, taken.trunk.layers[0]!.y, phases(from, to)),
    );
  }

  /**
   * The crotch ring a leg takes, with the trunk's own jet along it.
   *
   * @param calibration Calibration holding `trunk` and the event.
   * @param side The leg's side.
   * @param sign 1 for the left leg, -1 for the right's reflection.
   * @param centre Centre the ring's phases are read about, `[x, z]`: the law's own last centre.
   */
  export function of(calibration: IAutoMovieHumanBodyCalibration, side: "left" | "right", sign: 1 | -1, centre: [number, number]): IRoot {
    const taken: IArcs = arcs(calibration, side);
    const trunk: IAutoMovieLoftChain = taken.trunk;
    const y: number = trunk.layers[0]!.y;
    const ringPhases: number[] = taken.arcs.flatMap(([from, to]: [number, number]): number[] => phases(from, to));

    // The trunk's rings a run down from its bottom ring: a negative run reads
    // the trunk above it, where it exists.
    const rows: Map<number, Vec3[]> = new Map<number, Vec3[]>();
    const row: (run: number) => Vec3[] = (run: number): Vec3[] => {
      let found: Vec3[] | undefined = rows.get(run);
      if (found === undefined)
        rows.set(run, (found = AutoMovieLoftChain.ring(trunk, y - run, ringPhases).map((p: Vec3): Vec3 => [p[0], p[1], sign * p[2]])));
      return found;
    };
    const jets: AutoMovieHumanLimbRootStrip.IJet[] = ringPhases.map(
      (_: number, i: number): AutoMovieHumanLimbRootStrip.IJet => AutoMovieHumanLimbRootStrip.edge((run: number): Vec3 => row(run)[i]!, 0, -TRUNK_STEP),
    );
    const here: Vec3[] = jets.map((j: AutoMovieHumanLimbRootStrip.IJet): Vec3 => j.point);
    const rates: Vec3[] = jets.map((j: AutoMovieHumanLimbRootStrip.IJet): Vec3 => [-j.first[0], -j.first[1], -j.first[2]]);
    const seconds: Vec3[] = jets.map((j: AutoMovieHumanLimbRootStrip.IJet): Vec3 => j.second);

    // Front pinch first: the front pinch stands ahead of the rear one.
    const forward: boolean = here[0]![0] >= here[here.length - 1]![0];
    const order: <T>(list: T[]) => T[] = <T>(list: T[]): T[] => (forward ? list : [...list].reverse());
    const arc: Vec3[] = order(here);
    let perimeter: number = norm(sub(arc[0]!, arc[arc.length - 1]!));
    for (let i: number = 1; i < arc.length; i++) perimeter += norm(sub(arc[i]!, arc[i - 1]!));
    const root: IRoot = {
      arc,
      rates: order(rates),
      seconds: order(seconds),
      y,
      centre,
      ring: { points: [], normals: [], rates: [], seconds: [], edges: [] },
      corner: (CORNER * perimeter) / AutoMovieHumanLegSampling.ORDER,
    };
    root.ring = AutoMovieHumanLegCrotchFillet.of(root);
    return root;
  }

  /**
   * The strip's start at each of the leg's phases: the rounded ring's point
   * with the trunk's jet down across it, turned to the slit's straight fall
   * within the event join's taper of each pinch.
   *
   * @param root The crotch ring the leg takes.
   * @returns One jet per leg phase, per mm of station down.
   */
  export function start(root: IRoot): AutoMovieHumanLimbRootStrip.IJet[] {
    const loop: AutoMovieHumanLegCrotchFillet.ILoop = root.ring;

    return loop.points.map((p: Vec3, m: number): AutoMovieHumanLimbRootStrip.IJet => {
      const w: number = fifth(loop.edges[m]! / AutoMovieHumanEventJoinRing.TAPER);
      const r: Vec3 = loop.rates[m]!;
      const e: Vec3 = loop.seconds[m]!;

      return {
        point: p,
        first: [-w * r[0], -1 - w * (r[1] - 1), -w * r[2]],
        second: [w * e[0], w * e[1], w * e[2]],
      };
    });
  }
}

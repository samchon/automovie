import { AutoMovieLoftChain } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanBranchEvent,
  IAutoMovieHumanBranchSplit,
  IAutoMovieHumanLegCrotchFillet,
  IAutoMovieHumanLegCrotchRoot,
  IAutoMovieHumanLimbRootStrip,
  IAutoMovieLoftChain,
} from "@automovie/interface";

import { AutoMovieHumanEventJoinRing } from "./AutoMovieHumanEventJoinRing";
import { AutoMovieHumanLimbRootStrip } from "./AutoMovieHumanLimbRootStrip";
import { AutoMovieHumanLegCrotchFillet } from "./AutoMovieHumanLegCrotchFillet";
import { AutoMovieHumanLegSampling } from "./AutoMovieHumanLegSampling";
import { AutoMovieHumanLegVector } from "./AutoMovieHumanLegVector";

/**
 * The crotch ring a leg takes: the trunk owns the bottom ring, and the leg
 * takes the arc of it that is its own, with the trunk's jet down across it,
 * which the leg's root strip copies (`AutoMovieHumanLimbRootStrip`).
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

  /**
   * The trunk and the arcs of its bottom ring a leg takes.
   *
   * @param calibration Calibration holding `trunk` and its downward event.
   * @param side The leg's side.
   */
  export function arcs(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
  ): IAutoMovieHumanLegCrotchRoot.IArcs {
    const trunk: IAutoMovieLoftChain = calibration.chains.find(
      (c: IAutoMovieLoftChain): boolean => c.name === "trunk",
    )!;
    const event: IAutoMovieHumanBranchEvent = calibration.events.find(
      (e: IAutoMovieHumanBranchEvent): boolean =>
        e.parent === "trunk" && e.direction === "down",
    )!;
    return {
      trunk,
      arcs: event.splits.find(
        (s: IAutoMovieHumanBranchSplit): boolean => s.child === `leg.${side}`,
      )!.arcs,
    };
  }

  /** Phases along an arc, both ends included. */
  export function phases(from: number, to: number): number[] {
    const span: number = to >= from ? to - from : to + 2 * Math.PI - from;
    return Array.from(
      { length: AutoMovieHumanLegSampling.RING },
      (_: unknown, i: number): number =>
        from + (span * i) / (AutoMovieHumanLegSampling.RING - 1),
    );
  }

  /**
   * The arc of the trunk's bottom ring that a leg takes, world, in its own
   * phase order.
   */
  export function ring(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
  ): AutoMovieVector3Tuple[] {
    const taken: IAutoMovieHumanLegCrotchRoot.IArcs = arcs(calibration, side);
    return taken.arcs.flatMap(
      ([from, to]: [number, number]): AutoMovieVector3Tuple[] =>
        AutoMovieLoftChain.ring(
          taken.trunk,
          taken.trunk.layers[0]!.y,
          phases(from, to),
        ),
    );
  }

  /**
   * The crotch ring a leg takes, with the trunk's own jet along it.
   *
   * @param calibration Calibration holding `trunk` and the event.
   * @param side The leg's side.
   * @param sign 1 for the left leg, -1 for the right's reflection.
   * @param centre Centre the ring's phases are read about, `[x, z]`: the law's
   *   own last centre.
   */
  export function of(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
    sign: 1 | -1,
    centre: IAutoMovieHumanLegCrotchRoot.OfCentre,
  ): IAutoMovieHumanLegCrotchRoot.IRoot {
    const taken: IAutoMovieHumanLegCrotchRoot.IArcs = arcs(calibration, side);
    const trunk: IAutoMovieLoftChain = taken.trunk;
    const y: number = trunk.layers[0]!.y;
    const ringPhases: number[] = taken.arcs.flatMap(
      ([from, to]: [number, number]): number[] => phases(from, to),
    );

    // The trunk's rings a run down from its bottom ring: a negative run reads
    // the trunk above it, where it exists.
    const rows: Map<number, AutoMovieVector3Tuple[]> = new Map<
      number,
      AutoMovieVector3Tuple[]
    >();
    function row(run: number): AutoMovieVector3Tuple[] {
      let found: AutoMovieVector3Tuple[] | undefined = rows.get(run);
      if (found === undefined)
        rows.set(
          run,
          (found = AutoMovieLoftChain.ring(trunk, y - run, ringPhases).map(
            (p: AutoMovieVector3Tuple): AutoMovieVector3Tuple => [
              p[0],
              p[1],
              sign * p[2],
            ],
          )),
        );
      return found;
    }
    const jets: IAutoMovieHumanLimbRootStrip.IJet[] = ringPhases.map(
      (_: number, i: number): IAutoMovieHumanLimbRootStrip.IJet =>
        AutoMovieHumanLimbRootStrip.edge(
          (run: number): AutoMovieVector3Tuple => row(run)[i]!,
          0,
          -TRUNK_STEP,
        ),
    );
    const here: AutoMovieVector3Tuple[] = jets.map(
      (j: IAutoMovieHumanLimbRootStrip.IJet): AutoMovieVector3Tuple => j.point,
    );
    const rates: AutoMovieVector3Tuple[] = jets.map(
      (j: IAutoMovieHumanLimbRootStrip.IJet): AutoMovieVector3Tuple => [
        -j.first[0],
        -j.first[1],
        -j.first[2],
      ],
    );
    const seconds: AutoMovieVector3Tuple[] = jets.map(
      (j: IAutoMovieHumanLimbRootStrip.IJet): AutoMovieVector3Tuple => j.second,
    );

    // Front pinch first: the front pinch stands ahead of the rear one.
    const forward: boolean = here[0]![0] >= here[here.length - 1]![0];
    function order<T>(list: T[]): T[] {
      return forward ? list : [...list].reverse();
    }
    const arc: AutoMovieVector3Tuple[] = order(here);
    let perimeter: number = norm(sub(arc[0]!, arc[arc.length - 1]!));
    for (let i: number = 1; i < arc.length; i++)
      perimeter += norm(sub(arc[i]!, arc[i - 1]!));
    const root: IAutoMovieHumanLegCrotchRoot.IRoot = {
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
  export function start(
    root: IAutoMovieHumanLegCrotchRoot.IRoot,
  ): IAutoMovieHumanLimbRootStrip.IJet[] {
    const loop: IAutoMovieHumanLegCrotchFillet.ILoop = root.ring;

    return loop.points.map(
      (
        p: AutoMovieVector3Tuple,
        m: number,
      ): IAutoMovieHumanLimbRootStrip.IJet => {
        const w: number = fifth(
          loop.edges[m]! / AutoMovieHumanEventJoinRing.TAPER,
        );
        const r: AutoMovieVector3Tuple = loop.rates[m]!;
        const e: AutoMovieVector3Tuple = loop.seconds[m]!;

        return {
          point: p,
          first: [-w * r[0], -1 - w * (r[1] - 1), -w * r[2]],
          second: [w * e[0], w * e[1], w * e[2]],
        };
      },
    );
  }
}

const { fifth, norm, sub } = AutoMovieHumanLegVector;

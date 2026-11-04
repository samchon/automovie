import type { AutoMovieLoftFrame, IAutoMovieViewPart } from "@automovie/engine";
import type {
  AutoMovieConstructionAxis,
  AutoMovieConstructionFullness,
  AutoMovieConstructionNode,
  IAutoMovieConstruction,
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionOutline,
  IAutoMovieConstructionView,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieHumanHeadComposer } from "./AutoMovieHumanHeadComposer";

/**
 * The composed head as a construction tree (`IAutoMovieConstruction`), the
 * form the engine realizes once its kernel takes the tree: every part a view
 * node, every merge and diff a join node, an inner part joined to its parent
 * nested inside that parent's join, all joined in build order onto the head
 * mass.
 *
 * Each view is read off the part the composer lofted: its stations, its
 * outlines' knots and its fullness as they stand, its axis as the planes at
 * its stations (a straight axis when every plane shares its axes, else a
 * curved one through the planes' origins). Each join takes the seed and the
 * chord the composer traced it with, the phase parameter for a round
 * footprint and the arc parameter for one more than twice as long as wide.
 * Lengths are metres in the head's frame: the composer's calibration
 * millimetres over a thousand. The openings (eye fissures, nostrils, mouth)
 * enter as trims when the head is wired onto the tree; a join the composer
 * could not trace is left out, as the engine leaves it out. Compile-only.
 */
export namespace AutoMovieHumanHeadTree {
  /** Metres per calibration millimetre. */
  export const METRES: number = 1e-3;

  /** Rows of every blend between its rails. */
  export const ROWS: number = 4;

  /**
   * The head's tree.
   *
   * @param composed The composer's output.
   * @returns The tree, or null when the head mass has no part to root it.
   */
  export function of(composed: AutoMovieHumanHeadComposer.IOutput): IAutoMovieConstruction | null {
    if (composed.mass.chain === null) return null;

    // Each part's subtree: its own view, joined in order by its inner parts.
    const subtree: Map<string, AutoMovieConstructionNode> = new Map();
    const joins: AutoMovieHumanHeadComposer.IJoined[] = composed.parts;
    for (const joined of joins) subtree.set(joined.feature.part.name, view(joined.feature.part));
    for (const joined of joins) {
      if (joined.feature.parent === "head.mass") continue;
      const parent: AutoMovieConstructionNode | undefined = subtree.get(joined.feature.parent);
      const node: IAutoMovieConstructionJoin | null = parent === undefined ? null : join(joined, parent, subtree.get(joined.feature.part.name)!);
      if (node !== null) subtree.set(joined.feature.parent, node);
    }

    // The head: the mass, every part straight on it joined in turn.
    let root: AutoMovieConstructionNode = view(composed.massPart);
    for (const joined of joins) {
      if (joined.feature.parent !== "head.mass") continue;
      const node: IAutoMovieConstructionJoin | null = join(joined, root, subtree.get(joined.feature.part.name)!);
      if (node !== null) root = node;
    }
    return { name: "head", root };
  }

  /** A part's view node, in metres. */
  export function view(part: IAutoMovieViewPart): IAutoMovieConstructionView {
    return {
      type: "view",
      name: part.name,
      axis: axis(part),
      stations: part.stations.map((s: number): number => s * METRES),
      front: { positive: outline(part.front.positive), negative: outline(part.front.negative) },
      side: { positive: outline(part.side.positive), negative: outline(part.side.negative) },
      fullness: fullness(part.fullness),
      pole: part.pole ?? "open",
      order: part.order,
      samples: part.samples,
    };
  }

  /** A join node of a part onto its host, or null when the composer traced none. */
  function join(
    joined: AutoMovieHumanHeadComposer.IJoined,
    host: AutoMovieConstructionNode,
    part: AutoMovieConstructionNode,
  ): IAutoMovieConstructionJoin | null {
    if (joined.join === null || joined.seed === undefined || joined.width === undefined) return null;
    const chord: number = joined.width * METRES;
    return {
      type: "join",
      kind: joined.feature.join,
      name: `blend.${joined.feature.part.name}`,
      host,
      part,
      seed: {
        type: "point",
        partFace: joined.feature.part.name,
        hostFace: joined.feature.parent,
        part: [joined.seed.part[0] * METRES, joined.seed.part[1]],
        host: [joined.seed.host[0] * METRES, joined.seed.host[1]],
      },
      parameter: joined.feature.elongated === true ? { type: "arc" } : { type: "phase" },
      partWidth: { type: "chord", value: chord },
      hostWidth: { type: "chord", value: chord },
      continuity: "G2",
      count: AutoMovieHumanHeadComposer.COUNT,
      rows: ROWS,
      tolerance: AutoMovieHumanHeadComposer.TOLERANCE * METRES,
      grazing: AutoMovieHumanHeadComposer.GRAZING,
    };
  }

  /** The axis as the planes at the part's stations. */
  function axis(part: IAutoMovieViewPart): AutoMovieConstructionAxis {
    const frames: AutoMovieLoftFrame.IFrame[] = part.stations.map((s: number): AutoMovieLoftFrame.IFrame => part.axis.at(s));
    const first: AutoMovieLoftFrame.IFrame = frames[0]!;
    const same = (a: readonly number[], b: readonly number[]): boolean => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!) < 1e-9;
    const straight: boolean = frames.every((f: AutoMovieLoftFrame.IFrame): boolean => same(f.u, first.u) && same(f.v, first.v));
    if (straight) {
      const zero: AutoMovieLoftFrame.IFrame = part.axis.at(0);
      return { type: "straight", origin: vector(zero.origin, METRES), u: vector(first.u, 1), v: vector(first.v, 1) };
    }
    return {
      type: "curved",
      knots: part.stations.map((s: number, k: number): { station: number; point: IAutoMovieVector3 } => ({
        station: s * METRES,
        point: vector(frames[k]!.origin, METRES),
      })),
      u: vector(first.u, 1),
      step: METRES,
    };
  }

  /** An outline's knots, in metres. */
  function outline(o: IAutoMovieViewPart.IOutline): IAutoMovieConstructionOutline {
    return {
      knots: o.knots.map((k: IAutoMovieViewPart.IKnot): { site: string; station: number; value: number } => ({
        site: k.site,
        station: k.station * METRES,
        value: k.value * METRES,
      })),
    };
  }

  /** A shoulder law's knots, stations in metres and shares as they are. */
  function shares(o: IAutoMovieViewPart.IOutline): IAutoMovieConstructionOutline {
    return {
      knots: o.knots.map((k: IAutoMovieViewPart.IKnot): { site: string; station: number; value: number } => ({
        site: k.site,
        station: k.station * METRES,
        value: k.value,
      })),
    };
  }

  /** The fullness owner. */
  function fullness(f: IAutoMovieViewPart.Fullness): AutoMovieConstructionFullness {
    if (f.kind === "girth")
      return {
        type: "girth",
        girth: outline(f.girth),
        departures: f.departures === undefined ? null : [shares(f.departures[0]), shares(f.departures[1]), shares(f.departures[2]), shares(f.departures[3])],
      };
    if (f.kind === "shoulder")
      return {
        type: "shoulder",
        shoulder: shares(f.shoulder),
        departures: f.departures === undefined ? null : [shares(f.departures[0]), shares(f.departures[1]), shares(f.departures[2]), shares(f.departures[3])],
      };
    return { type: "top", shoulders: [shares(f.shoulders[0]), shares(f.shoulders[1]), shares(f.shoulders[2]), shares(f.shoulders[3])] };
  }

  /** A point or direction as the interface's vector, scaled. */
  function vector(p: readonly number[], scale: number): IAutoMovieVector3 {
    return { x: p[0]! * scale, y: p[1]! * scale, z: p[2]! * scale };
  }
}

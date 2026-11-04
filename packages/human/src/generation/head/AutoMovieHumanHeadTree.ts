import { AutoMovieConstructionViews, AutoMovieViewOutline, AutoMovieViewParallelAxis, type AutoMovieLoftFrame, type IAutoMovieViewPart } from "@automovie/engine";
import type {
  AutoMovieConstructionAxis,
  AutoMovieConstructionFullness,
  AutoMovieConstructionNode,
  IAutoMovieConstruction,
  IAutoMovieConstructionCurvatureWidth,
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionOutline,
  IAutoMovieConstructionView,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieHumanSeamUnion } from "../../lofting/AutoMovieHumanSeamUnion";
import type { AutoMovieHumanHeadComposer } from "./AutoMovieHumanHeadComposer";
import type { AutoMovieHumanHeadFeatures } from "./AutoMovieHumanHeadFeatures";

/**
 * The composed head as a construction tree (`IAutoMovieConstruction`), which
 * the engine realizes (`realizeAutoMovieConstruction`): every part a view
 * node, every merge and diff a join node, an inner part joined to its parent
 * nested inside that parent's join, all joined in build order onto the head
 * mass.
 *
 * Each view is the authoritative metre declaration the composer already
 * used to evaluate that part, not a second serialization of decoded mm.
 * At the initial authoring boundary, an axis retains its original parallel
 * coordinate declaration when available; the older straight/level/curved
 * source adapter serves the other builders. Each join is seeded by the engine's
 * search along the part's station line at the phase the part names, its
 * blend's chord a share of each side's normal-section radius at every traced
 * point, capped at half the lesser of the part's height and least half
 * extent (`AutoMovieHumanSeamUnion.width`), with the phase parameter for a
 * round footprint and the arc parameter for one more than twice as long as
 * wide. Lengths are metres in the head's frame: the composer's calibration
 * millimetres over a thousand. The openings (eye fissures, nostrils, mouth)
 * enter as trims next.
 */
export namespace AutoMovieHumanHeadTree {
  /** Metres per calibration millimetre. */
  export const METRES: number = 1e-3;

  /** Share of the normal-section radius each blend's chord takes at every traced point, the rolling ball's safe margin. */
  export const SHARE: number = 0.5;

  /** Share of the station distance to a rail surface's nearer end each blend's chord stays within, so no rail runs past a part's pole (the nose's columella, the auricle's apex under the concha). */
  export const END: number = 0.5;

  /** Traced points per join. */
  export const COUNT: number = 64;

  /** Largest gap accepted on a join's curve, mm. */
  export const TOLERANCE: number = 0.05;

  /** Least angle between the two tangent planes along a join's curve, radians. */
  export const GRAZING: number = (5 * Math.PI) / 180;

  /** Rows of every blend between its rails. */
  export const ROWS: number = 4;

  /**
   * The head's tree.
   *
   * @param composed The composer's output.
   * @returns The tree.
   */
  export function of(composed: AutoMovieHumanHeadComposer.IOutput): IAutoMovieConstruction {
    // Each part's subtree: its own view, joined in order by its inner parts.
    const subtree: Map<string, AutoMovieConstructionNode> = new Map();
    for (const placed of composed.parts) subtree.set(placed.feature.part.name, placed.view);
    for (const placed of composed.parts) {
      if (placed.feature.parent === "head.mass") continue;
      const parent: AutoMovieConstructionNode | undefined = subtree.get(placed.feature.parent);
      if (parent !== undefined) subtree.set(placed.feature.parent, join(placed, parent, subtree.get(placed.feature.part.name)!));
    }

    // The head: the mass, every part straight on it joined in turn.
    let root: AutoMovieConstructionNode = composed.massView;
    for (const placed of composed.parts) if (placed.feature.parent === "head.mass") root = join(placed, root, subtree.get(placed.feature.part.name)!);
    return { name: "head", root };
  }

  /**
   * Declare one source in metres once, then evaluate its actual bare views
   * from that same declaration. Pole stations, outlines and origin parameters
   * therefore share one unit path before any raw loft is constructed.
   *
   * @evidence contracts/common.md#principled-implementation Uses the existing source serializer once and the engine's construction-view evaluator, making the authoritative metre record the common input of bare source and production tree.
   * @evidence contracts/common.md#clear-and-simple-design Returns the declaration and evaluated part explicitly; no registry, global cache or inferred output correction is introduced.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not clamp endpoints, widen an oracle, fit a reference or recover a declaration from an emitted skin. A failed source conversion remains a named error.
   * @evidence contracts/common.md#meaningful-documentation States the original mm authoring boundary, authoritative metre declaration, evaluated-mm part and shared lifetime.
   * @evidence contracts/performance.md#efficient-algorithms One linear declaration conversion and engine source-axis preparation precede the existing loft; no part is lofted twice.
   * @evidence contracts/performance.md#reuse-equivalent-work The caller retains this exact declaration for Tree.of instead of serializing the evaluated mm part again.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns two call-owned records with no global retention; the engine owns factory-axis metadata.
   */
  export function source(part: IAutoMovieViewPart): { part: IAutoMovieViewPart; view: IAutoMovieConstructionView } {
    const declaration: IAutoMovieConstructionView = view(part);
    const evaluated: IAutoMovieViewPart | string = AutoMovieConstructionViews.part(declaration);
    if (typeof evaluated === "string") throw new Error(`Head source ${part.name}: ${evaluated}`);
    return { part: evaluated, view: declaration };
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

  /** A join node of a part onto its host. */
  function join(placed: AutoMovieHumanHeadComposer.IPlaced, host: AutoMovieConstructionNode, part: AutoMovieConstructionNode): IAutoMovieConstructionJoin {
    const feature: AutoMovieHumanHeadFeatures.IFeature = placed.feature;
    // A dome crosses its parent between its base and its apex; a long one
    // is searched across its middle, where its wall stands steepest.
    const search: { phase: number; from: number; to: number } = feature.search ?? { phase: feature.elongated === true ? Math.PI / 2 : 0, from: 0, to: 1 };
    const width: IAutoMovieConstructionCurvatureWidth = {
      type: "curvature",
      share: SHARE,
      cap: AutoMovieHumanSeamUnion.width(feature.size[0], feature.size[1]) * METRES,
      end: END,
    };
    return {
      type: "join",
      kind: feature.join,
      name: `blend.${feature.part.name}`,
      host,
      part,
      seed: { type: "search", partFace: feature.part.name, hostFace: feature.parent, phase: search.phase, from: search.from, to: search.to },
      parameter: feature.elongated === true ? { type: "arc" } : { type: "phase" },
      partWidth: width,
      hostWidth: width,
      continuity: "G2",
      count: COUNT,
      rows: ROWS,
      tolerance: TOLERANCE * METRES,
      grazing: GRAZING,
    };
  }

  /** The axis as the planes at the part's stations. */
  function axis(part: IAutoMovieViewPart): AutoMovieConstructionAxis {
    const original: AutoMovieConstructionAxis | null = AutoMovieViewParallelAxis.source(part.axis);
    if (original !== null) return original;
    const frames: AutoMovieLoftFrame.IFrame[] = part.stations.map((s: number): AutoMovieLoftFrame.IFrame => part.axis.at(s));
    const first: AutoMovieLoftFrame.IFrame = frames[0]!;
    const same = (a: readonly number[], b: readonly number[]): boolean => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!) < 1e-9;
    const parallel: boolean = frames.every((f: AutoMovieLoftFrame.IFrame): boolean => same(f.u, first.u) && same(f.v, first.v));
    // A straight axis: parallel planes whose origins run along their normal
    // by the station.
    const w: number[] = [first.v[1] * first.u[2] - first.v[2] * first.u[1], first.v[2] * first.u[0] - first.v[0] * first.u[2], first.v[0] * first.u[1] - first.v[1] * first.u[0]];
    const zero: AutoMovieLoftFrame.IFrame = part.axis.at(0);
    const straight: boolean =
      parallel &&
      frames.every((f: AutoMovieLoftFrame.IFrame, k: number): boolean => same(f.origin, [zero.origin[0] + w[0]! * part.stations[k]!, zero.origin[1] + w[1]! * part.stations[k]!, zero.origin[2] + w[2]! * part.stations[k]!]));
    if (straight) return { type: "straight", origin: vector(zero.origin, METRES), u: vector(first.u, 1), v: vector(first.v, 1) };
    // A level axis: the world's level planes at the station's height, the
    // origin drifting.
    const level: boolean = parallel && same(first.u, [1, 0, 0]) && same(first.v, [0, 0, 1]) && frames.every((f: AutoMovieLoftFrame.IFrame, k: number): boolean => Math.abs(f.origin[1] - part.stations[k]!) < 1e-9);
    if (level) {
      const course = (c: 0 | 2): IAutoMovieConstructionOutline => ({
        knots: part.stations.map((s: number, k: number): { site: string; station: number; value: number } => ({ site: `${part.name}.${k}`, station: s * METRES, value: frames[k]!.origin[c] * METRES })),
      });
      return { type: "level", origin: { x: course(0), z: course(2) } };
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
    return AutoMovieViewOutline.scale(o, METRES, METRES);
  }

  /** A shoulder law's knots, stations in metres and shares as they are. */
  function shares(o: IAutoMovieViewPart.IOutline): IAutoMovieConstructionOutline {
    return AutoMovieViewOutline.scale(o, METRES, 1);
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

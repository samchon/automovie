import { AutoMovieConstructionViews, AutoMovieViewOutline, AutoMovieViewParallelAxis, type AutoMovieLoftFrame, type IAutoMovieViewPart } from "@automovie/engine";
import type {
  AutoMovieConstructionAxis,
  AutoMovieConstructionFullness,
  AutoMovieConstructionNode,
  IAutoMovieConstruction,
  IAutoMovieConstructionCurvatureWidth,
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionOutline,
  IAutoMovieConstructionSource,
  IAutoMovieConstructionView,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieHumanSeamUnion } from "../../lofting/AutoMovieHumanSeamUnion";
import type { AutoMovieHumanHeadComposer } from "./AutoMovieHumanHeadComposer";
import type { AutoMovieHumanHeadFeatures } from "./AutoMovieHumanHeadFeatures";

/**
 * The composed head as a construction tree (`IAutoMovieConstruction`), which
 * the engine realizes (`realizeAutoMovieConstruction`): every part a source
 * node, every merge and diff a join node, an inner part joined to its parent
 * nested inside that parent's join, all joined in build order onto the head
 * mass.
 *
 * Each source leaf borrows the composer's actual millimetre part through
 * the invocation-owned source map. Its scalar and frame callbacks reach
 * engine lofting without a declaration roundtrip. Explicit serializable
 * declarations remain a separate caliper and independent-study boundary.
 * Each join is seeded by the engine's
 * search along the part's station line at the phase the part names, its
 * blend's chord a share of each side's normal-section radius at every traced
 * point, capped at half the lesser of the part's height and least half
 * extent (`AutoMovieHumanSeamUnion.width`), with the phase parameter for a
 * round footprint and the arc parameter for one more than twice as long as
 * wide. Lengths are metres in the head's frame: the composer's calibration
 * millimetres over a thousand. Source-leaf inputs stay in their original
 * millimetres; explicit declarations and operator distances use metres.
 *
 * @evidence contracts/common.md#principled-implementation Authored source leaves and nested joins express anatomical containment while invocation context preserves each original scalar/frame owner.
 * @evidence contracts/common.md#clear-and-simple-design Tree topology and explicit source references remain separate from original generation and engine realization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No global source registry, cached skin or sampled callback supplies production leaves; legacy declaration conversion is limited to explicit caliper/study callers.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes source millimetres, operator/declaration metres, source ownership and unverified joins.
 * @evidence contracts/performance.md#efficient-algorithms Two linear passes build the part subtrees and head fold; each leaf stores a constant-size reference.
 * @evidence contracts/performance.md#reuse-equivalent-work The tree borrows Composer's exact parts through its source map instead of rebuilding or serializing them.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned tree and source context; this module retains no figure or registry.
 */
export namespace AutoMovieHumanHeadTree {
  /**
   * Metres per calibration millimetre for explicit declarations and operator distances.
   *
   * @evidence contracts/common.md#principled-implementation Converts physical operator and declaration lengths once at the existing interface boundary.
   * @evidence contracts/common.md#clear-and-simple-design One unit constant serves all explicit metre records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Original source-context parts remain millimetres and are not rescaled by this constant.
   * @evidence contracts/common.md#meaningful-documentation States the source/declaration distinction and units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Constant data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No preparation occurs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One scalar owns no resource.
   */
  export const METRES: number = 1e-3;

  /**
   * Existing blend-width share of each actual normal-section radius.
   *
   * @evidence contracts/common.md#principled-implementation Supplies the existing normal-section blend-width rule.
   * @evidence contracts/common.md#clear-and-simple-design One declared policy serves both incident rails.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This policy does not repair mismatched original sections or certify a successful join.
   * @evidence contracts/common.md#meaningful-documentation Names its local rolling-width role.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Constant data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No preparation occurs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One scalar owns no resource.
   */
  export const SHARE: number = 0.5;

  /**
   * Existing width cap as a share of the rail's nearer station end distance.
   *
   * @evidence contracts/common.md#principled-implementation Limits blend width using the existing operator's end-distance rule.
   * @evidence contracts/common.md#clear-and-simple-design A single bound is included in each join's width record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It does not extend a cap domain or replace a missing source derivative.
   * @evidence contracts/common.md#meaningful-documentation States its station-distance and rail role.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Constant data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No preparation occurs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One scalar owns no resource.
   */
  export const END: number = 0.5;

  /**
   * Existing trace population per join.
   *
   * @evidence contracts/common.md#principled-implementation Supplies the engine's declared trace discretization policy.
   * @evidence contracts/common.md#clear-and-simple-design One count is passed to every join.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Trace samples do not redefine or fit original geometry.
   * @evidence contracts/common.md#meaningful-documentation Names the per-join population.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Constant data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No preparation occurs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One scalar owns no resource.
   */
  export const COUNT: number = 64;

  /**
   * Existing join-curve gap tolerance, calibration mm.
   *
   * @evidence contracts/common.md#principled-implementation Passes the unchanged physical curve tolerance to the engine in metres.
   * @evidence contracts/common.md#clear-and-simple-design One explicit policy controls each join's tolerance.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is not widened to conceal parent-source or intersection failures.
   * @evidence contracts/common.md#meaningful-documentation States physical units and curve-gap meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Constant data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No preparation occurs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One scalar owns no resource.
   */
  export const TOLERANCE: number = 0.05;

  /**
   * Existing least admitted tangent-plane angle, radians.
   *
   * @evidence contracts/common.md#principled-implementation Supplies the existing engine grazing-admission rule.
   * @evidence contracts/common.md#clear-and-simple-design Every join receives one explicit angle policy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A refusal is not bypassed by changing this value or distorting the source.
   * @evidence contracts/common.md#meaningful-documentation Names the angle, units and admission role.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Constant data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No preparation occurs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One scalar owns no resource.
   */
  export const GRAZING: number = (5 * Math.PI) / 180;

  /**
   * Existing blend rows between the incident rails.
   *
   * @evidence contracts/common.md#principled-implementation Supplies the engine's blend representation population.
   * @evidence contracts/common.md#clear-and-simple-design One integer is passed through every join.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Row count does not establish original section sharing or geometric continuity.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes blend rows from original source stations.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Constant data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No preparation occurs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One scalar owns no resource.
   */
  export const ROWS: number = 4;

  /**
   * The head's tree.
   *
   * @param composed The composer's output.
   * @returns The tree.
   *
   * @evidence contracts/common.md#principled-implementation Nests each actual child under its named parent, then folds top-level parts onto the actual head-mass leaf in authored order.
   * @evidence contracts/common.md#clear-and-simple-design Separate subtree and root passes express containment without sharing solid nodes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It adds no corrective movement, source replacement or synthetic successful join.
   * @evidence contracts/common.md#meaningful-documentation States that Composer supplies original source leaves while the engine owns realization.
   * @evidence contracts/performance.md#efficient-algorithms Two O(P) passes and a P-entry temporary map.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses every supplied leaf and the same feature join contract.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the caller-owned tree; the temporary subtree map is released after construction.
   */
  export function of(composed: Pick<AutoMovieHumanHeadComposer.IOutput, "massView" | "parts">): IAutoMovieConstruction {
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
   * Evaluate an explicit metre declaration for fixed-chart caliper bases
   * and independent eye studies. Production parts instead use leaf() and
   * their actual source context, preserving arbitrary source callbacks.
   *
   * @evidence contracts/common.md#principled-implementation Uses the declaration converter and engine evaluator only at the explicit caliper/study boundary; production source leaves do not use this serializer.
   * @evidence contracts/common.md#clear-and-simple-design Returns the declaration and evaluated part explicitly; no registry, global cache or inferred output correction is introduced.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not clamp endpoints, widen an oracle, fit a reference or recover a declaration from an emitted skin. A failed source conversion remains a named error.
   * @evidence contracts/common.md#meaningful-documentation States which explicit caliper/study callers convert units and separates arbitrary production callbacks from that boundary.
   * @evidence contracts/performance.md#efficient-algorithms One linear declaration conversion and engine source-axis preparation; this function creates no loft.
   * @evidence contracts/performance.md#reuse-equivalent-work Caliper bases and study readers retain their evaluated part and explicit declaration; production retains its original part separately.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns two call-owned records with no global retention; the engine owns factory-axis metadata.
   */
  export function source(part: IAutoMovieViewPart): { part: IAutoMovieViewPart; view: IAutoMovieConstructionView } {
    const declaration: IAutoMovieConstructionView = view(part);
    const evaluated: IAutoMovieViewPart | string = AutoMovieConstructionViews.part(declaration);
    if (typeof evaluated === "string") throw new Error(`Head source ${part.name}: ${evaluated}`);
    return { part: evaluated, view: declaration };
  }

  /**
   * Bind this exact evaluated-mm source through the realization context.
   *
   * @evidence contracts/common.md#principled-implementation The explicit key selects the caller's original part with its actual scalar and frame owners, including source callbacks.
   * @evidence contracts/common.md#clear-and-simple-design One closed leaf replaces no geometry and needs one call-owned map entry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not sample, serialize, rescale, clone or globally register a source.
   * @evidence contracts/common.md#meaningful-documentation States evaluated-mm input and the required realization context.
   * @evidence contracts/performance.md#efficient-algorithms Builds a fixed three-field leaf in constant work.
   * @evidence contracts/performance.md#reuse-equivalent-work Raw lofts and realization reuse the same supplied part.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The leaf owns strings only; its caller owns the map and source lifetime.
   */
  export function leaf(part: IAutoMovieViewPart): IAutoMovieConstructionSource {
    return { type: "source", name: part.name, source: part.name };
  }

  /**
   * Explicit caliper/study declaration in metres, separate from production leaves.
   * Factory parallel-axis metadata is preserved; the legacy fallback for
   * other axes is a declaration adapter and does not preserve opaque callbacks.
   *
   * @evidence contracts/common.md#principled-implementation Converts original scalar knots, available jets and known axis declarations to the existing metre schema.
   * @evidence contracts/common.md#clear-and-simple-design One explicit adapter serves source()'s caliper/study boundary; leaf() serves actual production.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Opaque custom callbacks are not claimed as exact declarations and production never uses this adapter for their replay.
   * @evidence contracts/common.md#meaningful-documentation States units, factory metadata and the limited legacy fallback.
   * @evidence contracts/performance.md#efficient-algorithms Linear copies of the original knot arrays and any explicit source-axis records.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses original factory metadata when available rather than a second sampled axis.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns new caller-owned numeric declaration arrays with no source registry.
   */
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
      seed: { type: "search", partFace: feature.part.name, hostFace: feature.material?.name ?? feature.parent, phase: search.phase, from: search.from, to: search.to },
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
    const same: (a: readonly number[], b: readonly number[]) => boolean = (a: readonly number[], b: readonly number[]): boolean => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!) < 1e-9;
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
      const course: (c: 0 | 2) => IAutoMovieConstructionOutline = (c: 0 | 2): IAutoMovieConstructionOutline => ({
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

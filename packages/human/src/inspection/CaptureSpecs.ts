import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";

import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanFairOutline } from "../generation/arm/AutoMovieHumanFairOutline";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { CaptureModel } from "./CaptureModel";

type V3 = CaptureModel.Vec3;
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;
type IOutline = AutoMovieHumanArmCurveSpec.IOutline;

/**
 * Reads any region's view-curve specs, written in the shared
 * `AutoMovieHumanArmCurveSpec` types, and its engine loft chain into the
 * capture's display model. This is the one route every region provider
 * takes, so a region needs only to hand over its frames, specs, chain, ports
 * and relations ({@link IBundle}).
 *
 * Representations are evaluated exactly where the spec carries everything:
 * a Bézier chain by de Casteljau, a quintic Hermite chain from its six-point
 * form, an ellipse by its parametric form. An outline is the scalar quintic
 * Hermite chain of its knots placed at `axis(station) + direction * value`;
 * its value at a station is exact when the region supplies its own
 * station-to-parameter map (`outline`), or when the knots' parameter is the
 * station plus a constant. Otherwise the parameter between knots is read by
 * monotone piecewise-linear interpolation of the knots' (station, q) pairs
 * and the curve is labelled a display approximation. A fullness outline
 * (null direction) is drawn as its shoulder lines between neighbouring
 * outline directions of the same frame, on every quarter or on the quarters
 * the provider scopes it to (`quarters`): the conic shoulder point
 * `(1 + rho) / 2 (a d_a + b d_b)` of each quarter, an exact quarter-ellipse
 * point at `rho = sqrt 2 - 1`. A conic loop needs the course frame at its
 * station, which the spec does not carry, so it is reported unavailable.
 * A part built in separate domains hands every domain's chain (`chains`);
 * they are drawn together, each with its own rings, guides, course and
 * clay, and nothing joins them.
 */
export namespace CaptureSpecs {
  /** What a region hands the capture for one part. */
  export interface IBundle {
    /** Part name, such as `arm.left`. */
    part: string;

    /** Segment frames, each relative to its parent; the root's parent is null. */
    frames: readonly AutoMovieHumanArmCurveSpec.ISegmentFrame[];

    /** World placement of the root frame; identity when the figure placement does not exist yet. */
    root: AutoMovieHumanArmCurveSpec.ITransform;

    /** How the root is placed, or why it stands at identity. */
    placement: string;

    /** The part's original curve specs. */
    specs: readonly Spec[];

    /** Each segment frame's axis: the point at its own station zero and the unit distal direction, both in that frame. */
    axis(frame: string): { origin: V3; distal: V3 } | null;

    /** Optional exact outline value at a station of the spec's own frame; null leaves the generic reading. */
    outline?(spec: Spec, station: number): number | null;

    /**
     * Optional quarters a fullness spec applies to, each the names of the two
     * angularly neighbouring outline specs of its frame that bound it (either
     * order). Null or absent draws the spec's shoulder line on every quarter.
     */
    quarters?(spec: Spec): readonly (readonly [string, string])[] | null;

    /** The loft chain, or null with the loft's diagnostics. */
    chain: IAutoMovieLoftChain | null;

    /** Every chain of a part built in separate domains, drawn together and not joined; when present it replaces `chain`. */
    chains?: readonly IAutoMovieLoftChain[];

    /** Keep independently drawable charts and name any native admission refusals. */
    allowDomainRefusal?: true;

    /** Loft and constructor diagnostics. */
    diagnostics: readonly string[];

    /** Joints and ports: name, frame, local point, close-up half size (mm). */
    ports: readonly { name: string; frame: string; point: V3; radius: number }[];

    /** Neighbour relations. */
    relations: CaptureModel.IRelations;

    /** The reference registered into this part's world, diagnostic only. */
    reference: CaptureModel.IReference;

    /** Constructor and registration timings, milliseconds. */
    milliseconds: Record<string, number>;
  }

  /** Display station step along an outline, mm. */
  export const STEP: number = 1.5;

  /** Convert a bundle into the capture's display model. */
  export function part(bundle: IBundle): CaptureModel.IPart {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const byName: Map<string, AutoMovieHumanArmCurveSpec.ISegmentFrame> = new Map(bundle.frames.map((f: AutoMovieHumanArmCurveSpec.ISegmentFrame): [string, AutoMovieHumanArmCurveSpec.ISegmentFrame] => [f.name, f]));
    const world: (name: string) => AutoMovieHumanArmCurveSpec.ITransform = (name: string): AutoMovieHumanArmCurveSpec.ITransform => {
      const f: AutoMovieHumanArmCurveSpec.ISegmentFrame | undefined = byName.get(name);
      if (f === undefined) throw new Error(`${bundle.part}: unknown frame ${name}`);
      return S.compose(f.parent === null ? bundle.root : world(f.parent), f.relative);
    };
    const diagnostics: string[] = [...bundle.diagnostics];
    const curves: CaptureModel.ICurve[] = bundle.specs.map((spec: Spec): CaptureModel.ICurve => curve(bundle, spec, world, diagnostics));
    const rootFrame: AutoMovieHumanArmCurveSpec.ISegmentFrame | undefined = bundle.frames.find((f: AutoMovieHumanArmCurveSpec.ISegmentFrame): boolean => f.parent === null);
    return {
      name: bundle.part,
      root: rootFrame?.name ?? bundle.frames[0]?.name ?? "world",
      placement: bundle.placement,
      frames: bundle.frames.map((f: AutoMovieHumanArmCurveSpec.ISegmentFrame): CaptureModel.IFrame => ({ name: f.name, parent: f.parent, world: world(f.name) })),
      curves,
      ports: bundle.ports.map((p: { name: string; frame: string; point: V3; radius: number }): CaptureModel.IPort => ({ name: p.name, point: S.apply(world(p.frame), p.point), radius: p.radius })),
      loft: bundle.chains === undefined ? loft(bundle.chain, bundle.diagnostics) : lofts(bundle.chains, bundle.diagnostics, bundle.allowDomainRefusal),
      reference: bundle.reference,
      relations: bundle.relations,
      milliseconds: bundle.milliseconds,
      diagnostics: counted(diagnostics),
    };
  }

  /** Each distinct diagnostic once, in first-seen order, with its repeat count when above one. */
  export function counted(lines: readonly string[]): string[] {
    const counts: Map<string, number> = new Map();
    for (const l of lines) counts.set(l, (counts.get(l) ?? 0) + 1);
    return [...counts].map(([l, n]: [string, number]): string => (n > 1 ? `${l} (x${n})` : l));
  }

  /** Outline colours by the sign of the outline direction on the frame's X (anterior) and Z axes. */
  export function colour(direction: V3): string {
    const ax: number = Math.abs(direction[0]);
    const az: number = Math.abs(direction[2]);
    if (az >= ax) return direction[2] < 0 ? "008080" : "c00060";
    return direction[0] > 0 ? "e07000" : "8040c0";
  }

  /** Aid colours by drafting role. */
  export const AID_COLOUR: Record<AutoMovieHumanArmCurveSpec.IAid["kind"], string> = {
    axis: "7a7a7a",
    rectangle: "6f7fff",
    chord: "9a9a9a",
    tick: "202020",
    division: "8a8a8a",
    tangent: "1a9fff",
    extremum: "ff2bd6",
    plane: "ff8a00",
    polygon: "3cba3c",
  };

  /** One spec as a capture curve. */
  function curve(bundle: IBundle, spec: Spec, world: (name: string) => AutoMovieHumanArmCurveSpec.ITransform, diagnostics: string[]): CaptureModel.ICurve {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const t: AutoMovieHumanArmCurveSpec.ITransform = world(spec.frame);
    const lines: CaptureModel.ILine[] = [];
    const rep: Spec["representation"] = spec.representation;
    let kind: string = rep.kind;
    if (rep.kind === "bezier") {
      const n: number = S.bezierSpans(rep);
      lines.push({ id: spec.name, closed: rep.closed, colour: "303030", points: steps(0, n, n / 64).map((u: number): V3 => S.apply(t, S.bezierPoint(rep, u))) });
    } else if (rep.kind === "quintic-hermite") {
      const k: AutoMovieHumanArmCurveSpec.IHermiteKnot[] = rep.knots;
      lines.push({ id: spec.name, closed: false, colour: "303030", points: steps(k[0]!.q, k[k.length - 1]!.q, (k[k.length - 1]!.q - k[0]!.q) / (24 * (k.length - 1))).map((q: number): V3 => S.apply(t, S.quinticPoint(rep, q))) });
    } else if (rep.kind === "ellipse") {
      lines.push({ id: spec.name, closed: true, colour: "303030", points: steps(0, 2 * Math.PI, Math.PI / 72).map((a: number): V3 => S.apply(t, add(rep.centre, add(scale(rep.u, rep.a * Math.cos(a)), scale(rep.v, rep.b * Math.sin(a)))))) });
    } else if (rep.kind === "outline") {
      const axis: { origin: V3; distal: V3 } | null = bundle.axis(spec.frame);
      if (axis === null) diagnostics.push(`${spec.name}: frame ${spec.frame} declares no axis; outline not drawn`);
      else if (rep.direction !== null) {
        const read: { value: (s: number) => number; exact: boolean } = reader(bundle, spec, rep);
        kind = `outline${read.exact ? "" : " (display approximation: parameter interpolated between knots)"}`;
        const dir: V3 = rep.direction;
        lines.push({ id: spec.name, closed: false, colour: colour(dir), points: steps(rep.domain[0], rep.domain[1], STEP).map((s: number): V3 => S.apply(t, add(add(axis.origin, scale(axis.distal, s)), scale(dir, read.value(s))))) });
      } else {
        kind = "fullness (shoulder lines)";
        lines.push(...shoulders(bundle, spec, rep, axis, t, diagnostics));
      }
    } else {
      kind = "conic loop (unavailable: the course frame at its station is not in the spec)";
      diagnostics.push(`${spec.name}: a conic loop needs the course frame at station ${rep.station}; not drawn`);
    }
    const aids: CaptureModel.ILine[] = spec.aids.map((aid: AutoMovieHumanArmCurveSpec.IAid): CaptureModel.ILine => ({ id: `aid:${aid.kind}:${aid.name}`, closed: false, colour: AID_COLOUR[aid.kind] ?? "999999", points: aid.points.map((p: V3): V3 => S.apply(world(aid.frame), p)) }));
    (["d03030", "30a030", "3050d0"] as const).forEach((c: string, k: number): void => {
      aids.push({ id: `frame:${spec.frame}:${"xyz"[k]}`, closed: false, colour: c, points: [t.origin, add(t.origin, scale(t.axes[k]!, 30))] });
    });
    return { id: spec.name, part: bundle.part, frame: spec.frame, kind, lines, aids, datums: spec.datums.map((d: AutoMovieHumanArmCurveSpec.IDatum): V3 => S.apply(world(d.frame), d.point)) };
  }

  /** The value reader of an outline: the region's own map, the exact station parameter, or the interpolated parameter. */
  function reader(bundle: IBundle, spec: Spec, rep: IOutline): { value: (s: number) => number; exact: boolean } {
    const qs: number[] = rep.knots.map((k: AutoMovieHumanArmCurveSpec.IOutlineKnot): number => k.q);
    const jets: AutoMovieHumanFairOutline.IJet[] = rep.knots.map((k: AutoMovieHumanArmCurveSpec.IOutlineKnot): AutoMovieHumanFairOutline.IJet => ({ value: k.value, first: k.first, second: k.second }));
    const hermite: (q: number) => number = (q: number): number => AutoMovieHumanFairOutline.evaluate(qs, jets, q)[0];
    if (bundle.outline !== undefined && bundle.outline(spec, rep.domain[0]) !== null) return { value: (s: number): number => bundle.outline!(spec, s) ?? NaN, exact: true };
    const offset: number = rep.knots[0]!.q - rep.knots[0]!.station;
    if (rep.knots.every((k: AutoMovieHumanArmCurveSpec.IOutlineKnot): boolean => Math.abs(k.q - k.station - offset) < 1e-9)) return { value: (s: number): number => hermite(s + offset), exact: true };
    return {
      exact: false,
      value: (s: number): number => {
        const k: AutoMovieHumanArmCurveSpec.IOutlineKnot[] = rep.knots;
        let i: number = 0;
        while (i < k.length - 2 && s > k[i + 1]!.station) ++i;
        const u: number = (s - k[i]!.station) / (k[i + 1]!.station - k[i]!.station);
        return hermite(k[i]!.q + u * (k[i + 1]!.q - k[i]!.q));
      },
    };
  }

  /** Shoulder lines of a fullness spec between the angularly neighbouring outline directions of its frame. */
  function shoulders(bundle: IBundle, spec: Spec, rep: IOutline, axis: { origin: V3; distal: V3 }, t: AutoMovieHumanArmCurveSpec.ITransform, diagnostics: string[]): CaptureModel.ILine[] {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const siblings: { spec: Spec; rep: IOutline; angle: number }[] = [];
    const e1: V3 = S.unit(Math.abs(axis.distal[0]) < 0.9 ? cross(axis.distal, [1, 0, 0]) : cross(axis.distal, [0, 0, 1]));
    const e2: V3 = cross(axis.distal, e1);
    for (const s of bundle.specs) {
      const r: Spec["representation"] = s.representation;
      if (s.frame !== spec.frame || r.kind !== "outline" || r.direction === null) continue;
      siblings.push({ spec: s, rep: r, angle: Math.atan2(S.dot(r.direction, e2), S.dot(r.direction, e1)) });
    }
    if (siblings.length < 2) {
      diagnostics.push(`${spec.name}: fewer than two outline directions in ${spec.frame}; shoulder lines not drawn`);
      return [];
    }
    siblings.sort((a: { angle: number }, b: { angle: number }): number => a.angle - b.angle);
    const rho: { value: (s: number) => number; exact: boolean } = reader(bundle, spec, rep);
    const readers: ((s: number) => number)[] = siblings.map((x: { spec: Spec; rep: IOutline }): ((s: number) => number) => reader(bundle, x.spec, x.rep).value);

    // A declared quarter scope keeps only the named neighbouring pairs; a pair that is not neighbouring is reported.
    const scope: readonly (readonly [string, string])[] | null = bundle.quarters?.(spec) ?? null;
    const pairs: [number, number][] = siblings.map((_: { spec: Spec }, k: number): [number, number] => [k, (k + 1) % siblings.length]);
    const named: (k: number, j: number, p: readonly [string, string]) => boolean = (k: number, j: number, p: readonly [string, string]): boolean => {
      const a: string = siblings[k]!.spec.name;
      const b: string = siblings[j]!.spec.name;
      return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a);
    };
    if (scope !== null)
      for (const p of scope)
        if (!pairs.some(([k, j]: [number, number]): boolean => named(k, j, p))) diagnostics.push(`${spec.name}: quarter ${p[0]} ~ ${p[1]} is not a pair of neighbouring outlines in ${spec.frame}; not drawn`);
    const kept: [number, number][] = scope === null ? pairs : pairs.filter(([k, j]: [number, number]): boolean => scope.some((p: readonly [string, string]): boolean => named(k, j, p)));
    return kept.map(([k, j]: [number, number]): CaptureModel.ILine => {
      const a: { spec: Spec; rep: IOutline } = siblings[k]!;
      const b: { spec: Spec; rep: IOutline } = siblings[j]!;
      return {
        id: `${spec.name}/${a.spec.name}~${b.spec.name}`,
        closed: false,
        colour: "2050ff",
        points: steps(rep.domain[0], rep.domain[1], STEP).map((s: number): V3 => {
          const f: number = (1 + rho.value(s)) / 2;
          return S.apply(t, add(add(axis.origin, scale(axis.distal, s)), add(scale(a.rep.direction!, f * readers[k]!(s)), scale(b.rep.direction!, f * readers[j]!(s)))));
        }),
      };
    });
  }

  /** Loft rings at every layer, the guides at the four quarter phases, the course and a clay grid every 1.5 mm at 72 phases. */
  export function loft(chain: IAutoMovieLoftChain | null, diagnostics: readonly string[]): CaptureModel.ILoft {
    if (chain === null) return { status: "unavailable", cause: `no loft chain: ${counted(diagnostics).join(" | ") || "the engine returned none"}` };
    const ring: number[] = steps(0, 2 * Math.PI, (2 * Math.PI) / 64);
    const lines: CaptureModel.ILine[] = chain.layers.map((layer: IAutoMovieLoftChain.ILayer, k: number): CaptureModel.ILine => ({ id: `loft:ring:${k}`, closed: true, colour: "505050", points: AutoMovieLoftChain.ring(chain, layer.y, ring) as V3[] }));
    const ys: number[] = steps(chain.layers[0]!.y, chain.layers[chain.layers.length - 1]!.y, STEP);
    (["008080", "8040c0", "c00060", "e07000"] as const).forEach((c: string, k: number): void => {
      lines.push({ id: `loft:guide:${k}`, closed: false, colour: c, points: ys.map((y: number): V3 => AutoMovieLoftChain.point(chain, y, (k * Math.PI) / 2) as V3) });
    });

    // The course through the layer frame origins; a frameless layer is horizontal at height y on the world Y axis.
    lines.push({ id: "loft:course", closed: false, colour: "888888", points: chain.layers.map((l: IAutoMovieLoftChain.ILayer): V3 => (l.frame === undefined ? [0, l.y, 0] : (l.frame.origin as V3))) });
    const { positions, indices }: AutoMovieHumanLoftMesh.IContext = AutoMovieHumanLoftMesh.sampled(chain, ys, 72);
    return { status: "available", lines, clay: { positions, indices }, diagnostics: counted(diagnostics) };
  }

  /** Every domain's {@link loft}, drawn together: lines prefixed by their domain, clay meshes appended with their own vertices; nothing joins them. */
  export function lofts(chains: readonly IAutoMovieLoftChain[], diagnostics: readonly string[], allowDomainRefusal: boolean = false): CaptureModel.ILoft {
    if (chains.length === 0) return { status: "unavailable", cause: `no loft chain in any domain: ${counted(diagnostics).join(" | ") || "the engine returned none"}` };
    const lines: CaptureModel.ILine[] = [];
    const positions: number[] = [];
    const indices: number[] = [];
    const refusals: string[] = [];
    chains.forEach((chain: IAutoMovieLoftChain, k: number): void => {
      let one: CaptureModel.ILoft;
      try {
        one = loft(chain, []);
      } catch (error: unknown) {
        if (!allowDomainRefusal || !(error instanceof Error && error.name === "AutoMovieLoftAdmissionError")) throw error;
        refusals.push(`domain ${chain.name}: ${error.message}`);
        return;
      }
      if (one.status !== "available") return;
      for (const line of one.lines) lines.push({ ...line, id: `domain ${k}:${line.id}` });
      const base: number = positions.length / 3;
      for (const position of one.clay.positions) positions.push(position);
      for (const index of one.clay.indices) indices.push(index + base);
    });
    const details: string[] = counted([...diagnostics, ...refusals]);
    if (allowDomainRefusal && positions.length === 0) return { status: "unavailable", cause: `no drawable loft domain: ${details.join(" | ")}` };
    return { status: "available", lines, clay: { positions, indices }, diagnostics: details };
  }

  /** Append the capture grid's original pole fans in their declared order. */
  export const fans: typeof AutoMovieHumanLoftMesh.fans = AutoMovieHumanLoftMesh.fans;

  /** `a` to `b` inclusive in equal steps no wider than `step`. */
  export function steps(a: number, b: number, step: number): number[] {
    const n: number = Math.max(1, Math.ceil(Math.abs(b - a) / step));
    return Array.from({ length: n + 1 }, (_: unknown, k: number): number => a + ((b - a) * k) / n);
  }

  function add(a: V3, b: V3): V3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  function scale(a: V3, s: number): V3 {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
}

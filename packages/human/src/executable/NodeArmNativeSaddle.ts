import { AutoMovieMeshCourse, tessellateAutoMovieContourStrip64 } from "@automovie/engine";
import { type IAutoMovieRecoverySlabObservation, observeAutoMovieRecoverySections } from "@automovie/recovery";

import type { CaptureModel } from "../inspection/CaptureModel";
import { NodeArmDraw } from "./NodeArmDraw";

/** Point or direction in the source chart; the calling function declares its scale. */
type V3 = CaptureModel.Vec3;
/** One directed use of an indexed mesh edge. */
type Edge = [number, number];
/** Original source-cell incidence between two observed section planes. */
type Slab = IAutoMovieRecoverySlabObservation;
/** Vertex or edge-intersection identity from the original source slab. */
type SourceNode = Slab["sourceIncidence"]["nodes"][number];
/** Observed boundary publication with its original component ownership. */
type Port = Slab["ports"][number];
/** Named retained terminal rim in native world metres. */
type Exit = { name: string; points: V3[] };

/** Preserve the original left thumb saddle between the retained indexed palm and digit rims. */
export namespace NodeArmNativeSaddle {
  /**
   * Retain the native source cells through the qualified saddle and continue its two
   * outgoing rails to the existing terminal rings. Source acquisition is in native
   * world millimetres. Indexed loft geometry and the returned mesh are in native
   * world metres. Every retained rim must keep its full oriented edge sequence.
   */
  export function create(mesh: CaptureModel.ITriangles, name: string, verticesMm: V3[], triangles: [number, number, number][], axis: V3, reference: V3, beforeMm: number, afterMm: number, saddle: string, exits: readonly Exit[]): CaptureModel.ITriangles {
    // The final millimetre lies beyond the true saddle and has two ordinary continuations.
    const inner: number = afterMm - 1;
    const slabs: Slab[] = [];
    const observation: ReturnType<typeof observeAutoMovieRecoverySections> = observeAutoMovieRecoverySections({
      name, verticesMm, triangles, axis, reference, coordinatesMm: [beforeMm, inner, afterMm],
      slabPairs: [{ beforeMm, afterMm: inner }, { beforeMm: inner, afterMm }], toleranceMm: 0.2, maxSpans: 256,
      exactCoordinateAliases: true, sourceOrientationSign: 1, cornerDegrees: 45,
    }, { curveFormat: "bezier", onSourceSlab: (slab: Slab): void => { slabs.push(slab); } });
    if (!("value" in observation) || slabs.length !== 2) throw new Error("The native thumb saddle has no source slab observation");
    const [slab, next]: Slab[] = slabs;
    const source: Slab["components"][number][] = slab!.components.filter((c: Slab["components"][number]): boolean =>
      c.topology.manifold && c.topology.orientable === true && c.topology.inputOrientationConsistent && c.topology.genus === 0 && c.issueCodes.length === 0 &&
      c.cycles.filter(({ side }: Slab["components"][number]["cycles"][number]): boolean => side === "before").length === 1 && c.cycles.filter(({ side }: Slab["components"][number]["cycles"][number]): boolean => side === "after").length === 2 && c.cycles.length === 3 &&
      slab!.events.some((event: Slab["events"][number]): boolean => event.id === saddle && event.qualified && event.components.includes(c.id)));
    if (source.length !== 1) throw new Error("The original left thumb saddle has no unique orientable three-rim component");
    const component: Slab["components"][number] = source[0]!;
    const positions: number[] = [...mesh.positions];

    /** Read retained mesh points at their existing native metre scale. */
    const at: (id: number) => V3 = (id: number): V3 => positions.slice(id * 3, id * 3 + 3) as V3;
    const old: Map<string, Edge> = boundary(mesh.indices);
    const rings: number[][] = cycles([...old.values()]);
    const lower: number[] | undefined = rings.find((ring: number[]): boolean => ring.every((id: number): boolean => Math.abs(NodeArmDraw.dot(at(id), axis) * 1000 - beforeMm) < 1e-6));
    if (!lower || rings.length !== 3) throw new Error("The existing palm loft has no one-to-two indexed boundary");
    const vertices: Map<string, number> = new Map([...old.values()].flatMap((edge: Edge): [string, number][] => edge.map((i: number): [string, number] => [at(i).join(","), i])));
    const registry: Map<string, SourceNode> = new Map(slab!.sourceIncidence.nodes.map((node: SourceNode): [string, SourceNode] => [node.id, node]));
    const aliases: Map<string, SourceNode> = new Map(slab!.sourceIncidence.nodes.map((node: SourceNode): [string, SourceNode] => [node.incidenceId, node]));
    const sourceAxis: V3 = [...slab!.axis];

    /** Evaluate the original vertex or clipped edge without moving its section plane. */
    const point: (node: SourceNode) => V3 = ({ vertices: [a, b], scalar }: SourceNode): V3 => {
      const start: V3 = verticesMm[a!]!;
      if (b === undefined) return NodeArmDraw.scale(start, 0.001);
      const direction: V3 = NodeArmDraw.sub(verticesMm[b]!, start);
      const phase: number = (scalar - NodeArmDraw.dot(start, sourceAxis)) / NodeArmDraw.dot(direction, sourceAxis);
      if (!Number.isFinite(phase)) throw new Error("A native clipping node has no source edge intersection");
      return NodeArmDraw.scale(NodeArmDraw.add(start, NodeArmDraw.scale(direction, phase)), 0.001);
    };

    // Recovery identifies physical clipped edges even across duplicate render vertices.
    // Reuse the palm's own indices at the one identical source cut.
    const root: Slab["components"][number]["cycles"][number] = component.cycles.find(({ side }: Slab["components"][number]["cycles"][number]): boolean => side === "before")!;
    const retained: Map<string, number> = new Map(root.nodes.map((id: string): [string, number] => {
      const p: V3 = point(aliases.get(id)!);
      const matches: number[] = lower.filter((i: number): boolean => Math.hypot(...NodeArmDraw.sub(at(i), p)) < 1e-10);
      if (matches.length !== 1) throw new Error("A source saddle root vertex has no unique exact palm index");
      return [id, matches[0]!];
    }));
    if (new Set(retained.values()).size !== lower.length || retained.size !== lower.length) throw new Error("The native saddle changed the exact palm root population");

    /** Share the original incidence identity with the retained palm or a new source point. */
    const index: (id: string) => number = (id: string): number => {
      const node: SourceNode | undefined = registry.get(id) ?? aliases.get(id);
      if (!node) throw new Error("A clipped cell refers to an unknown source node");
      const old: number | undefined = retained.get(node.incidenceId);
      if (old !== undefined) return old;
      const added: number = positions.push(...point(node)) / 3 - 1;
      retained.set(node.incidenceId, added);
      return added;
    };
    const cells: Map<number, Edge[]> = new Map();
    for (const edge of slab!.sourceIncidence.occurrences) if (edge.component === component.id) {
      const uses: Edge[] = cells.get(edge.cell) ?? [];
      uses.push([index(edge.from), index(edge.to)]);
      cells.set(edge.cell, uses);
    }
    const core: number[] = [];
    for (const edges of cells.values()) {
      const [polygon, ...extra]: number[][] = cycles(edges);
      if (!polygon || polygon.length < 3 || extra.length !== 0) throw new Error("A native clipped triangle has no single ordered polygon");
      const n: number = polygon.length;
      const apex: number = polygon.findIndex((id: number, i: number): boolean => polygon.slice(2).every((_: number, j: number): boolean => {
        const p: V3 = at(id);
        return Math.hypot(...NodeArmDraw.cross(NodeArmDraw.sub(at(polygon[(i + j + 1) % n]!), p), NodeArmDraw.sub(at(polygon[(i + j + 2) % n]!), p))) > 1e-15;
      }));
      if (apex < 0) throw new Error("A clipped source polygon has no nondegenerate indexed fan");
      for (let i: number = 1; i + 1 < n; ++i) core.push(polygon[apex]!, polygon[(apex + i) % n]!, polygon[(apex + i + 1) % n]!);
    }
    if (sense(boundary(core), lower) === -1) flip(core);
    const native: Map<string, Edge> = boundary(core);
    if (sense(native, lower) !== 1) throw new Error("The native saddle changed the directed palm root");

    const strips: number[] = [];
    for (const cycle of component.cycles.filter(({ side }: Slab["components"][number]["cycles"][number]): boolean => side === "after")) {
      const port: Port | undefined = slab!.ports.find(({ id }: Port): boolean => cycle.portIds.length === 1 && cycle.portIds[0] === id);
      if (port?.publication.kind !== "closed") throw new Error("A native outgoing saddle rail is not a measured closed port");
      const sourceName: string = port.publication.curveName;
      const inlet: Port | undefined = next!.ports.find(({ side, publication }: Port): boolean => side === "before" && publication.kind === "closed" && publication.curveName === sourceName);
      const owner: Slab["components"][number] | undefined = next!.components.find((candidate: Slab["components"][number]): boolean => inlet?.status === "unique-component" && inlet.components.length === 1 && inlet.components[0] === candidate.id);
      if (!owner || !owner.topology.manifold || owner.topology.orientable !== true || owner.issueCodes.length !== 0 || owner.cycles.length !== 2 || next!.events.some(({ components }: Slab["events"][number]): boolean => components.includes(owner.id)))
        throw new Error("A native saddle exit has no exact ordinary source continuation");
      const outlets: Port[] = next!.ports.filter(({ side, status, components }: Port): boolean => side === "after" && status === "unique-component" && components.includes(owner.id));
      const outlet: Port | undefined = outlets[0];
      if (outlets.length !== 1 || outlet?.publication.kind !== "closed") throw new Error("A native outgoing branch has no unique retained terminal port");
      const name: string = outlet.publication.curveName;
      const exit: Exit | undefined = exits.find((item: Exit): boolean => item.name === name);
      if (!exit) throw new Error("The native outgoing source curve does not name an existing terminal ring");
      const a: number[] = cycle.nodes.map(index);
      const b: number[] = exit.points.map((p: V3): number => {
        const found: number | undefined = vertices.get(p.join(","));
        if (found === undefined) throw new Error("A retained terminal knot has no exact indexed vertex");
        return found;
      });
      const strip: number[] = connect(a, b, at, axis);
      if (sense(boundary(strip), a) === sense(native, a)) flip(strip);
      strips.push(...strip);
    }
    const indices: number[] = [...core, ...strips];
    const result: Map<string, Edge> = boundary(indices);
    if (result.size !== old.size || [...old].some(([key, edge]: [string, Edge]): boolean => result.get(key)?.[0] !== edge[0]))
      throw new Error("The native saddle changed one of its three exact oriented rims");
    return { positions, indices };
  }

  /** Identify an undirected indexed edge without merging distinct source vertices. */
  function edgeKey(a: number, b: number): string {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  /** Require reciprocal interior uses and retain the original directed free edges. */
  function boundary(indices: readonly number[]): Map<string, Edge> {
    const counts: Map<string, Edge[]> = new Map();
    for (let i: number = 0; i < indices.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const a: number = indices[i + j]!, b: number = indices[i + (j + 1) % 3]!;
        const key: string = edgeKey(a, b);
        const uses: Edge[] = counts.get(key) ?? [];
        uses.push([a, b]);
        counts.set(key, uses);
      }
    for (const uses of counts.values())
      if (uses.length > 2 || (uses.length === 2 && uses[0]![0] === uses[1]![0])) throw new Error("The native saddle patch has a nonreciprocal interior edge");
    return new Map([...counts].filter(([, uses]: [string, Edge[]]): boolean => uses.length === 1).map(([key, uses]: [string, Edge[]]): [string, Edge] => [key, uses[0]!]));
  }

  /** Walk every closed indexed boundary, rejecting missing or competing successors. */
  function cycles(edges: readonly Edge[]): number[][] {
    const next: Map<number, number> = new Map(edges);
    if (next.size !== edges.length) throw new Error("The native boundary has competing successors");
    const result: number[][] = [];
    while (next.size !== 0) {
      const start: number = next.keys().next().value!;
      const ring: number[] = [];
      let cursor: number = start;
      do {
        const to: number | undefined = next.get(cursor);
        if (to === undefined) throw new Error("The native boundary did not close");
        ring.push(cursor);
        next.delete(cursor);
        cursor = to;
      } while (cursor !== start);
      result.push(ring);
    }
    return result;
  }

  /** Report one coherent indexed rim direction independently from its physical point order. */
  function sense(edges: Map<string, Edge>, ring: number[]): number {
    const direction: Set<number> = new Set(ring.map((a: number, i: number): number => {
      const b: number = ring[(i + 1) % ring.length]!;
      const edge: Edge | undefined = edges.get(edgeKey(a, b));
      return edge === undefined ? 0 : edge[0] === a ? 1 : -1;
    }));
    return direction.size === 1 ? direction.values().next().value! : 0;
  }

  /** Reverse complete triangle winding while leaving every boundary point in place. */
  function flip(indices: number[]): void {
    for (let i: number = 0; i < indices.length; i += 3)
      [indices[i + 1], indices[i + 2]] = [indices[i + 2]!, indices[i + 1]!];
  }

  /** Loft the retained metre-scale rim points in physical order and require strip qualification. */
  function connect(a: number[], b: number[], at: (i: number) => V3, axis: V3): number[] {
    const first: V3[] = a.map(at), second: V3[] = b.map(at);
    const identities: Map<V3, number> = new Map([
      ...first.map((p: V3, i: number): [V3, number] => [p, a[i]!]),
      ...second.map((p: V3, i: number): [V3, number] => [p, b[i]!]),
    ]);

    /** Compare physical perimeter order independently from indexed face winding. */
    const orientation: (ring: V3[]) => number = (ring: V3[]): number => NodeArmDraw.dot(AutoMovieMeshCourse.newell(ring), axis);
    if (orientation(first) * orientation(second) < 0) second.reverse();
    const strip: number[] = [];
    tessellateAutoMovieContourStrip64(first, second, (p: V3, q: V3, r: V3): void => {
      strip.push(identities.get(p)!, identities.get(q)!, identities.get(r)!);
    }, (p: V3): string => String(identities.get(p)), ({ qualified }: Parameters<NonNullable<Parameters<typeof tessellateAutoMovieContourStrip64>[4]>>[0]): void => {
      if (!qualified) throw new Error("An original saddle exit ordinary strip is unqualified");
    });
    return strip;
  }
}

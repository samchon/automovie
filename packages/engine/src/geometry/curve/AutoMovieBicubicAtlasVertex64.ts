import { AutoMovieBernsteinAlgebra64 as B } from "./AutoMovieBernsteinAlgebra64";
import type { AutoMovieBicubicAtlasPlan64 } from "./AutoMovieBicubicAtlasPlan64";
import type { AutoMovieBicubicAtlasRegistry64 } from "./AutoMovieBicubicAtlasRegistry64";
import type { AutoMovieBicubicAtlasTypes64 } from "./AutoMovieBicubicAtlasTypes64";
import { AutoMovieCurveMath64 as V } from "./AutoMovieCurveMath64";

type Patch = AutoMovieBicubicAtlasTypes64["Patch"];
type AtlasInput = AutoMovieBicubicAtlasTypes64["AtlasInput"];

type AtlasChunk = AutoMovieBicubicAtlasTypes64["AtlasChunk"];

type Occurrence = AutoMovieBicubicAtlasTypes64["Occurrence"];
type Vertex = AutoMovieBicubicAtlasTypes64["Vertex"];
type Phase = AutoMovieBicubicAtlasTypes64["Phase"];
type Sample = AutoMovieBicubicAtlasTypes64["Sample"];
type Edge = AutoMovieBicubicAtlasTypes64["Edge"];
type Corner = AutoMovieBicubicAtlasTypes64["Corner"];
/**
 * Create the current patch vertex owner while reading the live generator chunk for each allocation.
 *
 * @evidence contracts/common.md#principled-implementation Canonical identities, fan reuse, arithmetic admission and allocation order retain the original vertex construction.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Each new vertex uses existing edge, corner, fan and local-map lookups plus fixed-degree evaluation.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared registries and the cursor are the same objects across chunks; currentChunk prevents retaining an obsolete yielded chunk.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The factory borrows generator state and retains no external resource; its patch-local closure expires after that patch.
 */
export function AutoMovieBicubicAtlasVertex64(
  input: AtlasInput,
  prepared: ReturnType<typeof AutoMovieBicubicAtlasPlan64>,
  registered: ReturnType<typeof AutoMovieBicubicAtlasRegistry64>,
  p: number,
  patch: Patch,
  phaseMaps: Map<number, Phase[]>[],
  local: Map<string, Vertex>,
  cursor: { nextIndex: number },
  currentChunk: () => AtlasChunk,
  jet: (
    p: number,
    u: number,
    v: number,
  ) => { position: B.Vec; normal: B.Vec; regular: boolean },
  edgeUV: (side: number, t: number) => [number, number],
  SIDES: readonly (readonly number[])[],
): (sample: Sample) => Vertex {
  const {
    plans,
    boundary,
    fanVertices,
  }: ReturnType<typeof AutoMovieBicubicAtlasPlan64> = prepared;
  const { root, canonicalPoint }: typeof boundary = boundary;
  const {
    corners,
    patchEdges,
    occurrences,
    summary,
  }: ReturnType<typeof AutoMovieBicubicAtlasRegistry64> = registered;
  const vertex: (sample: Sample) => Vertex = (sample: Sample): Vertex => {
    const chunk: AtlasChunk = currentChunk();
    const { u, v }: Sample = sample;
    const key: string = `${u}:${v}:${sample.phase?.key ?? "interior"}`,
      previous: Vertex | undefined = local.get(key);
    if (previous) return previous;
    const isCorner: boolean = (u === 0 || u === 1) && (v === 0 || v === 1);
    const touchingSides: number[] = [
      v === 0 ? 0 : -1,
      u === 1 ? 1 : -1,
      v === 1 ? 2 : -1,
      u === 0 ? 3 : -1,
    ].filter((value: number): boolean => value >= 0);
    const side: number =
      sample.side ??
      touchingSides.find(
        (candidate: number): boolean =>
          occurrences[p]![candidate]?.binding !== undefined,
      ) ??
      touchingSides[0] ??
      -1;
    const cornerId: number = isCorner
      ? patch.controlIds[(v === 1 ? 12 : 0) + (u === 1 ? 3 : 0)]!
      : -1;
    const corner: Corner | undefined = isCorner
      ? corners.get(root(`control:${cornerId}`))
      : undefined;
    const edge: Edge | undefined = side >= 0 ? patchEdges[p]![side] : undefined;
    const requested: Phase | undefined =
      sample.phase ??
      (side >= 0
        ? phaseMaps[side]!.get(side % 2 === 0 ? u : v)?.[0]
        : undefined);
    const q: number = requested?.value ?? (side >= 0 ? NaN : 0);
    if (side >= 0 && !Number.isFinite(q))
      throw new Error(
        "canonical edge phase is not representable in this chart",
      );
    const declared: Occurrence["binding"] =
      side >= 0 ? occurrences[p]![side]?.binding : undefined;
    if (declared && edge) {
      const phase: Phase = requested!,
        identity: string = root(`authority:${declared.authority}:${phase.key}`);
      const fans: Map<string, Vertex> = fanVertices.get(identity) ?? new Map();
      fanVertices.set(identity, fans);
      const fan: string =
        declared.legacy === undefined
          ? `explicit:${declared.normalFan}`
          : `legacy:${declared.legacy}`;
      const shared: Vertex | undefined = fans.get(fan);
      if (shared) {
        local.set(key, shared);
        return shared;
      }
      const position: B.Vec = canonicalPoint(declared.authority, phase),
        value: ReturnType<typeof jet> = jet(p, u, v);
      if (
        !position.every(Number.isFinite) ||
        !Number.isSafeInteger(cursor.nextIndex + 1)
      )
        throw new Error("Unrepresentable canonical boundary vertex");
      const result: Vertex = {
        index: cursor.nextIndex++,
        position: V.scale(position, 0.001),
      };
      chunk.positions.push(...result.position);
      chunk.normals.push(...value.normal);
      chunk.physicalVertexIds.push(`${input.topologyDomain}:${identity}`);
      chunk.counts.vertices++;
      summary.vertices++;
      if (!value.regular) chunk.counts.unresolvedVertexNormals++;
      fans.set(fan, result);
      local.set(key, result);
      return result;
    }
    const shared: Vertex | undefined =
      corner?.vertex ?? (isCorner ? undefined : edge?.vertices.get(q));
    if (shared) {
      local.set(key, shared);
      return shared;
    }
    let owner: { patch: number; u: number; v: number } = { patch: p, u, v };
    let identity: string = `${input.topologyDomain}:patch:${patch.id}:u:${u}:v:${v}`;
    let position: B.Vec | undefined;
    if (corner) {
      owner = corner.owner;
      identity = `${input.topologyDomain}:${root(`control:${cornerId}`)}`;
      position = V.clone(corner.position);
    } else if (edge) {
      const uv: [number, number] = edgeUV(
        edge.owner.side,
        edge.owner.reverse ? 1 - q : q,
      );
      owner = { patch: edge.owner.patch, u: uv[0], v: uv[1] };
      identity = `${input.topologyDomain}:edge:${edge.key}:phase:${q}`;
      const net: B.Poly = SIDES[edge.owner.side]!.map(
        (slot: number): B.Vec =>
          plans[edge.owner.patch]!.grid[Math.floor(slot / 4)]![slot % 4]!,
      );
      position = B.value(edge.owner.reverse ? [...net].reverse() : net, q);
    }
    const value: ReturnType<typeof jet> = jet(owner.patch, owner.u, owner.v);
    position ??= value.position;
    if (!position.every(Number.isFinite))
      throw new Error("nonfinite generated position");
    if (!Number.isSafeInteger(cursor.nextIndex + 1))
      throw new Error("resource-unprocessed: global vertex index exhausted");
    const result: Vertex = {
      index: cursor.nextIndex++,
      position: V.scale(position, 0.001),
    };
    chunk.positions.push(...result.position);
    chunk.normals.push(...value.normal);
    chunk.physicalVertexIds.push(identity);
    chunk.counts.vertices++;
    summary.vertices++;
    if (!value.regular) chunk.counts.unresolvedVertexNormals++;
    local.set(key, result);
    if (corner) corner.vertex = result;
    else if (edge) edge.vertices.set(q, result);
    return result;
  };

  return vertex;
}

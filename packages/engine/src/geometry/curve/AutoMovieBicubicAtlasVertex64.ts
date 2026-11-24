import type {
  AutoMovieBernsteinPolynomial64,
  AutoMovieVector3Tuple,
  IAutoMovieBicubicAtlas64,
  IAutoMovieBicubicAtlasPlan64,
  IAutoMovieBicubicAtlasRegistry64,
  IAutoMovieBicubicAtlasTessellation64,
  IAutoMovieBicubicAtlasVertex64,
  IAutoMovieCanonicalBoundaryPhase64,
} from "@automovie/interface";

import { AutoMovieBernsteinAlgebra64 as B } from "./AutoMovieBernsteinAlgebra64";
import { AutoMovieCurveMath64 as V } from "./AutoMovieCurveMath64";

type Occurrence = IAutoMovieBicubicAtlas64.Occurrence;
type Edge = IAutoMovieBicubicAtlas64.Edge;
type Corner = IAutoMovieBicubicAtlas64.Corner;
/**
 * Create the current patch vertex owner while reading the live generator chunk
 * for each allocation.
 */
export function AutoMovieBicubicAtlasVertex64(
  input: IAutoMovieBicubicAtlasTessellation64.Input,
  prepared: IAutoMovieBicubicAtlasPlan64.IResult,
  registered: IAutoMovieBicubicAtlasRegistry64.IResult,
  p: number,
  patch: IAutoMovieBicubicAtlas64.Patch,
  phaseMaps: Map<number, IAutoMovieCanonicalBoundaryPhase64[]>[],
  local: Map<string, IAutoMovieBicubicAtlas64.Vertex>,
  cursor: IAutoMovieBicubicAtlasVertex64.ICursor,
  currentChunk: () => IAutoMovieBicubicAtlasTessellation64.Chunk,
  jet: IAutoMovieBicubicAtlasVertex64.IJet,
  edgeUV: (side: number, t: number) => [number, number],
  SIDES: readonly (readonly number[])[],
): (
  sample: IAutoMovieBicubicAtlas64.Sample,
) => IAutoMovieBicubicAtlas64.Vertex {
  const { plans, boundary, fanVertices }: IAutoMovieBicubicAtlasPlan64.IResult =
    prepared;
  const { root, canonicalPoint }: typeof boundary = boundary;
  const {
    corners,
    patchEdges,
    occurrences,
    summary,
  }: IAutoMovieBicubicAtlasRegistry64.IResult = registered;
  const vertex: (
    sample: IAutoMovieBicubicAtlas64.Sample,
  ) => IAutoMovieBicubicAtlas64.Vertex = (
    sample: IAutoMovieBicubicAtlas64.Sample,
  ): IAutoMovieBicubicAtlas64.Vertex => {
    const chunk: IAutoMovieBicubicAtlasTessellation64.Chunk = currentChunk();
    const { u, v }: IAutoMovieBicubicAtlas64.Sample = sample;
    const key: string = `${u}:${v}:${sample.phase?.key ?? "interior"}`,
      previous: IAutoMovieBicubicAtlas64.Vertex | undefined = local.get(key);
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
    const requested: IAutoMovieCanonicalBoundaryPhase64 | undefined =
      sample.phase ??
      (side >= 0
        ? phaseMaps[side]!.get(side % 2 === 0 ? u : v)?.[0]
        : undefined);
    const q: number = requested?.value ?? (side >= 0 ? NaN : 0);
    const declared: Occurrence["binding"] =
      side >= 0 ? occurrences[p]![side]?.binding : undefined;
    if (declared && edge) {
      const phase: IAutoMovieCanonicalBoundaryPhase64 = requested!,
        identity: string = root(`authority:${declared.authority}:${phase.key}`);
      const fans: Map<string, IAutoMovieBicubicAtlas64.Vertex> =
        fanVertices.get(identity) ?? new Map();
      fanVertices.set(identity, fans);
      const fan: string =
        declared.legacy === undefined
          ? `explicit:${declared.normalFan}`
          : `legacy:${declared.legacy}`;
      const shared: IAutoMovieBicubicAtlas64.Vertex | undefined = fans.get(fan);
      if (shared) {
        local.set(key, shared);
        return shared;
      }
      const position: AutoMovieVector3Tuple = canonicalPoint(
          declared.authority,
          phase,
        ),
        value: ReturnType<typeof jet> = jet(p, u, v);
      const result: IAutoMovieBicubicAtlas64.Vertex = {
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
    const shared: IAutoMovieBicubicAtlas64.Vertex | undefined =
      corner?.vertex ?? (isCorner ? undefined : edge?.vertices.get(q));
    if (shared) {
      local.set(key, shared);
      return shared;
    }
    let owner: { patch: number; u: number; v: number } = { patch: p, u, v };
    let identity: string = `${input.topologyDomain}:patch:${patch.id}:u:${u}:v:${v}`;
    let position: AutoMovieVector3Tuple | undefined;
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
      const net: AutoMovieBernsteinPolynomial64 = SIDES[edge.owner.side]!.map(
        (slot: number): AutoMovieVector3Tuple =>
          plans[edge.owner.patch]!.grid[Math.floor(slot / 4)]![slot % 4]!,
      );
      position = B.value(edge.owner.reverse ? [...net].reverse() : net, q);
    }
    const value: ReturnType<typeof jet> = jet(owner.patch, owner.u, owner.v);
    position ??= value.position;
    const result: IAutoMovieBicubicAtlas64.Vertex = {
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

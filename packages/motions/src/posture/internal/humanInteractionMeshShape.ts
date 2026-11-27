import type { IAutoMovieMotionHumanInteractionMesh } from "@automovie/interface";

/*
 * The mesh's aligned shape (`HumanInteractionMesh.adapt`'s start): contact
 * offsets and target-length bones propagated along their reference directions
 * from the first point, the reference centroid preserved.
 * Parameter bones: The mesh's bones and their target lengths.
 * Parameter contacts: The mesh's contacts and their offsets.
 * Parameter reference: The reference points, x then y then z by point.
 * Returns: The aligned points, or undefined when the bones and contacts do not
 * connect every point or a bone has no length.
 */
export function humanInteractionMeshShape(
  bones: readonly IAutoMovieMotionHumanInteractionMesh.IBone[],
  contacts: readonly IAutoMovieMotionHumanInteractionMesh.IContact[],
  reference: Float64Array,
): Float64Array | undefined {
  const n: number = reference.length / 3;
  if (bones.length + contacts.length < n - 1) return undefined;
  const edges: IOffsetEdge[][] = Array.from(
    { length: n },
    (): IOffsetEdge[] => [],
  );
  function connect(from: number, to: number, by: readonly number[]): void {
    edges[from]!.push({ index: to, by });
    edges[to]!.push({ index: from, by: by.map((v: number): number => -v) });
  }
  for (const contact of contacts)
    connect(contact.b, contact.a, [
      contact.offset?.x ?? 0,
      contact.offset?.y ?? 0,
      contact.offset?.z ?? 0,
    ]);
  for (const bone of bones) {
    const direction: number[] = AXES.map(
      (axis: number): number =>
        reference[3 * bone.to + axis]! - reference[3 * bone.from + axis]!,
    );
    const length: number = Math.hypot(...direction);
    if (length === 0) return undefined;
    connect(
      bone.from,
      bone.to,
      direction.map((v: number): number => (v * bone.length) / length),
    );
  }
  const found: Uint8Array = new Uint8Array(n);
  const result: Float64Array = new Float64Array(reference.length);
  const visited: number[] = [0];
  found[0] = 1;
  for (let q: number = 0; q < visited.length; q++) {
    const p: number = visited[q]!;
    for (const edge of edges[p]!) {
      if (found[edge.index] === 1) continue;
      for (const axis of AXES)
        result[3 * edge.index + axis] =
          result[3 * p + axis]! + edge.by[axis]!;
      found[edge.index] = 1;
      visited.push(edge.index);
    }
  }
  if (visited.length !== n) return undefined;
  for (const axis of AXES) {
    let translate: number = 0;
    for (let i: number = axis; i < result.length; i += 3)
      translate += reference[i]! - result[i]!;
    for (let i: number = axis; i < result.length; i += 3)
      result[i]! += translate / n;
  }
  return result;
}

/*
 * A fixed Cartesian edge to a mesh point.
 */
interface IOffsetEdge {
  index: number;
  by: readonly number[];
}

/*
 * Cartesian coordinates within each mesh point.
 */
const AXES: readonly number[] = [0, 1, 2];

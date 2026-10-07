

/**
 * Which side a vertex both segments touch belongs to, by the bone that
 * dominates it: `-1` when the bone is `other`, `+1` otherwise.
 */
export function ownerOfSeam(
  segments: Map<string, number[]>,
  dominant: (vertex: number) => string,
  part: string,
  other: string,
): Map<number, 1 | -1> {
  const owner = new Map<number, 1 | -1>();
  for (const bone of [other, part])
    for (const v of segments.get(bone)!)
      owner.set(v, dominant(v) === other ? -1 : 1);
  return owner;
}

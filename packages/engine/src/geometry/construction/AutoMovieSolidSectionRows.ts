/**
 * Indexed topology for already prepared physical sections. The caller owns the
 * actual positions, including an existing shared vertex at either contracted
 * end.
 *
 * @see https://github.com/live-clones/gmsh/blob/gmsh_4_15_2/src/mesh/meshGFaceTransfinite.cpp#L866-L878 Gmsh's single-pole transfinite rows.
 */
export namespace AutoMovieSolidSectionRows {
  /**
   * Join equal-width index rows directly. An end with a single point uses that
   * same index in every incident triangle. Actual shared outline identities are
   * owned by the caller.
   */
  export function triangulate(
    rows: readonly (readonly number[])[],
  ): [number, number, number][] {
    if (rows.slice(1, -1).some((row) => row.length < 2))
      throw new Error("Only a physical section end may contract to one point");
    const triangles: [number, number, number][] = [];
    for (let i = 1; i < rows.length; ++i) {
      const a = rows[i - 1]!;
      const b = rows[i]!;
      if (a.length === 1 && b.length > 1) {
        for (let j = 1; j < b.length; ++j)
          triangles.push([a[0]!, b[j - 1]!, b[j]!]);
      } else if (b.length === 1 && a.length > 1) {
        for (let j = 1; j < a.length; ++j)
          triangles.push([a[j - 1]!, b[0]!, a[j]!]);
      } else {
        if (!(a.length === b.length && a.length > 1))
          throw new Error(
            "Physical section rows need matching positive-width columns",
          );
        for (let j = 1; j < a.length; ++j) {
          triangles.push([a[j - 1]!, b[j - 1]!, b[j]!]);
          triangles.push([a[j - 1]!, b[j]!, a[j]!]);
        }
      }
    }
    return triangles;
  }
}

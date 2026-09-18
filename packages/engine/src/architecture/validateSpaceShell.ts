/**
 * A closed boundary, held to exactly what makes its inside a fact.
 *
 * Three things are checked and nothing is repaired. Every index must name a
 * vertex the shell carries, and every face must have area, because a face
 * nobody can look up or that is a line contributes a solid angle of nothing to
 * a query that would then answer confidently. The surface must be **closed**:
 * each directed edge appears exactly once and its own reverse exactly once, so
 * a missing facet is a hole through which inside leaks into outside, and a
 * duplicated one is a facet counted twice. And the enclosed volume must be
 * positive, which is how "wound counter-clockwise seen from outside" is
 * actually checked: a shell turned inside out passes every local test and
 * answers the exact opposite of the truth for every point in the building.
  * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const validateSpaceShell = (
  shell: IAutoMovieSpaceShell,
  path: string,
  collector: ViolationCollector,
): void => {
  shell.vertices.forEach((vertex, index) => {
    finiteVector(
      vertex,
      `${path}.vertices[${index}]`,
      "shell vertex",
      collector,
    );
  });
  if (shell.vertices.length < 4)
    collector.push(
      "range",
      `${path}.vertices`,
      `a closed shell needs at least 4 vertices, but had ${shell.vertices.length}`,
      shell.vertices.length,
    );
  if (shell.triangles.length < 12 || shell.triangles.length % 3 !== 0) {
    collector.push(
      "range",
      `${path}.triangles`,
      `a closed shell needs at least 4 triangles as whole index triples, but had ${shell.triangles.length} indices`,
      shell.triangles.length,
    );
    return;
  }
  const bad = shell.triangles.findIndex(
    (index) =>
      Number.isSafeInteger(index) === false ||
      index < 0 ||
      index >= shell.vertices.length,
  );
  if (bad !== -1) {
    collector.push(
      "range",
      `${path}.triangles[${bad}]`,
      `shell triangle index must name one of the ${shell.vertices.length} vertices, but was ${shell.triangles[bad]}`,
      shell.triangles[bad],
    );
    return;
  }
  const edges = new Map<string, number>();
  for (let face = 0; face < shell.triangles.length; face += 3) {
    const corners = [
      shell.triangles[face]!,
      shell.triangles[face + 1]!,
      shell.triangles[face + 2]!,
    ];
    const a = shell.vertices[corners[0]!]!;
    const b = shell.vertices[corners[1]!]!;
    const c = shell.vertices[corners[2]!]!;
    if (
      Vector3.length(
        Vector3.cross(Vector3.subtract(b, a), Vector3.subtract(c, a)),
      ) <= PLANE_NORMAL_EPSILON
    ) {
      collector.push(
        "range",
        `${path}.triangles[${face}]`,
        `shell triangle ${face / 3} encloses no area, so it bounds nothing`,
        corners,
      );
      return;
    }
    for (let corner = 0; corner < 3; ++corner) {
      const key = `${corners[corner]}>${corners[(corner + 1) % 3]}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  const open = [...edges.entries()].find(
    ([key, count]) =>
      count !== 1 || edges.get(key.split(">").reverse().join(">")) !== 1,
  );
  if (open !== undefined) {
    collector.push(
      "type",
      `${path}.triangles`,
      `shell is not closed: directed edge ${open[0]} is not matched by exactly one facet and one opposite facet`,
      open[0],
    );
    return;
  }
  const volume = builtSpaceShellVolume(shell);
  if (volume <= 0)
    collector.push(
      "range",
      `${path}.triangles`,
      "shell encloses no positive volume: wind its facets counter-clockwise seen from outside the solid",
      volume,
    );
};

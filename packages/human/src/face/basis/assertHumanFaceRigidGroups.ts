import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";

/**
 * Admit complete, disjoint rigid components before the facial basis is compiled.
 * Schema and finite XYZ/index admission precede this structural check. A triangle
 * spanning two motion owners would tear under performance, so membership must
 * include every corner of every selected component. Unselected components retain
 * their endpoint behavior. The input surface is read without mutation.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Refuses ambiguous or tearing rigid-component correspondence.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Checks rigid vertex ownership against complete resident triangles.
 */
export function assertHumanFaceRigidGroups(
  surface: IAutoMovieHumanFaceBasis["surfaces"][number],
): void {
  const owners = new Map<number, string>();
  const ids = new Set<string>();
  for (const group of surface.rigidGroups ?? []) {
    if (
      group.id.trim() === "" ||
      ids.has(group.id) ||
      group.vertices.length === 0
    )
      throw new Error(
        "Rigid facial groups need unique names and resident vertices.",
      );
    ids.add(group.id);
    let previous = -1;
    for (const vertex of group.vertices) {
      if (
        !Number.isInteger(vertex) ||
        vertex <= previous ||
        vertex >= surface.positions.length / 3 ||
        owners.has(vertex)
      )
        throw new Error(
          "Rigid facial vertices must be resident, increasing and disjoint.",
        );
      previous = vertex;
      owners.set(vertex, group.id);
    }
  }
  for (let i = 0; i < surface.indices.length; i += 3) {
    const owner = owners.get(surface.indices[i]);
    if (
      owners.get(surface.indices[i + 1]) !== owner ||
      owners.get(surface.indices[i + 2]) !== owner
    )
      throw new Error(
        "A facial triangle cannot straddle a rigid-group boundary.",
      );
  }
}

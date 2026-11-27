import type { IAutoMovieActionTarget } from "@automovie/interface";

/*
 * Why a positional target did not resolve to a world point, phrased as the
 * clause after "but".
 *
 * The discriminator is the fault only for a relative kind. A `node` or `group`
 * target names a legal kind and an id that is not placed, so echoing the kind
 * made one sentence list a node target as valid and reject it at the same
 * time, leaving the correction round nothing it could act on (#1294). Name the
 * id instead: it is the only thing the author can fix.
 */
export function positionalTargetFault(target: IAutoMovieActionTarget): string {
  if (target.kind === "node")
    return `"${target.node}" is not placed in the staged scene`;
  if (target.kind === "bone")
    return `bone "${target.bone}" on "${target.node}" does not resolve from a rigged staged actor`;
  if (target.kind === "group") {
    const members: string[] = [
      ...target.nodes.map((node: string): string => `"${node}"`),
      ...(target.formations ?? []).map(
        (formation: string): string => `formation "${formation}"`,
      ),
    ];
    return members.length === 0
      ? "its group names no members"
      : `one or more group members are not placed in the staged scene: ${members.join(", ")}`;
  }
  if (target.kind === "point")
    return "a point target must carry finite x/y/z coordinates";
  return `a target of kind "${target.kind}" is relative (a heading or a frame edge), so it names no place`;
}

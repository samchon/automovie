import type {
  IAutoMovieHumanFaceBasisChannel as IAutoMovieHumanFaceBasisChannelImported,
  IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported,
} from "../../index";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceComponentTree } from "../structures/IAutoMovieHumanFaceComponentTree";

const DOCUMENT_FIELDS: readonly [
  "hair",
  "iris",
  "skin",
  "materials",
  "eyes",
  "lashes",
  "anatomical",
] = [
  "hair",
  "iris",
  "skin",
  "materials",
  "eyes",
  "lashes",
  "anatomical",
] as const;

/**
 * Compile one application's authored anatomical hierarchy against its exact
 * connected basis. The editor consumes the returned owned tree and channel
 * label paths; document replay still evaluates flat channels in basis order.
 * Physical surface ownership is distinct from channel influence: the root
 * owns continuous skin even when an ocular or nasal child moves its vertices.
 * The manifest must cover every channel, basis surface and appearance field
 * once. Validation refuses cycles, aliases and stale basis revisions instead
 * of silently leaving a fine control unreachable after a source revision.
 *
 * @evidence contracts/common.md#principled-implementation Recursive traversal admits one unaliased tree, distinct node identities and exactly one owner for every resident channel/surface and declared DocumentField. Paths expose the authored hierarchy to editor consumers without changing flat basis evaluation or confusing influence with physical ownership.
 * @evidence contracts/common.md#clear-and-simple-design One traversal builds the owned tree and three address maps, followed by completeness checks against the fixed basis and current seven-field component schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing, duplicate, aliased graph nodes and unsupported owners refuse rather than being assigned to a fallback group. The seven document fields are this component contract's vocabulary, not a claim that every newer basis-document section is represented here.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies exact revision, unaliased ownership, copied result, channel versus physical-surface meaning and the hierarchy's editor role.
 * @evidence contracts/performance.md#efficient-algorithms Membership and duplicate checks use sets/maps; traversal costs the node/member population plus the sum of node path depths because each node copies its label path. Deep trees can have quadratic total path storage and exhaust the recursive stack; no independent depth cap is implemented.
 * @evidence contracts/performance.md#reuse-equivalent-work Each node's one path serves all its assigned members, and known basis sets serve the entire walk. The returned maps/tree form the completed compile result; there is no cache across changed manifests or revisions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary sets are released after compilation; the caller owns the copied tree and its member path maps. Their size follows the submitted hierarchy, with no history, external handle or independently enforced hierarchy-size bound.
 */
export function createHumanFaceComponentTree(
  basis: Pick<IAutoMovieHumanFaceBasis, "id" | "channels" | "surfaces">,
  manifest: IAutoMovieHumanFaceComponentTree,
): {
  root: IAutoMovieHumanFaceComponentTree.Node;
  channelPaths: ReadonlyMap<string, readonly string[]>;
  surfacePaths: ReadonlyMap<string, readonly string[]>;
  documentPaths: ReadonlyMap<
    IAutoMovieHumanFaceComponentTree.DocumentField,
    readonly string[]
  >;
} {
  if (manifest.basis !== basis.id)
    throw new Error("A facial component tree needs its exact basis revision.");
  const channelIds: string[] = basis.channels.map(
    (channel: IAutoMovieHumanFaceBasisChannelImported): string => channel.id,
  );
  const surfaceIds: string[] = basis.surfaces.map(
    (surface: IAutoMovieHumanFaceBasisSurfaceImported): string => surface.id,
  );
  if (
    new Set(channelIds).size !== channelIds.length ||
    new Set(surfaceIds).size !== surfaceIds.length
  )
    throw new Error("A facial component tree needs distinct basis identities.");
  const knownChannels: Set<string> = new Set(channelIds),
    knownSurfaces: Set<string> = new Set(surfaceIds);
  const channelPaths: Map<string, readonly string[]> = new Map<
      string,
      readonly string[]
    >(),
    surfacePaths: Map<string, readonly string[]> = new Map<
      string,
      readonly string[]
    >(),
    documentPaths: Map<
      IAutoMovieHumanFaceComponentTree.DocumentField,
      readonly string[]
    > = new Map<
      IAutoMovieHumanFaceComponentTree.DocumentField,
      readonly string[]
    >();
  const nodes: WeakSet<IAutoMovieHumanFaceComponentTree.Node> =
      new WeakSet<IAutoMovieHumanFaceComponentTree.Node>(),
    identities: Set<string> = new Set<string>();
  const walk: (
    node: IAutoMovieHumanFaceComponentTree.Node,
    parents: readonly string[],
  ) => IAutoMovieHumanFaceComponentTree.Node = (
    node: IAutoMovieHumanFaceComponentTree.Node,
    parents: readonly string[],
  ): IAutoMovieHumanFaceComponentTree.Node => {
    if (node === null || typeof node !== "object")
      throw new Error("Facial component groups need an object node.");
    if (nodes.has(node))
      throw new Error("Facial component groups must form one unaliased tree.");
    nodes.add(node);
    if (
      typeof node.id !== "string" ||
      typeof node.label !== "string" ||
      typeof node.description !== "string" ||
      node.id.trim() === "" ||
      node.label.trim() === "" ||
      node.description.trim() === "" ||
      identities.has(node.id) ||
      !Array.isArray(node.channels) ||
      !Array.isArray(node.surfaces) ||
      !Array.isArray(node.documentFields) ||
      !Array.isArray(node.children) ||
      node.channels.some(
        (id: string): boolean => typeof id !== "string" || id.trim() === "",
      ) ||
      node.surfaces.some(
        (id: string): boolean => typeof id !== "string" || id.trim() === "",
      ) ||
      node.documentFields.some(
        (field: IAutoMovieHumanFaceComponentTree.DocumentField): boolean =>
          typeof field !== "string" || field.trim() === "",
      ) ||
      (node.channels.length === 0 &&
        node.surfaces.length === 0 &&
        node.documentFields.length === 0 &&
        node.children.length === 0)
    )
      throw new Error(
        "Facial component groups need distinct names, descriptions and members.",
      );
    identities.add(node.id);
    const path: string[] = [...parents, node.label];
    for (const id of node.channels) {
      if (!knownChannels.has(id) || channelPaths.has(id))
        throw new Error(
          "Facial component channels need one resident owner: " + id,
        );
      channelPaths.set(id, path);
    }
    for (const id of node.surfaces) {
      if (!knownSurfaces.has(id) || surfacePaths.has(id))
        throw new Error(
          "Facial component surfaces need one resident owner: " + id,
        );
      surfacePaths.set(id, path);
    }
    for (const field of node.documentFields) {
      if (!DOCUMENT_FIELDS.includes(field) || documentPaths.has(field))
        throw new Error(
          "Facial appearance fields need one supported owner: " + field,
        );
      documentPaths.set(field, path);
    }
    return {
      id: node.id,
      label: node.label,
      description: node.description,
      channels: [...node.channels],
      surfaces: [...node.surfaces],
      documentFields: [...node.documentFields],
      children: node.children.map(
        (
          child: IAutoMovieHumanFaceComponentTree.Node,
        ): IAutoMovieHumanFaceComponentTree.Node => walk(child, path),
      ),
    };
  };
  const root: IAutoMovieHumanFaceComponentTree.Node = walk(manifest.root, []);
  for (const id of channelIds)
    if (!channelPaths.has(id))
      throw new Error("The facial component tree omits channel " + id);
  for (const id of surfaceIds)
    if (!surfacePaths.has(id))
      throw new Error("The facial component tree omits surface " + id);
  for (const field of DOCUMENT_FIELDS)
    if (!documentPaths.has(field))
      throw new Error("The facial component tree omits appearance " + field);
  return { root, channelPaths, surfacePaths, documentPaths };
}

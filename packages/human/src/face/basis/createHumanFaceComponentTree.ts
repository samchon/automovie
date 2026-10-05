import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceComponentTree } from "../structures/IAutoMovieHumanFaceComponentTree";

const DOCUMENT_FIELDS = ["hair", "iris", "skin", "materials", "eyes", "lashes", "anatomical"] as const;

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
 * @evidence contracts/common.md#principled-implementation The manifest is compiled against its exact basis: every channel, surface and appearance field must have exactly one owner in a single unaliased tree, so no fine control can become unreachable after a source revision; cycles and aliases are refused through the visited-node set and identity uniqueness.
 * @evidence contracts/common.md#clear-and-simple-design One recursive walk that copies the tree while recording the label path of each channel, surface and field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It refuses stale revisions, aliases and missing owners instead of defaulting.
 * @evidence contracts/common.md#meaningful-documentation States that physical surface ownership differs from channel influence, and the coverage the manifest must satisfy.
 * @evidence contracts/modeling.md#part-identity-and-grouping This is the group owner: it composes named nodes of channels, surfaces and appearance fields and copies none of their values; each channel, surface and field belongs to one node.
 * @evidenceExclude contracts/anatomy.md#anatomical-source createHumanFaceComponentTree carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range createHumanFaceComponentTree admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority createHumanFaceComponentTree defines no input through which a caller shapes a human form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry createHumanFaceComponentTree emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries createHumanFaceComponentTree constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#spatial-conventions createHumanFaceComponentTree defines no value that carries a unit or a coordinate frame of its own.
 * @evidenceExclude contracts/modeling.md#rendered-observation createHumanFaceComponentTree owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
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
  const channelIds = basis.channels.map((channel) => channel.id);
  const surfaceIds = basis.surfaces.map((surface) => surface.id);
  if (
    new Set(channelIds).size !== channelIds.length ||
    new Set(surfaceIds).size !== surfaceIds.length
  )
    throw new Error("A facial component tree needs distinct basis identities.");
  const knownChannels = new Set(channelIds),
    knownSurfaces = new Set(surfaceIds);
  const channelPaths = new Map<string, readonly string[]>(),
    surfacePaths = new Map<string, readonly string[]>(),
    documentPaths = new Map<
      IAutoMovieHumanFaceComponentTree.DocumentField,
      readonly string[]
    >();
  const nodes = new WeakSet<IAutoMovieHumanFaceComponentTree.Node>(),
    identities = new Set<string>();
  const walk = (
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
      node.channels.some((id) => typeof id !== "string" || id.trim() === "") ||
      node.surfaces.some((id) => typeof id !== "string" || id.trim() === "") ||
      node.documentFields.some(
        (field) => typeof field !== "string" || field.trim() === "",
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
    const path = [...parents, node.label];
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
      children: node.children.map((child) => walk(child, path)),
    };
  };
  const root = walk(manifest.root, []);
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

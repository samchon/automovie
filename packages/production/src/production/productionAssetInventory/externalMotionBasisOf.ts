import { type IAutoMovieTransform, IAutoMovieExternalMotionBasis } from "@automovie/interface";
import { type IAutoMovieExternalMotionNodeInspection, inspectAutoMovieExternalModelBytes } from "@automovie/ingest";

/**
 * Project byte-inspected nodes into the manifest's canonical motion basis vocabulary.
 *
 * @evidence contracts/common.md#principled-implementation Preserves node indices, ids, names and parents while structured-cloning local rest transforms; frame labels are fixed by this supported glTF motion profile rather than inferred here.
 * @evidence contracts/common.md#clear-and-simple-design The same projection feeds provenance byte comparison and retained source characterization without another node traversal vocabulary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This helper performs no geometric registration, unit conversion or inferred bone mapping; profile admission belongs to ingest.
 * @evidence contracts/common.md#meaningful-documentation Documents retained hierarchy/rest facts and the explicit meter/right-handed/Y-up labels.
 * @evidence contracts/performance.md#efficient-algorithms Maps N nodes and copies each fixed transform, retaining O(N) new metadata and transforms.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares one projection rule, while each actual basis gets fresh transform copies instead of a mutable-node cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the new basis/node/transform records; no source byte buffer, file or native handle is retained by the projection.
 *
 * @author Samchon
 */
export function externalMotionBasisOf(
  inspected: NonNullable<
    ReturnType<typeof inspectAutoMovieExternalModelBytes>["motion"]
  >,
): IAutoMovieExternalMotionBasis { return ({
  profile: "gltf-motion-basis-v1",
  lengthUnit: "meter",
  handedness: "right-handed",
  upAxis: "Y-up",
  nodes: inspected.nodes.map((node: IAutoMovieExternalMotionNodeInspection) : { nodeIndex: number; id: string; sourceName: string | null; parent: string | null; localRest: IAutoMovieTransform; } => ({
    nodeIndex: node.index,
    id: node.id,
    sourceName: node.name,
    parent: node.parent,
    localRest: structuredClone(node.transform),
  })),
}); }

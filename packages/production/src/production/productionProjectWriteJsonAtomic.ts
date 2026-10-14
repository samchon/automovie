import { productionProjectSerializeJson } from "./productionProjectSerializeJson";
import { productionProjectWriteAtomic } from "./productionProjectWriteAtomic";

/**
 * Serialize the current JSON value as UTF-8 before the guarded byte writer.
 *
 * @evidence contracts/common.md#principled-implementation Shared JSON serialization adds its existing final newline, Buffer encodes UTF-8, and the byte writer retains guard/publication/cleanup ordering.
 * @evidence contracts/common.md#clear-and-simple-design JSON representation stays with its serializer; atomic filesystem effects remain with the byte writer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No object snapshot or key reordering changes JSON.stringify semantics; serialization failures occur before publication and native durability remains unproved.
 * @evidence contracts/common.md#meaningful-documentation States UTF-8/newline representation, serialization-before-effects and unchanged delegated callback meaning.
 * @evidence contracts/performance.md#efficient-algorithms Serialization and UTF-8 encoding scale with serialized text/bytes, followed by the byte writer's actual filesystem and callback costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current values and effectful publication callbacks require a new serialization/write; no identity cache admits mutated objects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Text and encoded buffer are invocation-local; the byte writer owns temporary cleanup and project storage owns the published target.
 */
export function productionProjectWriteJsonAtomic(file: string, value: unknown, beforePublish?: () => void, afterPublish?: () => void): void {
    return productionProjectWriteAtomic(file, Buffer.from(productionProjectSerializeJson(value), "utf8"), beforePublish, afterPublish);
}

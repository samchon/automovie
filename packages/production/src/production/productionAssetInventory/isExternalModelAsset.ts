import path from "node:path";

/**
 * Recognize supported glTF-family filename suffixes for ledger dispatch.
 *
 * @evidence contracts/common.md#principled-implementation A case-insensitive extname lookup accepts .gltf, .glb or .vrm under existing dispatch policy.
 * @evidence contracts/common.md#clear-and-simple-design Filename dispatch stays separate from ingest's actual container/profile validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A recognized suffix cannot certify the bytes, a model profile or a usable appearance; those gates still run.
 * @evidence contracts/common.md#meaningful-documentation States case-insensitive suffix selection and its non-admission meaning.
 * @evidence contracts/performance.md#efficient-algorithms Extname/lowercasing scans filename text and compares against three fixed supported suffixes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No parse answer or filename verdict is cached.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes and no file is opened.
 *
 * @author Samchon
 */
export function isExternalModelAsset(value: string): boolean { return [".gltf", ".glb", ".vrm"].includes(path.extname(value).toLowerCase()); }

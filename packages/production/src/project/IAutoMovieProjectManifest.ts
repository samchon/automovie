

/**
 * Historical automovie.json record containing a runtime-admitted version-one marker and registration-ordered relative asset paths. Extra parsed fields remain with the resident mirror, while this erased shape proves no asset bytes, filesystem confinement or current manifest authority.
 *
 * @evidence contracts/common.md#principled-implementation Version and registration-ordered assets retain the legacy automovie.json shape.
 * @evidence contracts/common.md#clear-and-simple-design The resident store owns runtime version/path admission and preserves unknown parsed fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural type authenticates neither resident bytes nor registered asset existence.
 * @evidence contracts/common.md#meaningful-documentation Documents version-one admission and path-list ownership rather than successful binary storage.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased shape runs no parsing; autoMovieProjectValidateManifest owns full asset/path admission.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape coordinates no cache; resident refresh rereads current manifest bytes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration retains nothing; the project instance holds the admitted mirror until refresh or collection.
 * @author Samchon
 */
export interface IAutoMovieProjectManifest {

/** Legacy format marker admitted as exactly one by the runtime manifest validator. */
version: number;

/** Registered project-relative paths in registration order; registration alone proves no binary existence. */
assets: string[];
}



/**
 * A present legacy plan that cannot serve as migration provenance.
 *
 * @evidence contracts/common.md#principled-implementation A native Error formats the admission detail and preserves the stable legacy-plan code/name.
 * @evidence contracts/common.md#clear-and-simple-design Schema, inventory, baseline and fingerprint guards share one refusal class.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No malformed plan is repaired or treated as an empty import by this constructor.
 * @evidence contracts/common.md#meaningful-documentation Documents stable machine identity and caller-owned explanation.
 * @evidence contracts/performance.md#efficient-algorithms Message formatting and native stack allocation dominate fixed-argument construction.
 * @evidence contracts/performance.md#reuse-equivalent-work Each refusal creates its own current explanation and stack.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The catching caller owns the error; no plan, byte array or handle is retained.
 */
export class AutoMovieLegacyImportPlanError extends Error {

    /**
     * Stable machine-readable diagnostic code.
     */
    public readonly code: ReturnType<() => "automovie-legacy-import-plan-invalid"> = "automovie-legacy-import-plan-invalid" as const;

    /**
     * Format the admission-supplied detail in a native Error and set the stable class name; this constructor does not inspect a plan or acquire a resource.
     */
    public constructor(detail: string) {
        super(`Invalid AutoMovie legacy import plan: ${detail}`);
        this.name = "AutoMovieLegacyImportPlanError";
    }
}

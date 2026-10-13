/**
 * Effects owned by one Human build. The build owns a compiled stage and a
 * previous-output backup awaiting publication. Failed rollback retains that
 * backup; stage disposal must never remove it.
 *
 * @author Samchon
 */
export interface IHumanBuildHost {
    /** Create an exclusive output stage inside the owning package. */
    createStage(): string;
    /** Run the ordinary compiler and lint, selecting the browser override only in that pass. */
    compile(stage: string, pass: "node" | "browser"): Promise<void>;
    /** Whether the owning package already has runtime output to preserve. */
    hasPrevious(): boolean;
    /** Copy complete previous output into the backup owned by this stage before replacement. */
    backup(stage: string): void;
    /** Publish both completed compiler passes as the package's runtime output. */
    install(stage: string): void;
    /** Restore previous files, or empty membership when no prior output existed. */
    restore(stage: string): void;
    /** Remove the backup only after successful publication or complete restoration. */
    removeBackup(stage: string): void;
    /** Dispose this build's stage, retaining recovery files and the lock when restoration or backup disposal remains unresolved. */
    discardStage(stage: string): void;
}

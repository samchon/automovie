import type { AutoMovieProjectRevisionAdvance } from "./AutoMovieProjectRevisionAdvance";
import { acquireCommitLock, releaseCommitLock } from "./commitLock";
import { advanceAutoMovieProjectRevision } from "./projectRevision";
import type { IAutoMovieProjectManifest } from "./IAutoMovieProjectManifest";
import { autoMovieProjectWriteJsonAtomic } from "./autoMovieProjectWriteJsonAtomic";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 * Run one synchronous mutation under the root namespace and commit lock when the resident revision matches this handle's last read revision. A stale clock refreshes the handle's manifest/clock before refusal; invalid or exhausted clocks refuse before flush. Successful flush precedes revision publication, so later failures can leave changed leaves without a new handle clock, and token retirement is attempted in finally.
 *
 * @evidence contracts/common.md#principled-implementation Root/revision locks compare the last read clock, refresh stale state on refusal, then flush before safe-successor publication.
 * @evidence contracts/common.md#clear-and-simple-design Owns optimistic concurrency around the supplied synchronous mutation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stale/exhausted checks precede flush; later failures can leave mutations without a refreshed instance clock.
 * @evidence contracts/common.md#meaningful-documentation States stale-state refresh, successor timing and token-release fallback without batch atomicity.
 * @evidence contracts/performance.md#efficient-algorithms Includes revision/manifest reads, lock admission and full callback work; byte/file costs have no local cap.
 * @evidence contracts/performance.md#reuse-equivalent-work One current clock selects its successor; prior mutation results cannot replace resident witnesses.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Finally attempts token retirement, using unlink=false after namespace failure; native cleanup can retain locks/backups and outer namespace retirement is separately attempted.
 */
export function autoMovieProjectCommitCycle(_project: IAutoMovieProjectState, flush: (assertNamespace: () => void) => void): void {
    _project.withRootNamespace((assertNamespace: () => void): void => {
        const token: string = acquireCommitLock(_project.lockPath);
        try {
            assertNamespace();
            const current: number = _project.readRevision();
            if (current !== _project.lastReadRevision_) {
                const base: number = _project.lastReadRevision_;
                const manifest: IAutoMovieProjectManifest = _project.readManifest();
                _project.lastReadRevision_ = current;
                _project.manifest = manifest;
                throw new Error(`another session committed to this project (on-disk revision ${current}; this session last synchronized at ${base}); nothing was written, re-read the current state (getSlate / nextSteps) and re-issue the call from that truth`);
            }
            const advance: AutoMovieProjectRevisionAdvance = advanceAutoMovieProjectRevision(current);
            if (advance.state !== "next")
                throw new Error("the project revision is exhausted; no project bytes were written because this store cannot publish another safe-integer revision");
            const nextRevision: number = advance.revision;
            assertNamespace();
            flush(assertNamespace);
            assertNamespace();
            autoMovieProjectWriteJsonAtomic(_project.revisionPath, {
                revision: nextRevision,
            }, assertNamespace);
            assertNamespace();
            _project.lastReadRevision_ = nextRevision;
        }
        finally {
            try {
                assertNamespace();
                releaseCommitLock(_project.lockPath, token);
            }
            catch {
                releaseCommitLock(_project.lockPath, token, { unlink: false });
            }
        }
    });
}

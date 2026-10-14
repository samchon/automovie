import type { Stats } from "node:fs";
import { IAutoMovieLegacyImportApplyOutput, IAutoMovieLegacyImportPlan, IAutoMovieLegacyImportRollbackOutput } from "@automovie/interface";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { acquireCommitLock, releaseCommitLock } from "../project/commitLock";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { IAutoMovieProductionRootNamespaceLease, acquireProductionRootNamespace, assertProductionRootNamespaceLease, releaseProductionRootNamespace } from "./rootNamespaceLock";
import { legacyImporterImportPlanPath } from "./legacyImporterImportPlanPath";
import { legacyImporterProductionStateDirectories } from "./legacyImporterProductionStateDirectories";
import type { legacyImporterAppliedImportState } from "./legacyImporterAppliedImportState";
import type { legacyImporterLegacyImportCleanupFailure } from "./legacyImporterLegacyImportCleanupFailure";
import { legacyImporterRemoveLegacyImportTemporary } from "./legacyImporterRemoveLegacyImportTemporary";
import { legacyImporterReleaseResidentLockIfCurrent } from "./legacyImporterReleaseResidentLockIfCurrent";
import { legacyImporterPlanFromSnapshot } from "./legacyImporterPlanFromSnapshot";
import { legacyImporterValidateLegacyRoot } from "./legacyImporterValidateLegacyRoot";
import { legacyImporterReadLegacySnapshot } from "./legacyImporterReadLegacySnapshot";
import { legacyImporterAppliedImportFiles } from "./legacyImporterAppliedImportFiles";
import { legacyImporterVerifyAppliedImport } from "./legacyImporterVerifyAppliedImport";
import { legacyImporterAssertRollbackBaseline } from "./legacyImporterAssertRollbackBaseline";
import { legacyImporterRestoreAppliedImport } from "./legacyImporterRestoreAppliedImport";
import { legacyImporterReadAppliedImportState } from "./legacyImporterReadAppliedImportState";
import { legacyImporterChangedImportError } from "./legacyImporterChangedImportError";
import { legacyImporterReadJson } from "./legacyImporterReadJson";
import { legacyImporterLstatOrNull } from "./legacyImporterLstatOrNull";

/**
 * Bridge a resident v1 project to an added v2 production-state directory without rewriting legacy bytes. Planning validates a captured temporary copy; apply publishes drafts and provenance by staged rename, and rollback refuses changed import state or changed owned-directory baselines. This class currently has no maintained constructor caller beyond its public package export.
 *
 * @evidence contracts/common.md#principled-implementation Root namespace and resident revision locks surround finite identity/revision checks, temporary-copy validation and staged publication; rollback compares exact imported bytes and recorded legacy-owned baselines before removal.
 * @evidence contracts/common.md#clear-and-simple-design The class owns plan/apply/rollback scope and their failure ordering; inventory, plan construction, exact-state verification and restoration helpers keep byte interpretation separate from publication authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing project bytes are captured rather than rewritten by legacy initialization, and changed production work blocks rollback; draft raster/art defaults are explicit reconstruction warnings, not recovered authored facts.
 * @evidence contracts/common.md#meaningful-documentation States destructive boundaries, temporary-copy planning, draft limitations, exact rollback prerequisites and current lack of a maintained constructor consumer; successful source checks alone do not prove filesystem transactions.
 * @evidence contracts/performance.md#efficient-algorithms Work follows captured file count and bytes, directory depth, registered assets and shots; cloning, full baseline comparison and exact-state scans retain population-sized data, with asset-membership scans charged by inventory construction.
 * @evidence contracts/performance.md#reuse-equivalent-work An existing applied import is returned unchanged only after exact provenance/state verification and recomputing the current legacy plan fingerprint; prior rollback baselines are reused so later empty owned directories do not change import identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each operation owns namespace/revision lock levels and temporary or staging directories, attempting release in its established finally/catch order; root replacement can intentionally leave staging rather than cleaning a replacement namespace, and failed native cleanup remains unresolved.
 */
export class AutoMovieLegacyImporter {
  /** Retain the requested root spelling; filesystem admission and leases begin only when an operation is called. */
  public constructor(private readonly rootDirectory: string) {}

  /**
   * Inspect and validate a legacy project without mutating its directory.
   *
   * @evidence contracts/common.md#principled-implementation A root namespace lease surrounds revision/lock-consistent byte capture and temporary-copy v1 validation, followed by a lease recheck before returning the draft plan.
   * @evidence contracts/common.md#clear-and-simple-design The method owns only the public planning scope; snapshot capture, temporary store validation and draft composition each have their own helper boundary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Resident v1 open is never run on the user's tree, and any active resident revision lock refuses planning rather than adopting its foreign token.
   * @evidence contracts/common.md#meaningful-documentation States nonmutation of resident bytes; returned drafts contain explicit reconstruction defaults and do not establish reviewed production source.
   * @evidence contracts/performance.md#efficient-algorithms Full F-file/B-byte snapshot and baseline capture plus a temporary B-byte clone precede legacy validation and S-shot plan construction; this invocation has no byte or file-count cap.
   * @evidence contracts/performance.md#reuse-equivalent-work Captured bytes feed one temporary validation store and one plan composition, while new plan calls reread source authority rather than reuse an unvalidated prior fingerprint.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary clone cleanup is attempted before return and namespace levels release in finally; the returned plan retains inventory/draft values while failed cleanup can retain temporary bytes and throw.
   */
  public plan(): IAutoMovieLegacyImportPlan {
    const root: string = legacyImporterValidateLegacyRoot(this.rootDirectory);
    const lease: IAutoMovieProductionRootNamespaceLease = acquireProductionRootNamespace(root);
    try {
      assertProductionRootNamespaceLease(lease);
      const output: IAutoMovieLegacyImportPlan = legacyImporterPlanFromSnapshot(legacyImporterReadLegacySnapshot(lease.root));
      assertProductionRootNamespaceLease(lease);
      return output;
    } finally {
      releaseProductionRootNamespace(lease);
    }
  }

  /**
   * Publish one import plan and v2 provenance through a staged state-root rename.
   *
   * @evidence contracts/common.md#principled-implementation Root and resident revision token scopes precede exact prior-state admission or snapshot-derived staging; publication uses rename and root identity is reasserted around writes.
   * @evidence contracts/common.md#clear-and-simple-design The public method owns namespace and revision-lock lifetime while applyLocked owns existing-state admission and one staged state-root publication.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing production state is never overwritten; unchanged requires both exact persisted import state and a recomputed current legacy plan fingerprint, not a quiet revision alone.
   * @evidence contracts/common.md#meaningful-documentation The persisted plan is immutable under this protocol, while the returned ordinary object is caller-owned; staged rename and finite identity checks do not create a kernel-level multi-file transaction.
   * @evidence contracts/performance.md#efficient-algorithms Existing imports require full state verification and current legacy capture; new imports materialize plan/provenance files and directory population, with work and peak buffers following bytes, entries and shot drafts.
   * @evidence contracts/performance.md#reuse-equivalent-work Exact prior plan/baseline values are reused only after state and recomputed fingerprint admission; mismatched or incomplete state refuses instead of rebuilding over it.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Resident revision levels retire before the root lease in nested finally scopes; staging is removed when the root witness remains valid, and replaced-root or native cleanup failure can leave unclaimed physical staging.
   */
  public apply(): IAutoMovieLegacyImportApplyOutput {
    const root: string = legacyImporterValidateLegacyRoot(this.rootDirectory);
    const lease: IAutoMovieProductionRootNamespaceLease = acquireProductionRootNamespace(root);
    try {
      assertProductionRootNamespaceLease(lease);
      const lockPath: string = path.join(lease.root, "revision.lock");
      const token: string = acquireCommitLock(lockPath);
      try {
        assertProductionRootNamespaceLease(lease);
        const output: IAutoMovieLegacyImportApplyOutput = this.applyLocked(lease, token);
        assertProductionRootNamespaceLease(lease);
        return output;
      } finally {
        legacyImporterReleaseResidentLockIfCurrent(lease, lockPath, token);
      }
    } finally {
      releaseProductionRootNamespace(lease);
    }
  }

  private applyLocked(
    lease: IAutoMovieProductionRootNamespaceLease,
    lockToken: string,
  ): IAutoMovieLegacyImportApplyOutput {
    const root: string = lease.root;
    const stateRoot: string = path.join(root, "automovie");
    const existing: Stats | null = legacyImporterLstatOrNull(stateRoot);
    if (existing !== null) {
      if (existing.isSymbolicLink() || existing.isDirectory() === false)
        throw new Error(
          `Production state root "${stateRoot}" is not a physical directory. Remove the collision before applying the legacy import.`,
        );
      const prior: IAutoMovieLegacyImportPlan | null = legacyImporterReadJson<IAutoMovieLegacyImportPlan>(
        stateRoot,
        legacyImporterImportPlanPath,
      );
      if (prior !== null && legacyImporterVerifyAppliedImport(stateRoot, root, prior)) {
        const snapshot: ReturnType<typeof legacyImporterReadLegacySnapshot> = legacyImporterReadLegacySnapshot(root, lockToken);
        snapshot.rollbackBaseline = prior.rollbackBaseline;
        if (legacyImporterPlanFromSnapshot(snapshot).fingerprint === prior.fingerprint)
          return { status: "unchanged", plan: prior };
      }
      throw new Error(
        `Production state root "${stateRoot}" already exists with a different or incomplete import. Preserve it and choose a clean legacy project root.`,
      );
    }
    const plan: IAutoMovieLegacyImportPlan = legacyImporterPlanFromSnapshot(legacyImporterReadLegacySnapshot(root, lockToken));
    const state: legacyImporterAppliedImportState = {
      version: 1,
      fingerprint: plan.fingerprint,
      incarnation: randomUUID(),
    };
    const files: ReadonlyMap<string, Uint8Array<ArrayBufferLike>> = legacyImporterAppliedImportFiles(root, plan, state);
    assertProductionRootNamespaceLease(lease);
    const staging: string = fileSystem.mkdtempSync(
      path.join(root, ".automovie-import-"),
    );
    let stagingFailure: legacyImporterLegacyImportCleanupFailure | undefined;
    try {
      for (const directory of legacyImporterProductionStateDirectories)
        fileSystem.mkdirSync(path.join(staging, directory), {
          recursive: true,
        });
      for (const [relative, bytes] of files) {
        const file: string = path.join(staging, ...relative.split("/"));
        fileSystem.mkdirSync(path.dirname(file), { recursive: true });
        fileSystem.writeFileSync(file, bytes);
      }
      assertProductionRootNamespaceLease(lease);
      fileSystem.renameSync(staging, stateRoot);
      assertProductionRootNamespaceLease(lease);
    } catch (error) {
      stagingFailure = { error };
      throw error;
    } finally {
      let leaseCurrent: boolean = true;
      try {
        assertProductionRootNamespaceLease(lease);
      } catch {
        leaseCurrent = false;
      }
      // A replaced root must not receive cleanup intended for the lease root.
      if (leaseCurrent && fileSystem.existsSync(staging))
        legacyImporterRemoveLegacyImportTemporary(
          staging,
          stagingFailure,
          "import publication staging directory",
        );
    }
    return { status: "applied", plan };
  }

  /**
   * Remove one still-untouched applied import, preserving all legacy bytes.
   *
   * @evidence contracts/common.md#principled-implementation Exact import plan/state/token bytes and pre-import owned-directory baselines are checked before quarantine rename; subsequent failure attempts restoration without rebinding a changed root identity.
   * @evidence contracts/common.md#clear-and-simple-design The public method owns root reservation and rollbackLocked owns its state-root revision lock, quarantine, directory removal and restoration order.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts New or changed production work blocks deletion, and root replacement forbids restoration into the successor namespace; failed restoration causes are retained rather than declared successful rollback.
   * @evidence contracts/common.md#meaningful-documentation States untouched-import prerequisite, legacy-byte preservation, failure restoration and that physical cleanup failure remains visible.
   * @evidence contracts/performance.md#efficient-algorithms Full imported-state and F-entry/B-byte baseline comparisons precede removal; restoration can rewrite the complete import state, with cost proportional to inventories, encoded plan bytes and affected directories.
   * @evidence contracts/performance.md#reuse-equivalent-work The exact admitted plan and incarnation state feed restoration; live baseline and state bytes are reread because an earlier fingerprint cannot authorize destructive rollback.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Successful namespace removal explicitly retires matching resident lock depth without following its deleted path; failure attempts state/directory restoration and resident release, while quarantine or restore staging can remain on native failure.
   */
  public rollback(): IAutoMovieLegacyImportRollbackOutput {
    const root: string = legacyImporterValidateLegacyRoot(this.rootDirectory);
    const lease: IAutoMovieProductionRootNamespaceLease = acquireProductionRootNamespace(root);
    try {
      assertProductionRootNamespaceLease(lease);
      const stateRoot: string = path.join(lease.root, "automovie");
      const linked: Stats | null = legacyImporterLstatOrNull(stateRoot);
      if (
        linked === null ||
        linked.isSymbolicLink() ||
        linked.isDirectory() === false
      )
        throw new Error(
          `No physical applied legacy import exists at "${stateRoot}". Nothing was rolled back.`,
        );
      const lockPath: string = path.join(stateRoot, "revision.lock");
      const token: string = acquireCommitLock(lockPath);
      const output: IAutoMovieLegacyImportRollbackOutput = this.rollbackLocked(lease, stateRoot, lockPath, token);
      assertProductionRootNamespaceLease(lease);
      return output;
    } finally {
      releaseProductionRootNamespace(lease);
    }
  }

  private rollbackLocked(
    lease: IAutoMovieProductionRootNamespaceLease,
    stateRoot: string,
    lockPath: string,
    token: string,
  ): IAutoMovieLegacyImportRollbackOutput {
    const root: string = lease.root;
    try {
      assertProductionRootNamespaceLease(lease);
      const plan: IAutoMovieLegacyImportPlan | null = legacyImporterReadJson<IAutoMovieLegacyImportPlan>(
        stateRoot,
        legacyImporterImportPlanPath,
      );
      const appliedState: legacyImporterAppliedImportState | null = legacyImporterReadAppliedImportState(stateRoot, plan);
      if (
        plan === null ||
        appliedState === null ||
        legacyImporterVerifyAppliedImport(stateRoot, root, plan, appliedState, {
          path: "revision.lock",
          bytes: Buffer.from(token, "utf8"),
        }) === false
      )
        throw legacyImporterChangedImportError(stateRoot, legacyImporterImportPlanPath);
      legacyImporterAssertRollbackBaseline(root, plan.rollbackBaseline);
      const quarantine: string = path.join(
        root,
        `.automovie-rollback-${process.pid}-${Date.now()}`,
      );
      const removed: string[] = [];
      assertProductionRootNamespaceLease(lease);
      fileSystem.renameSync(stateRoot, quarantine);
      assertProductionRootNamespaceLease(lease);
      try {
        for (const baseline of plan.rollbackBaseline)
          if (baseline.existed === false) {
            const directory: string = path.join(root, baseline.path);
            if (fileSystem.existsSync(directory)) {
              assertProductionRootNamespaceLease(lease);
              fileSystem.rmdirSync(directory);
              assertProductionRootNamespaceLease(lease);
              removed.push(directory);
            }
          }
        assertProductionRootNamespaceLease(lease);
        fileSystem.rmSync(quarantine, { recursive: true });
        assertProductionRootNamespaceLease(lease);
      } catch (error) {
        try {
          assertProductionRootNamespaceLease(lease);
        } catch (identityError) {
          throw new AggregateError(
            [error, identityError],
            `Legacy import rollback stopped because project root "${root}" changed physical identity. No restoration was attempted in the replacement root.`,
          );
        }
        const restorationErrors: unknown[] = [];
        if (fileSystem.existsSync(stateRoot) === false) {
          try {
            if (
              fileSystem.existsSync(quarantine) &&
              legacyImporterVerifyAppliedImport(quarantine, root, plan, appliedState, {
                path: "revision.lock",
                bytes: Buffer.from(token, "utf8"),
              })
            )
              fileSystem.renameSync(quarantine, stateRoot);
            else {
              legacyImporterRestoreAppliedImport(stateRoot, root, plan, appliedState, token);
              try {
                fileSystem.rmSync(quarantine, { force: true, recursive: true });
              } catch {
                // The authoritative applied state is restored at `automovie`.
              }
            }
          } catch (restorationError) {
            restorationErrors.push(restorationError);
          }
        }
        for (const directory of removed)
          try {
            fileSystem.mkdirSync(directory);
          } catch (restorationError) {
            restorationErrors.push(restorationError);
          }
        if (restorationErrors.length !== 0)
          throw new AggregateError(
            [error, ...restorationErrors],
            `Legacy import rollback failed and restoration was incomplete. Preserve "${quarantine}" and repair the reported paths before retrying.`,
          );
        if (fileSystem.existsSync(stateRoot) === false)
          throw new Error(
            `Legacy import rollback failed and the applied state remains preserved at "${quarantine}": ${String(error)}`,
            { cause: error },
          );
        throw new Error(
          `Legacy import rollback could not complete and the applied state was restored: ${String(error)}`,
          { cause: error },
        );
      }
      // The successful rollback removed the resident lock with the quarantined
      // state root. Retire every matching process-local nesting level so an
      // outer holder cannot re-enter a lock whose physical namespace vanished.
      // Never follow the removed path into a concurrently recreated root.
      releaseCommitLock(lockPath, token, { retire: true });
      return { status: "rolled-back", fingerprint: plan.fingerprint };
    } catch (error) {
      legacyImporterReleaseResidentLockIfCurrent(lease, lockPath, token);
      throw error;
    }
  }
}

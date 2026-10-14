import type { IAutoMovieProductionProjectProductionRegistry } from "./IAutoMovieProductionProjectProductionRegistry";
import type { Dirent, Stats } from "node:fs";
import { readAutoMovieProductionProjectJson as readOwnedJson } from "./readAutoMovieProductionProjectJson";
import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import type { IAutoMovieProductionProjectDirectoryAncestry as IPhysicalDirectoryAncestry } from "./IAutoMovieProductionProjectDirectoryAncestry";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import { planAutoMovieProductionLayoutMigration } from "./planAutoMovieProductionLayoutMigration";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectValidateProductionRegistry } from "./productionProjectValidateProductionRegistry";
import { productionProjectSerializeJson } from "./productionProjectSerializeJson";
import { productionProjectWriteAtomic } from "./productionProjectWriteAtomic";
import { productionProjectAcquirePhysicalDirectoryAncestry } from "./productionProjectAcquirePhysicalDirectoryAncestry";
import { productionProjectAssertPhysicalDirectoryAncestry } from "./productionProjectAssertPhysicalDirectoryAncestry";
import { productionProjectFileIdentityKey } from "./productionProjectFileIdentityKey";
import { productionProjectAssertPhysicalDirectoryAncestors } from "./productionProjectAssertPhysicalDirectoryAncestors";
import { productionProjectMkdirOwned } from "./productionProjectMkdirOwned";
import { productionProjectAdoptProductionLayoutVersion } from "./productionProjectAdoptProductionLayoutVersion";
import { productionProjectResolveOwnedDirectory } from "./productionProjectResolveOwnedDirectory";
import { productionProjectAssertProjectRootIdentity } from "./productionProjectAssertProjectRootIdentity";
import { productionProjectAssertStateRootIdentity } from "./productionProjectAssertStateRootIdentity";

/**
 * Move resident legacy records into shared and production namespaces before adopting layout version one.
 *
 * @evidence contracts/common.md#principled-implementation The planner selects resident candidates; fresh physical ancestry/entry identity checks fence staging, publication and rollback. Registry publication marks committed data and prevents later rollback.
 * @evidence contracts/common.md#clear-and-simple-design Ordered staged/published lists expose migration phases; an empty plan only adopts the layout version.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing planned entries may be skipped, links and occupied destinations refuse, and replaced namespaces are not blindly restored; metadata checks do not eliminate external races.
 * @evidence contracts/common.md#meaningful-documentation Precommit errors attempt guarded reverse restoration; postcommit errors report committed state, and best-effort temporary-directory cleanup suppresses its own failures.
 * @evidence contracts/performance.md#efficient-algorithms Includes output enumeration/sorting, O(M) move metadata and repeated ancestry/stat checks, registry serialization and possible reverse rollback; published.includes in recovery can add O(M squared) comparisons.
 * @evidence contracts/performance.md#reuse-equivalent-work Captured entry/ancestor identities are comparison bases, not proof of later residency; each fence reacquires observations and moves are never cached across opens.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary namespace and move records belong to the attempt; only a verified empty temporary is removed, so failed or replaced namespaces can retain recovery data.
 */
export function productionProjectMigrateLegacyProductionLayout(_project: AutoMovieProductionProjectState): void {
    const moves: { source: string; destination: string; }[] = planAutoMovieProductionLayoutMigration({
        automovieRoot: _project.automovieRoot,
        sharedDesignRoot: _project.sharedDesignRoot,
        productionDesignRoot: _project.productionDesignRoot,
        productionStateRoot: _project.productionStateRoot,
        productionSegment: _project.productionSegment,
        outputRoots: [
            {
                directory: "generated",
                root: productionProjectResolveOwnedDirectory(_project, _project.manifest_.generatedRoot),
            },
            {
                directory: "renders",
                root: productionProjectResolveOwnedDirectory(_project, _project.manifest_.renderRoot),
            },
        ],
        // A project that produced nothing has no output root to namespace.
        // Permit that missing root while still rejecting every existing
        // linked/non-directory ancestor before the root itself is read, and
        // report a non-directory as absent so the ownership layout refuses it by
        // name instead of this plan inventing a move for it.
        outputState: (root: string): { kind: "absent"; entries?: undefined; } | { kind: "linked"; entries?: undefined; } | { kind: "entries"; entries: { name: string; isFile: boolean; }[]; } => {
            productionProjectAssertPhysicalDirectoryAncestors(_project.rootReal, path.dirname(root), true);
            const state: Stats | null = lstatOrNull(root);
            if (state === null)
                return { kind: "absent" };
            if (state.isSymbolicLink())
                return { kind: "linked" };
            if (state.isDirectory() === false)
                return { kind: "absent" };
            return {
                kind: "entries",
                entries: fileSystem
                    .readdirSync(root, { withFileTypes: true })
                    .map((entry: Dirent<string>): { name: string; isFile: boolean; } => ({ name: entry.name, isFile: entry.isFile() })),
            };
        },
        resident: (source: string): boolean => {
            productionProjectAssertPhysicalDirectoryAncestors(_project.rootReal, path.dirname(source), true);
            return lstatOrNull(source) !== null;
        },
    });
    if (moves.length === 0) {
        productionProjectAdoptProductionLayoutVersion(_project);
        return;
    }
    const temporary: string = path.join(_project.automovieRoot, `.layout-migration-${randomUUID()}`);
    productionProjectMkdirOwned(_project, temporary);
    const staged: Array<{
        source: string;
        destination: string;
        temporary: string;
        identity: string;
        destinationParent?: IPhysicalDirectoryAncestry;
    }> = [];
    const published: typeof staged = [];
    const temporaryAncestry: IPhysicalDirectoryAncestry = productionProjectAcquirePhysicalDirectoryAncestry(_project.rootReal, temporary);
    let registryPublished: boolean = false;
    const assertMigrationFence: () => void = (): void => {
        productionProjectAssertProjectRootIdentity(_project);
        productionProjectAssertStateRootIdentity(_project);
        productionProjectAssertPhysicalDirectoryAncestry(temporaryAncestry);
    };
    const assertResidentMove: (file: string, identity: string) => void = (file: string, identity: string): void => {
        productionProjectAssertPhysicalDirectoryAncestors(_project.rootReal, path.dirname(file), false);
        const linked: Stats | null = lstatOrNull(file);
        if (linked === null ||
            linked.isSymbolicLink() ||
            productionProjectFileIdentityKey(fileSystem.statSync(file, { bigint: true })) !==
                identity)
            throw new AutoMovieProductionInputRaceError(`Legacy migration entry "${file}" changed physical identity. No stale-path rollback may touch its replacement.`);
    };
    try {
        for (const [index, move] of moves.entries()) {
            assertMigrationFence();
            // The plan observed each of these entries a moment ago. Tolerate one
            // that has since left while still rejecting every existing
            // linked/non-directory ancestor before the source itself is inspected.
            productionProjectAssertPhysicalDirectoryAncestors(_project.rootReal, path.dirname(move.source), true);
            const state: Stats | null = lstatOrNull(move.source);
            if (state === null)
                continue;
            if (state.isSymbolicLink())
                throw new Error(`Legacy production path "${move.source}" is a symlink or junction. Replace it with project-owned files before migration.`);
            const identity: string = productionProjectFileIdentityKey(fileSystem.statSync(move.source, { bigint: true }));
            const stagedPath: string = path.join(temporary, String(index).padStart(2, "0"));
            fileSystem.renameSync(move.source, stagedPath);
            assertResidentMove(stagedPath, identity);
            staged.push({ ...move, temporary: stagedPath, identity });
        }
        for (const move of staged) {
            assertMigrationFence();
            assertResidentMove(move.temporary, move.identity);
            if (lstatOrNull(move.destination) !== null)
                throw new Error(`Legacy production path "${move.source}" conflicts with namespaced destination "${move.destination}". Keep one authoritative copy before reopening the project.`);
            productionProjectMkdirOwned(_project, path.dirname(move.destination));
            move.destinationParent = productionProjectAcquirePhysicalDirectoryAncestry(_project.rootReal, path.dirname(move.destination));
            fileSystem.renameSync(move.temporary, move.destination);
            productionProjectAssertPhysicalDirectoryAncestry(move.destinationParent);
            assertResidentMove(move.destination, move.identity);
            published.push(move);
        }
        assertMigrationFence();
        for (const move of published) {
            productionProjectAssertPhysicalDirectoryAncestry(move.destinationParent!);
            assertResidentMove(move.destination, move.identity);
        }
        const registry: IAutoMovieProductionProjectProductionRegistry = productionProjectValidateProductionRegistry(readOwnedJson(_project.rootReal, _project.registryPath), _project.registryPath);
        registry.layoutVersion = 1;
        productionProjectWriteAtomic(_project.registryPath, Buffer.from(productionProjectSerializeJson(registry), "utf8"), assertMigrationFence, (): void => {
            registryPublished = true;
        });
    }
    catch (error) {
        if (registryPublished)
            throw new AggregateError([error], "Legacy migration data and registry were committed. No rollback was attempted after the registry commit point.");
        try {
            assertMigrationFence();
            for (const move of published) {
                productionProjectAssertPhysicalDirectoryAncestry(move.destinationParent!);
                assertResidentMove(move.destination, move.identity);
            }
            for (const move of staged)
                if (published.includes(move) === false)
                    assertResidentMove(move.temporary, move.identity);
        }
        catch (identityError) {
            throw new AggregateError([error, identityError], "Legacy migration stopped after an owned namespace changed physical identity. No stale-path rollback was attempted.");
        }
        for (const move of [...published].reverse()) {
            productionProjectAssertPhysicalDirectoryAncestry(move.destinationParent!);
            assertResidentMove(move.destination, move.identity);
            if (lstatOrNull(move.temporary) === null)
                fileSystem.renameSync(move.destination, move.temporary);
            assertResidentMove(move.temporary, move.identity);
        }
        for (const move of [...staged].reverse()) {
            const existing: Stats | null = lstatOrNull(move.source);
            if (existing?.isDirectory() === true &&
                fileSystem.readdirSync(move.source).length === 0)
                fileSystem.rmdirSync(move.source);
            if (lstatOrNull(move.source) === null &&
                lstatOrNull(move.temporary) !== null) {
                productionProjectMkdirOwned(_project, path.dirname(move.source));
                assertResidentMove(move.temporary, move.identity);
                fileSystem.renameSync(move.temporary, move.source);
                assertResidentMove(move.source, move.identity);
            }
        }
        throw error;
    }
    finally {
        try {
            productionProjectAssertPhysicalDirectoryAncestry(temporaryAncestry);
            if (fileSystem.readdirSync(temporary).length === 0)
                fileSystem.rmdirSync(temporary);
        }
        catch {
            // A replacement temporary root is not ours to inspect or remove.
        }
    }
    productionProjectAssertProjectRootIdentity(_project);
}

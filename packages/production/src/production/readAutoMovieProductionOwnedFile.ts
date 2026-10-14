import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import type { IProductionOwnedDescriptorFailure } from "./IProductionOwnedDescriptorFailure";
import { closeProductionOwnedDescriptor } from "./closeProductionOwnedDescriptor";
import type { IProductionOwnedPathIdentity } from "./IProductionOwnedPathIdentity";
import { productionOwnedDirectoryIdentity } from "./productionOwnedDirectoryIdentity";
import { productionOwnedFileIdentity } from "./productionOwnedFileIdentity";
import { productionOwnedDescriptorIdentity } from "./productionOwnedDescriptorIdentity";

/** Read with the implementation's namespace/descriptor fences; optional true alone permits initial ENOENT absence. Native, identity and cleanup failures propagate. */
export function readAutoMovieProductionOwnedFile(props: {
    /** Physical production ownership root. */
    root: string;

    /** Physical directory that owns the relative file. */
    directory: string;

    /** Strict descendant path below `directory`. */
    relative: string;

    /** Return `null` only when the first target observation is absent. */
    optional: true;
}): Uint8Array | null;
/** Read with the implementation's namespace/descriptor fences; optional true alone permits initial ENOENT absence. Native, identity and cleanup failures propagate. */
export function readAutoMovieProductionOwnedFile(props: {
    /** Physical production ownership root. */
    root: string;

    /** Physical directory that owns the relative file. */
    directory: string;

    /** Strict descendant path below `directory`. */
    relative: string;
}): Uint8Array;
/**
 * Read one initially regular owned leaf with pre/post directory and descriptor identity observations.
 *
 * @evidence contracts/common.md#principled-implementation Native lexical descendant admission precedes directory dev/ino capture, initial regular-leaf observation, primary open/fstat, recheck descriptors around full byte read and finally close. The caller supplies an admitted physical root and Node-compatible filesystem capability.
 * @evidence contracts/common.md#clear-and-simple-design One overloaded reader serves project/incarnation/registry/generated/import/inspection storage; optional true alone permits initial ENOENT absence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Links/nonfiles and observed identity changes refuse; dev/ino endpoint agreement does not prove absence of ABA replacement or in-place content mutation. Optional-error classification assumes a native Error-like code value and does not totalize null thrown adapters.
 * @evidence contracts/common.md#meaningful-documentation Documents required bytes versus optional initial absence, pre/post fences, propagated native/refusal and aggregated cleanup failure, without atomic namespace/content claims.
 * @evidence contracts/performance.md#efficient-algorithms At depth D includes ancestor stats/path work, B-byte read and repeated leaf/descriptor observations; complete bytes and D identities coexist. It does not hash or parse returned payloads.
 * @evidence contracts/performance.md#reuse-equivalent-work Captured directory/leaf/descriptor identities serve repeated endpoint comparisons in this call, while resident metadata is reread and no prior pathname success is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Every acquired primary/recheck descriptor reaches close handling on success/failure; close failure may leave host resources unreleased and is propagated with earlier causes. Complete bytes transfer to the caller without a byte cap.
 */
export function readAutoMovieProductionOwnedFile(props: {
    /** Admitted physical ownership root resolved with native path semantics. */
    root: string;

    /** Owned descendant directory resolved before namespace observations. */
    directory: string;

    /** File address required to resolve strictly below the owned directory. */
    relative: string;

    /** True permits only initial ENOENT absence; later failures propagate. */
    optional?: boolean;
}): Uint8Array | null {
    const root: string = path.resolve(props.root);
    const directory: string = path.resolve(props.directory);
    const target: string = path.resolve(directory, props.relative);
    if (`${directory}${path.sep}`.startsWith(`${root}${path.sep}`) === false ||
        target.startsWith(`${directory}${path.sep}`) === false)
        throw new Error(`Production-owned path "${props.relative}" escapes its owned directory.`);
    const relativeParent: string = path.relative(root, path.dirname(target));
    const components: string[] = relativeParent.length === 0 ? [] : relativeParent.split(path.sep);
    const directories: string[] = [root];
    for (const component of components)
        directories.push(path.join(directories.at(-1)!, component));
    const identities: IProductionOwnedPathIdentity[] = directories.map((file: string): {
        file: string;
        identity: string;
    } => ({
        file,
        identity: productionOwnedDirectoryIdentity(file),
    }));
    const assertResidentDirectories: () => void = (): void => {
        const changed: IProductionOwnedPathIdentity | undefined = identities.find((expected: IProductionOwnedPathIdentity): boolean => expected.identity !== productionOwnedDirectoryIdentity(expected.file));
        if (changed !== undefined)
            throw new Error(`Production-owned path "${changed.file}" changed physical identity while it was read.`);
    };
    let linkedIdentity: string;
    try {
        linkedIdentity = productionOwnedFileIdentity(target);
    }
    catch (error) {
        if (props.optional === true &&
            (error as NodeJS.ErrnoException).code === "ENOENT") {
            assertResidentDirectories();
            return null;
        }
        throw error;
    }
    const descriptor: number = fileSystem.openSync(target, "r");
    let failure: IProductionOwnedDescriptorFailure | undefined;
    try {
        const openedIdentity: string = productionOwnedDescriptorIdentity(target, descriptor);
        const assertResidentFile: () => void = (): void => {
            assertResidentDirectories();
            if (productionOwnedFileIdentity(target) !== linkedIdentity)
                throw new Error(`Production-owned path "${target}" changed physical identity while it was read.`);
            const residentDescriptor: number = fileSystem.openSync(target, "r");
            let residentFailure: IProductionOwnedDescriptorFailure | undefined;
            try {
                if (productionOwnedDescriptorIdentity(target, residentDescriptor) !==
                    openedIdentity)
                    throw new Error(`Production-owned path "${target}" changed physical identity while it was read.`);
            }
            catch (error) {
                residentFailure = { error };
                throw error;
            }
            finally {
                closeProductionOwnedDescriptor(residentDescriptor, residentFailure, target);
            }
        };
        assertResidentFile();
        const bytes: NonSharedBuffer = fileSystem.readFileSync(descriptor);
        assertResidentFile();
        return bytes;
    }
    catch (error) {
        failure = { error };
        throw error;
    }
    finally {
        closeProductionOwnedDescriptor(descriptor, failure, target);
    }
}

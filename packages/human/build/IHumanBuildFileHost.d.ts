/**
 * File publication effects inside the owning package. Digests describe actual
 * complete file bytes; replacement publishes one staged file without moving
 * its watched parent directory. Names are relative to their inventory root.
 *
 * @author Samchon
 */
export interface IHumanBuildFileHost {
    /** Read the complete ordinary-file membership and digests of a root. */
    files(directory: string): readonly IHumanBuildFileHost.IEntry[];
    /** Copy a staged file to an exclusive sibling and rename it onto its target. */
    replace(source: string, output: string, file: string): void;
    /** Remove an obsolete output file while retaining watched directories. */
    remove(output: string, file: string): void;
}
export declare namespace IHumanBuildFileHost {
    /**
     * One ordinary file of an inventory root.
     *
     * @author Samchon
     */
    interface IEntry {
        /** Path relative to the inventory root. */
        file: string;
        /** Lowercase hexadecimal SHA-256 of the complete file bytes. */
        digest: string;
    }
}

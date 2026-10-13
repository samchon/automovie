/**
 * Effects for one exclusive staged-file replacement. Reservation transfers
 * cleanup ownership and returns the native handle release operation.
 *
 * @author Samchon
 */
export interface IHumanBuildFileReplacement {
    /** Reserve an exclusive sibling; failure transfers no cleanup ownership. */
    reserve(): () => void;
    /** Copy completed staged bytes into the reserved sibling. */
    copy(): void;
    /** Rename that sibling onto the output file without moving its directory. */
    publish(): void;
    /** Remove only this operation's reserved sibling if it still exists. */
    discard(): void;
}

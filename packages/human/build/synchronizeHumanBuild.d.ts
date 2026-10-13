import { IHumanBuildFileHost } from "./IHumanBuildFileHost";
/**
 * Synchronize complete file membership while keeping the output root stable.
 *
 * Equal bytes need no write. Completed replacements precede obsolete-file
 * removal; an effect failure propagates to the publication owner's rollback.
 * An undefined source restores an originally absent output to empty membership.
 */
export declare function synchronizeHumanBuild(host: IHumanBuildFileHost, source: string | undefined, output: string): void;

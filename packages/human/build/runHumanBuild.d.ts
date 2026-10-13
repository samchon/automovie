import { IHumanBuildHost } from "./IHumanBuildHost";
/**
 * Compile the ordinary Node and browser outputs in one owned stage before
 * publication.
 *
 * Failure in either pass leaves the current runtime untouched. Disposal errors
 * accompany the original failure rather than hiding it.
 */
export declare function runHumanBuild(host: IHumanBuildHost): Promise<void>;

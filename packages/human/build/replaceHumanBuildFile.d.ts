import { IHumanBuildFileReplacement } from "./IHumanBuildFileReplacement";
/**
 * Publish one completed staged file through an owned exclusive sibling.
 *
 * A failed reservation never grants permission to remove the colliding path.
 * After reservation, disposal runs on success and failure, preserving both
 * original and disposal errors when they occur together.
 */
export declare function replaceHumanBuildFile(host: IHumanBuildFileReplacement): void;

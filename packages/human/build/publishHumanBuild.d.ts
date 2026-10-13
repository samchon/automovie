import { IHumanBuildHost } from "./IHumanBuildHost";
/**
 * Replace runtime output only after both compiler passes have succeeded.
 *
 * A failed install restores previous file membership, including an originally
 * empty output. If restoration also fails, both errors and the retained backup
 * remain available to the owner. Watched directories keep their identities.
 */
export declare function publishHumanBuild(host: IHumanBuildHost, stage: string): void;

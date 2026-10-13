import type { IHumanBuildFileHost } from "./IHumanBuildFileHost";

/** Synchronize ordinary file bytes and membership without moving output directories. */
export function synchronizeHumanBuild(host: IHumanBuildFileHost, source: string | undefined, output: string): void;

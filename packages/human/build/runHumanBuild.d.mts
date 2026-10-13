import type { IHumanBuildHost } from './IHumanBuildHost';

/** Both normal compiler passes must succeed before this owner publishes their shared stage. */
export function runHumanBuild(host: IHumanBuildHost): Promise<void>;

import { type IAutoMovieNode, type IAutoMovieDriver } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { resolveDrivers } from "../../../../packages/engine/src/resolve/resolveDrivers";
import { createCopyDriver as copy } from "./createCopyDriver";
import { createDriverNode as node } from "./createDriverNode";
import { createDriverSamples as seed } from "./createDriverSamples";
import { indexDriverNodes as byId } from "./indexDriverNodes";
import { throwsError } from "./throwsError";

/** Run the existing reciprocal o/s rotation-copy case and require its dependency-cycle diagnostic. */
export function runResolveDriversCycleScenario(): void {
  const nodes: Map<string, IAutoMovieNode> = byId(node("o"), node("s"));
  const cyclic: IAutoMovieDriver[] = [
    copy({ owner: "o", source: "s", rotation: true }),
    copy({ owner: "s", source: "o", rotation: true }),
  ];
  TestValidator.predicate(
    "cyclic drivers throw their dependency diagnostic",
    throwsError(
      (): IAutoMovieDriver[] => resolveDrivers(cyclic, seed([]), nodes),
      "driver dependency cycle",
    ),
  );
}

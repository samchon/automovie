import type { IAutoMovieViolationCollector } from "@automovie/interface";

import { describeInvalidValue } from "../../../validation/describeInvalidValue";

/** Track occupied node ids across the categories of one staging call. */
export function prepareStageNodeClaim(
  out: IAutoMovieViolationCollector,
): (id: string, path: string) => void {
  const ids: Set<string> = new Set();
  return (id: string, path: string): void => {
    if (ids.has(id))
      out.push(
        "type",
        path,
        `id "${describeInvalidValue(id)}" must be unique in the scene`,
        id,
      );
    ids.add(id);
  };
}

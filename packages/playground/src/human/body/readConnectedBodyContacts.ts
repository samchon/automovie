import { type IAutoMovieModelCrossing, measureAutoMovieModelCrossings } from "@automovie/engine";

import type { IReadConnectedBodyContactsProps } from "./IReadConnectedBodyContactsProps";

/**
 * Read which segments of a bone-partitioned skin cross, one segment and one
 * segment pair at a time, handing the thread back every `sliceMs`.
 *
 * The result holds the same entries in the same order as one
 * `measureAutoMovieModelCrossings` call. Each segment is also read against
 * itself, because one continuous skin partitioned by bone can pass through
 * itself where a pairwise count cannot see it. A reading a later request
 * supersedes is abandoned at its next slice and answers null.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Reads the posed skin's self-crossings on demand without blocking later edits.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Slices the contact reading so the resident worker answers a newer request in between.
 * @author Samchon
 */
export async function readConnectedBodyContacts(
  props: IReadConnectedBodyContactsProps,
): Promise<IAutoMovieModelCrossing[] | null> {
  const parts = props.model.parts;
  const found: IAutoMovieModelCrossing[] = [];
  let since = Date.now();
  const pause = async (): Promise<boolean> => {
    if (Date.now() - since < props.sliceMs) return props.superseded();
    await props.yieldThread();
    since = Date.now();
    return props.superseded();
  };
  for (let first = 0; first < parts.length; first++) {
    found.push(...measureAutoMovieModelCrossings({ ...props.model, parts: [parts[first]] }, { withinParts: true }));
    if (await pause()) return null;
    for (let second = first + 1; second < parts.length; second++) {
      found.push(...measureAutoMovieModelCrossings({ ...props.model, parts: [parts[first], parts[second]] }));
      if (await pause()) return null;
    }
  }
  return found;
}

import {
  type IAutoMovieModelCrossing,
  measureAutoMovieModelCrossings,
} from "@automovie/engine";

import type { IReadConnectedBodyContactsProps } from "./IReadConnectedBodyContactsProps";

/**
 * Read a static skin's within-part and pairwise crossings in engine part order, yielding cooperatively between completed units. Each part's self query precedes its later-part pairs, matching the full engine call with withinParts enabled under current callers' static placement premise.
 *
 * SliceMs is checked after one engine query, so a single expensive part/pair can exceed the threshold. After yielding or a shorter unit, the request-version callback can discard partial results as null. Empty models finish immediately without a supersession check. A yielded read requires immutable model data; malformed geometry and host callback failures propagate without modifying it.
 *
 * Reports retain the engine's strict crossing/count semantics, not a contact response, healthy-model certificate or anatomical acceptance. Since the engine placement owner sees only the sliced model's parts, current unattached static skin is the equivalence premise; arbitrary attached-model placement is not promised equivalent to a full-model call.
 *
 * @evidence contracts/common.md#principled-implementation Ordered self and later-part engine queries preserve current static skin placement and crossing aggregation, while explicit host checkpoints stop superseded observations as null.
 * @evidence contracts/common.md#clear-and-simple-design The reader owns slice ordering and partial-result lifetime; engine geometry and caller scheduling/request identity remain with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected count substitutes geometry, and null supersession is distinct from an empty successful contact list; current static placement premises are stated rather than extended to arbitrary rigs.
 * @evidence contracts/common.md#meaningful-documentation The prose describes cooperative timing, empty-model behavior, immutable yielded input, engine refusal and geometry-only interpretation.
 * @evidence contracts/performance.md#efficient-algorithms P parts produce P self queries and P(P-1)/2 pair queries; delegated crossing costs follow source triangles and overlap. Slicing rebuilds placement and boxes for repeated participating parts rather than sharing a full-model prepared census, a remaining cost of the current synchronous engine seam.
 * @evidence contracts/performance.md#reuse-equivalent-work Found records accumulate once in part order, but engine preparation repeats across slices because its public query owns that preparation; no result is shared across mutable poses or effectful host yields.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The pending call retains the borrowed model and at most O(P²) crossing records; results transfer on completion or become collectible on supersession/refusal. Host yield tasks have callback-owned lifetime and the reader owns no timer or subscription.
 *
 * @author Samchon
 */
export async function readConnectedBodyContacts(
  props: IReadConnectedBodyContactsProps,
): Promise<IAutoMovieModelCrossing[] | null> {
  const parts: IReadConnectedBodyContactsProps["model"]["parts"] = props.model.parts;
  const found: IAutoMovieModelCrossing[] = [];
  let since: number = Date.now();
  const pause: () => Promise<boolean> = async (): Promise<boolean> => {
    if (Date.now() - since < props.sliceMs) return props.superseded();
    await props.yieldThread();
    since = Date.now();
    return props.superseded();
  };
  for (let first: number = 0; first < parts.length; first++) {
    found.push(
      ...measureAutoMovieModelCrossings(
        { ...props.model, parts: [parts[first]] },
        { withinParts: true },
      ),
    );
    if (await pause()) return null;
    for (let second: number = first + 1; second < parts.length; second++) {
      found.push(
        ...measureAutoMovieModelCrossings({
          ...props.model,
          parts: [parts[first], parts[second]],
        }),
      );
      if (await pause()) return null;
    }
  }
  return found;
}

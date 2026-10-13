import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * Retain one generated hairstyle for one evaluated face pose and one numerical layer document. A changed face can move scalp roots and contact, so the pose object's identity invalidates the result even when the hair fields are unchanged. A changed field can alter roots, curves, width or finish and invalidates it even when the face is still. The caller admits every hair document before this lookup; JSON is then a deterministic value key rather than a validator. Each returned copy owns its meshes and materials, because resident model assembly and downstream consumers may mutate them. The caller certifies a result only after the complete model passes its structural gate; until then a cache hit still takes that gate. This changes neither card generation nor the biological meaning of any field. The optional progress callback is forwarded on a miss only and is not a cache key. It reports completed production owners without model access; an observer exception propagates before a new cache entry is assigned.
 *
 * @evidence contracts/common.md#principled-implementation Pose identity plus admitted hair JSON selects a single generated result, and returned mutable geometry is cloned.
 * @evidence contracts/common.md#clear-and-simple-design Model validation marks an entry certified only after complete structural admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Caller admission remains required and pose identity assumes changed current coordinates get a different pose; observer exceptions prevent assigning a new entry.
 * @evidence contracts/common.md#meaningful-documentation Progress is forwarded on misses and is not part of the cache key; a hit's certification controls the caller's subsequent structural gate.
 * @evidence contracts/performance.md#efficient-algorithms Lookup includes document serialization and output cloning; misses additionally pay the builder's generation cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Only an identical pose identity and value-keyed hairstyle reuse generated output.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One latest entry is retained per cache closure, but returned certify callbacks can retain older entries while callers keep them.
 */
export function createHumanFaceHairResultCache<T>(
  build: (
    hair: IAutoMovieHumanFaceHair,
    positions: ReadonlyMap<string, readonly number[]>,
    progress?: (owner: string) => void,
  ) => T,
): (
  hair: IAutoMovieHumanFaceHair,
  positions: ReadonlyMap<string, readonly number[]>,
  pose: object,
  progress?: (owner: string) => void,
) => { value: T; certified: boolean; certify: () => void } {
  let last:
    | { pose: object; hair: string; result: T; certified: boolean }
    | undefined;
  return (hair: IAutoMovieHumanFaceHair, positions: ReadonlyMap<string, readonly number[]>, pose: object, progress: ((owner: string) => void) | undefined): { value: T; certified: boolean; certify: () => void; } => {
    const key: string = JSON.stringify(hair);
    if (last === undefined || last.pose !== pose || last.hair !== key)
      last = {
        pose,
        hair: key,
        result: build(hair, positions, progress),
        certified: false,
      };
    const entry: { pose: object; hair: string; result: T; certified: boolean; } = last;
    return {
      value: structuredClone(entry.result),
      certified: entry.certified,
      certify: (): void => {
        entry.certified = true;
      },
    };
  };
}

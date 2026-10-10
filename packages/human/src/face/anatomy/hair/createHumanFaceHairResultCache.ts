import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * Retain one generated hairstyle for one evaluated face pose and one numerical
 * layer document. A changed face can move scalp roots and contact, so the
 * pose object's identity invalidates the result even when the hair fields are
 * unchanged. A changed field can alter roots, curves, width or finish and
 * invalidates it even when the face is still. The caller admits every hair
 * document before this lookup; JSON is then a deterministic value key rather
 * than a validator. Each returned copy owns its meshes and materials, because
 * resident model assembly and downstream consumers may mutate them. The
 * caller certifies a result only after the complete model passes its
 * structural gate; until then a cache hit still takes that gate. This changes
 * neither card generation nor the biological meaning of any field.
 * The optional progress callback is forwarded on a miss only and is not a
 * cache key. It reports completed production owners without model access;
 * an observer exception propagates before a new cache entry is assigned.
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
  return (hair, positions, pose, progress) => {
    const key = JSON.stringify(hair);
    if (last === undefined || last.pose !== pose || last.hair !== key)
      last = {
        pose,
        hair: key,
        result: build(hair, positions, progress),
        certified: false,
      };
    const entry = last;
    return {
      value: structuredClone(entry.result),
      certified: entry.certified,
      certify: () => {
        entry.certified = true;
      },
    };
  };
}

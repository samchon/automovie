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
 *
 * @evidence contracts/common.md#principled-implementation The cache key is the
 *   pose object's identity together with the hair document's JSON. It relies on
 *   the caller giving a pose object whose identity changes whenever the
 *   evaluated face positions do, and on generation being a deterministic
 *   function of face and document, so an identical key can return the previous
 *   result. Each hit returns a structured clone, so a consumer that mutates a
 *   mesh cannot alter what a later hit returns.
 * @evidence contracts/common.md#clear-and-simple-design One retained entry and
 *   one key; the certification flag is set by the caller after its structural
 *   gate and is never inferred here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or fixture: any face and document that repeat their key
 *   repeat their result.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   the key, why pose identity is part of it, the ownership of copies and the
 *   certification handshake.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits
 *   no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The cache carries
 *   no value with a unit or frame; it stores and copies whatever the builder
 *   produced.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds
 *   no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries
 *   no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
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

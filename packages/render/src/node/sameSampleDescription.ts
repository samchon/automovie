import type { BoxKind } from "mp4box";

import type { sampleDescription } from "./sampleDescription";
import { serializeDescriptionBox } from "./serializeDescriptionBox";

/**
 * Whether two sample entries declare the same decoder configuration.
 *
 * The types must match and the child boxes must match in count, order and
 * serialized bytes. Parser object identity says nothing about configuration
 * across files, so distinct boxes are serialized and compared as bytes; the
 * same box object on both sides is equal without serialization, which is the
 * common case of two samples of one track sharing one sample entry. A splice
 * that joined clips with different configurations would not decode to the
 * frames the clips decode to.
 *
 * @evidence contracts/common.md#principled-implementation Byte equality of ISO serializations is equality of the declared configuration, and an object compared with itself serializes identically, so the identity short cut cannot change a result; box order is compared as written because a sample entry's children are an ordered list.
 * @evidence contracts/common.md#clear-and-simple-design The clip parser, the rendition plan, the visual-lane conform and both splice proofs ask this one question, so the identity short cut and the serialization rule live in one place.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No box type is skipped or normalized before comparison, so a differing colour or pixel-aspect box makes the configurations unequal.
 * @evidence contracts/common.md#meaningful-documentation The doc states what must match, when bytes are compared and when identity suffices, and why a splice needs this equality.
 * @evidence contracts/performance.md#efficient-algorithms For B child boxes the cost is B identity checks, plus two serializations and one native byte comparison for each box pair that is not one object, so comparing every sample of one track against its first sample costs one pointer check per box per sample.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A verdict depends on the boxes' current contents, and the identity short cut already avoids the repeated work callers would otherwise cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The serialized arrays are temporaries of one box pair and nothing is retained or opened.
 */
export const sameSampleDescription = (
  left: ReturnType<typeof sampleDescription>,
  right: ReturnType<typeof sampleDescription>,
): boolean =>
  left.type === right.type &&
  left.boxes.length === right.boxes.length &&
  left.boxes.every((box: BoxKind, index: number): boolean => {
    const other: BoxKind = right.boxes[index]!;
    return (
      box === other ||
      Buffer.compare(
        serializeDescriptionBox(box),
        serializeDescriptionBox(other),
      ) === 0
    );
  });

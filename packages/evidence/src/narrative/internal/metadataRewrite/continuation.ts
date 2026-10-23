import { between } from "./between";

/**
 * Tests one UTF-8 continuation byte without accepting absent bytes.
 *
 * @evidence contracts/common.md#principled-implementation UTF-8 continuation bytes occupy 0x80 through 0xbf; between also rejects truncation.
 * @evidence contracts/common.md#clear-and-simple-design A named predicate centralizes this encoding range.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed interval is a UTF-8 constraint.
 * @evidence contracts/common.md#meaningful-documentation The comment states absent-byte rejection.
 * @evidence contracts/performance.md#efficient-algorithms One range check takes constant time and auxiliary space.
 * @evidence contracts/performance.md#reuse-equivalent-work The stateless between predicate is shared without cached byte populations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function acquires no handle or retained state.
 */
export function continuation(byte: number | undefined): boolean {
  return between(byte, 0x80, 0xbf);
}

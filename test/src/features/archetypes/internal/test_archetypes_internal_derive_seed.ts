import { deriveArchetypeSeed } from "@automovie/archetypes/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * Part seeds take the high 52 bits of the UTF-8 FNV-1a stream.
 *
 * Scenarios:
 *
 * 1. From the standard FNV offset basis, applying XOR and multiplication to the
 *    bytes 37 ff 61 62 ff 63 ff gives 45ae699673213a4b before truncation.
 * 2. Moving the id separator with the same concatenated letters gives
 *    273ab186b59efa0d. An empty id sequence hashes the parent and terminator.
 */
export function test_archetypes_internal_derive_seed(): void {
  TestValidator.equals(
    "parent with two ids",
    deriveArchetypeSeed(7, "ab", "c"),
    0x45ae699673213,
  );
  TestValidator.equals(
    "different id partition",
    deriveArchetypeSeed(7, "a", "bc"),
    0x273ab186b59ef,
  );
  TestValidator.equals("parent alone", deriveArchetypeSeed(7), 0x07f1c907b4b44);
}

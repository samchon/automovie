import { ownArchetypeRecordKeys } from "@automovie/archetypes/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * An archetype's member and draw lists retain the enumeration order of its own
 * public record fields.
 *
 * Scenarios:
 *
 * 1. Integer names come first in ascending order. Other names remain in insertion
 *    order. Inherited, non-enumerable and symbol properties are excluded.
 * 2. A record with no own enumerable keys has an empty list.
 */
export function test_archetypes_internal_own_record_keys(): void {
  const hidden: unique symbol = Symbol("internal record data");
  const record: {
    second: number;
    "2": number;
    "1": number;
    first: number;
    [hidden]: number;
  } = {
    second: 2,
    "2": 2,
    "1": 1,
    first: 1,
    [hidden]: 0,
  };
  Object.defineProperty(record, "private", { value: 3 });
  Object.setPrototypeOf(record, { inherited: 4 });
  TestValidator.equals("enumeration order", ownArchetypeRecordKeys(record), [
    "1",
    "2",
    "second",
    "first",
  ]);
  TestValidator.equals("empty record", ownArchetypeRecordKeys({}), []);
}

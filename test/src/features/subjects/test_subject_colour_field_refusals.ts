import {
  type IPortraitColourField,
  createPortraitColourField,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Reference-space field admission is independent of anatomical anchor lookup.
 * Scenarios:
 * 1. Malformed centres/radii/gains/strengths and duplicate names refuse.
 * 2. The adjacent bounded field is admitted after every refusal.
 * 3. Opposite declaration orders evaluate identically; inputs remain owned.
 */
export const test_subject_colour_field_refusals = (): void => {
  const field: IPortraitColourField = {
    name: "mark",
    center: [0, 0, 0],
    radius: [1, 1, 1],
    gain: [0, 0.5, 1],
    strength: 1,
  };
  const changes: Partial<IPortraitColourField>[] = [
    { name: " " },
    { center: [NaN, 0, 0] },
    { center: [0, 0] as unknown as [number, number, number] },
    { radius: [0, 1, 1] },
    { radius: [-1, 1, 1] },
    { radius: [Infinity, 1, 1] },
    { gain: [-0.1, 0, 1] },
    { gain: [0, 0, 1.1] },
    { strength: NaN },
    { strength: -0.1 },
    { strength: 1.1 },
  ];
  for (const change of changes) {
    TestValidator.predicate(
      "invalid field",
      throwsError(() => createPortraitColourField([{ ...field, ...change }])),
    );
    TestValidator.equals(
      "valid adjacent field",
      createPortraitColourField([field])([0, 0, 0]),
      [0, 0.5, 1],
    );
  }
  TestValidator.predicate(
    "duplicate field",
    throwsError(() => createPortraitColourField([field, field]), "unique"),
  );
  const other = { ...field, name: "a" };
  TestValidator.equals(
    "stable product order",
    createPortraitColourField([field, other])([0, 0, 0]),
    createPortraitColourField([other, field])([0, 0, 0]),
  );
  const sample = createPortraitColourField([field]);
  field.center[0] = 9;
  TestValidator.equals("owned center", sample([0, 0, 0]), [0, 0.5, 1]);
};

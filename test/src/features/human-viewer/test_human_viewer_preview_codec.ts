import { TestValidator } from "@nestia/e2e";

import { decodeHumanViewerPreview } from "../../../scripts/human-viewer/decodeHumanViewerPreview";
import { encodeHumanViewerPreview } from "../../../scripts/human-viewer/encodeHumanViewerPreview";

/**
 * Numerical persistence keeps array kinds and excludes local-reference metadata.
 * Scenarios:
 * 1. Float positions, integer indices, null and ordinary arrays survive the codec.
 * 2. Extra reference bytes and paths cannot enter the projected payload.
 * 3. Wrong operations, missing models, corrupt tags and invalid arrays refuse.
 */
export function test_human_viewer_preview_codec(): void {
  const input = {
    operation: "preview",
    model: {
      positions: new Float32Array([0, 0.5, -1]),
      indices: new Uint32Array([0, 1, 0xffffffff]),
      ordinary: [1, 2],
      absent: null,
    },
    reference: { image: "private pixels", path: "private photograph path" },
  };
  const text = encodeHumanViewerPreview(input);
  TestValidator.predicate(
    "private metadata excluded",
    !text.includes("private") && !text.includes("reference"),
  );
  const restored = decodeHumanViewerPreview(text) as {
    model: typeof input.model;
  };
  TestValidator.predicate(
    "typed positions",
    restored.model.positions instanceof Float32Array,
  );
  TestValidator.predicate(
    "typed indices",
    restored.model.indices instanceof Uint32Array,
  );
  TestValidator.equals(
    "values",
    Array.from(restored.model.positions),
    [0, 0.5, -1],
  );
  TestValidator.equals(
    "indices",
    Array.from(restored.model.indices),
    [0, 1, 0xffffffff],
  );
  TestValidator.equals("ordinary", restored.model.ordinary, [1, 2]);
  for (const payload of [
    { operation: "export", model: {} },
    { operation: "preview" },
  ]) {
    let refused = false;
    try {
      encodeHumanViewerPreview(payload);
    } catch {
      refused = true;
    }
    TestValidator.predicate("wrong cache operation", refused);
  }
  for (const payload of [
    "null",
    "{}",
    '{"operation":"export","model":{}}',
    '{"operation":"preview","model":{"$array":"Other","values":[1]}}',
    '{"operation":"preview","model":{"$array":"Float32","values":null}}',
    '{"operation":"preview","model":{"$array":"Float32","values":["a"]}}',
    '{"operation":"preview","model":{"$array":"Uint32","values":[-1]}}',
    '{"operation":"preview","model":{"$array":"Uint32","values":[0.5]}}',
  ]) {
    let refused = false;
    try {
      decodeHumanViewerPreview(payload);
    } catch {
      refused = true;
    }
    TestValidator.predicate("corrupt cache", refused);
  }
}

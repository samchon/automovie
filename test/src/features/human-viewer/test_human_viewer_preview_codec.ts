import { TestValidator } from "@nestia/e2e";
import { runInNewContext } from "node:vm";

import { decodeHumanViewerPreview } from "../../../scripts/human-viewer/decodeHumanViewerPreview";
import { encodeHumanViewerPreview } from "../../../scripts/human-viewer/encodeHumanViewerPreview";
import { encodeHumanViewerPreviewChunks } from "../../../scripts/human-viewer/encodeHumanViewerPreviewChunks";

/**
 * Numerical persistence keeps array kinds and excludes local-reference metadata.
 * Scenarios:
 * 1. Float positions, integer indices, null and ordinary arrays survive the codec.
 * 2. Extra reference bytes and paths cannot enter the projected payload.
 * 3. Wrong operations, missing models, corrupt tags and invalid arrays refuse.
 * 4. JSON omission, wrapper, Unicode and metadata semantics equal the legacy wire.
 * 5. First-fragment production visits only part of a large typed array.
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
  const shared = { retained: true };
  const unicode = "😀\ud800\udfff\n\t\\\"".repeat(900);
  const semantics = { operation: "preview", model: {
    unicode, [unicode]: "key", emptyFloat: new Float32Array(), emptyInt: new Uint32Array(),
    special: new Float32Array([NaN, Infinity, -Infinity, -0]),
    absent: undefined, callable: () => 1, symbolic: Symbol("omit"),
    sequence: [undefined, () => 1, Symbol("null"), null],
    emptyArray: [], emptyObject: {},
    numbers: [NaN, Infinity, -0], boxed: [Reflect.construct(Number, [2]), Reflect.construct(Boolean, [false]), Reflect.construct(String, ["x"])],
    boxedOverrides: [
      Object.assign(Reflect.construct(Number, [2]), { valueOf: () => "3" }),
      Object.assign(Reflect.construct(Boolean, [true]), { valueOf: () => false }),
      Object.assign(Reflect.construct(String, ["x"]), { valueOf: () => "wrong", toString: () => "custom" }),
    ],
    otherRealm: runInNewContext("[new Number(2), new String('x'), new Boolean(true)]") as unknown,
    date: new Date("2026-10-04T00:00:00Z"),
    keyAware: { toJSON: (key: string) => key },
    disappearing: { toJSON: () => undefined },
    callableJson: Object.assign(() => 1, { toJSON: (key: string) => key }),
    boxedBigIntJson: Object.assign(Reflect.construct(Object, [1n]), { toJSON: () => "bigint" }),
    shared: [shared, shared], otherTyped: new Uint8Array([2, 3]),
  }, articulation: null, contact: { pixels: unicode }, extras: [1], anatomy: { label: "한글" } };
  const expected = JSON.stringify(semantics, (_, value: unknown) =>
    value instanceof Float32Array ? { $array: "Float32", values: Array.from(value) } :
      value instanceof Uint32Array ? { $array: "Uint32", values: Array.from(value) } : value);
  const chunks = [...encodeHumanViewerPreviewChunks(semantics)];
  TestValidator.equals("legacy JSON values and order", chunks.join(""), expected);
  TestValidator.predicate("bounded pieces", chunks.length > 1 && chunks.every((chunk) => chunk.length <= 4096));
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  TestValidator.equals("independent UTF8 chunks preserve Unicode",
    chunks.map((chunk) => decoder.decode(encoder.encode(chunk))).join(""), expected);
  let visited = 0;
  class CountedFloat32 extends Float32Array {
    override *[Symbol.iterator](): ArrayIterator<number> {
      for (let at = 0; at < this.length; ++at) { ++visited; yield this[at]!; }
    }
  }
  const large = new CountedFloat32(100000);
  const lazy = encodeHumanViewerPreviewChunks({ operation: "preview", model: large });
  const first = lazy.next();
  TestValidator.predicate("first fragment independent of complete geometry", !first.done && visited < large.length / 10);
  lazy.return(undefined);
  const cycle: { self?: unknown } = {};
  cycle.self = cycle;
  for (const model of [cycle, 1n, Reflect.construct(Object, [1n])]) {
    let refused = false;
    try { encodeHumanViewerPreview({ operation: "preview", model }); } catch { refused = true; }
    TestValidator.predicate("invalid JSON value refuses", refused);
  }
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

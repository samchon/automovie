import { ingestFaceTemplate } from "@automovie/ingest";
import { IAutoMovieFaceTemplate } from "@automovie/interface";
import {
  type Accessor,
  type Buffer,
  Document,
  type Primitive,
} from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

/**
 * The happy path of the face-template import: a primitive carrying POSITION
 * plus named morph targets maps onto the flat-array template verbatim: resting
 * positions from POSITION, each delta array keyed by its target's own name. A
 * plain (target-less) mesh earlier in the document must be skipped, pinning the
 * "first MORPHED primitive" selection rule.
 *
 * Scenarios:
 *
 * 1. A `plain` mesh without targets followed by a `face` mesh whose primitive
 *    has positions [0,0,0, 1,1,1] and targets `identity` / `eyeSize`; the
 *    result reproduces both arrays exactly and only those two keys.
 * 2. A quantized face whose positions and deltas are normalized 16-bit
 *    integers yields the decoded values (32767 reads as 1), not the raw
 *    integers.
 * 3. A target named `__proto__` becomes an own key of `targets` carrying its
 *    deltas instead of replacing the record's prototype.
 */
export const test_ingest_face_template = (): void => {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const acc = (array: number[]) =>
    doc
      .createAccessor()
      .setType("VEC3")
      .setArray(new Float32Array(array))
      .setBuffer(buffer);

  const plain = doc.createPrimitive().setAttribute("POSITION", acc([9, 9, 9]));
  doc.createMesh("plain").addPrimitive(plain);

  const prim = doc
    .createPrimitive()
    .setAttribute("POSITION", acc([0, 0, 0, 1, 1, 1]));
  prim.addTarget(
    doc
      .createPrimitiveTarget("identity")
      .setAttribute("POSITION", acc([0.5, 0, 0, 0, 0.5, 0])),
  );
  prim.addTarget(
    doc
      .createPrimitiveTarget("eyeSize")
      .setAttribute("POSITION", acc([0, 0.25, 0, 0, 0, 0.25])),
  );
  doc.createMesh("face").addPrimitive(prim);

  const template = ingestFaceTemplate(doc);
  TestValidator.equals("positions", template.positions, [0, 0, 0, 1, 1, 1]);
  TestValidator.equals(
    "target names",
    Object.keys(template.targets).sort((a, b) => a.localeCompare(b)),
    ["eyeSize", "identity"],
  );
  TestValidator.equals(
    "identity deltas",
    template.targets["identity"],
    [0.5, 0, 0, 0, 0.5, 0],
  );
  TestValidator.equals(
    "eyeSize deltas",
    template.targets["eyeSize"],
    [0, 0.25, 0, 0, 0, 0.25],
  );

  // 2. normalized integer accessors decode to the values they mean
  const quantized: Document = new Document();
  const qBuffer: Buffer = quantized.createBuffer();
  const normalized = (array: number[]): Accessor =>
    quantized
      .createAccessor()
      .setType("VEC3")
      .setArray(new Int16Array(array))
      .setNormalized(true)
      .setBuffer(qBuffer);
  const qPrim: Primitive = quantized
    .createPrimitive()
    .setAttribute("POSITION", normalized([0, 32767, 0]));
  qPrim.addTarget(
    quantized
      .createPrimitiveTarget("identity")
      .setAttribute("POSITION", normalized([-32767, 0, 0])),
  );
  quantized.createMesh("face").addPrimitive(qPrim);
  const qTemplate: IAutoMovieFaceTemplate = ingestFaceTemplate(quantized);
  TestValidator.equals(
    "normalized positions and deltas decode",
    [qTemplate.positions, qTemplate.targets["identity"]],
    [
      [0, 1, 0],
      [-1, 0, 0],
    ],
  );

  // 3. a prototype-named target is an own key
  const reserved: Document = new Document();
  const rBuffer: Buffer = reserved.createBuffer();
  const rAccessor = (array: number[]): Accessor =>
    reserved
      .createAccessor()
      .setType("VEC3")
      .setArray(new Float32Array(array))
      .setBuffer(rBuffer);
  const rPrim: Primitive = reserved
    .createPrimitive()
    .setAttribute("POSITION", rAccessor([0, 0, 0]));
  rPrim.addTarget(
    reserved
      .createPrimitiveTarget("__proto__")
      .setAttribute("POSITION", rAccessor([1, 0, 0])),
  );
  reserved.createMesh("face").addPrimitive(rPrim);
  const rTemplate: IAutoMovieFaceTemplate = ingestFaceTemplate(reserved);
  TestValidator.equals(
    "a __proto__ target is an own key with its deltas",
    [
      Object.keys(rTemplate.targets),
      Object.getOwnPropertyDescriptor(rTemplate.targets, "__proto__")?.value,
    ],
    [["__proto__"], [1, 0, 0]],
  );
};

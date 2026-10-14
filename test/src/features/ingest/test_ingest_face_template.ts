import { ingestFaceTemplate } from "@automovie/ingest";
import { IAutoMovieFaceTemplate } from "@automovie/interface";
import {
  type Accessor,
  type Buffer,
  Document,
  type Primitive,
} from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * The happy path of the face-template import: a primitive carrying POSITION plus named morph targets maps onto the flat-array template verbatim: resting positions from POSITION, each delta array keyed by its target's own name. A plain (target-less) mesh earlier in the document must be skipped, pinning the "first morphed primitive" selection rule.
 *
 * Scenarios:
 *
 * 1. A `plain` mesh without targets followed by a `face` mesh whose primitive has positions [0,0,0, 1,1,1] and targets `identity` / `eyeSize`; the result reproduces both arrays exactly and only those two keys.
 * 2. A quantized face whose positions and deltas are normalized 16-bit integers yields the decoded values (32767 reads as 1), not the raw integers.
 * 3. A target named `__proto__` becomes an own key of `targets` carrying its deltas instead of replacing the record's prototype.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the face-template mapper and checks first-morphed-primitive selection, named deltas, normalized integer decoding and own-key storage; choosing a plain primitive or corrupting a prototype-named target fails.
 * @evidence contracts/testing.md#independent-expectations The resident POSITION and delta arrays author the correspondence and 32767 normalized signed storage means one; numeric copies use zero-tolerance nclose.
 * @evidence contracts/testing.md#distinguishing-cases A preceding plain primitive, two independently named targets, quantized signed deltas and __proto__ own-key output are covered; malformed storage/name/length cases have separate face-template units and no editor ingress or visual likeness is established.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_face_template entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_face_template(): void {
  const doc: Document = new Document();
  const buffer: Buffer = doc.createBuffer();
  const acc: (array: number[]) => Accessor = (array: number[]): Accessor =>
    doc
      .createAccessor()
      .setType("VEC3")
      .setArray(new Float32Array(array))
      .setBuffer(buffer);

  const plain: Primitive = doc
    .createPrimitive()
    .setAttribute("POSITION", acc([9, 9, 9]));
  doc.createMesh("plain").addPrimitive(plain);

  const prim: Primitive = doc
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

  const template: IAutoMovieFaceTemplate = ingestFaceTemplate(doc);
  TestValidator.predicate(
    "positions",
    test12ValuesClose(template.positions, [0, 0, 0, 1, 1, 1]),
  );
  TestValidator.predicate(
    "target names",
    test12ValuesClose(
      Object.keys(template.targets).sort((a: string, b: string): number =>
        a.localeCompare(b),
      ),
      ["eyeSize", "identity"],
    ),
  );
  TestValidator.predicate(
    "identity deltas",
    test12ValuesClose(template.targets["identity"], [0.5, 0, 0, 0, 0.5, 0]),
  );
  TestValidator.predicate(
    "eyeSize deltas",
    test12ValuesClose(template.targets["eyeSize"], [0, 0.25, 0, 0, 0, 0.25]),
  );

  // 2. normalized integer accessors decode to the values they mean
  const quantized: Document = new Document();
  const qBuffer: Buffer = quantized.createBuffer();
  const normalized: (array: number[]) => Accessor = (
    array: number[],
  ): Accessor =>
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
  TestValidator.predicate(
    "normalized positions and deltas decode",
    test12ValuesClose(
      [qTemplate.positions, qTemplate.targets["identity"]],
      [
        [0, 1, 0],
        [-1, 0, 0],
      ],
    ),
  );

  // 3. a prototype-named target is an own key
  const reserved: Document = new Document();
  const rBuffer: Buffer = reserved.createBuffer();
  const rAccessor: (array: number[]) => Accessor = (
    array: number[],
  ): Accessor =>
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
  TestValidator.predicate(
    "a __proto__ target is an own key with its deltas",
    test12ValuesClose(
      [
        Object.keys(rTemplate.targets),
        Object.getOwnPropertyDescriptor(rTemplate.targets, "__proto__")?.value,
      ],
      [["__proto__"], [1, 0, 0]],
    ),
  );
}

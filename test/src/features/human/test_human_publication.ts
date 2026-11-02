import type { IAutoMovieMesh, IAutoMovieModelPart, IAutoMovieTransform } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type * as THREE from "three";

import { serializeHumanImagePublication } from "../../../../packages/human/dev/src/human/serializeHumanImagePublication";
import { HumanImagePublication as Publication } from "../../../../packages/human/dev/src/human-images/HumanImagePublication";
import { readHumanImagePublicationBytes } from "../../../../packages/human/dev/src/human-images/readHumanImagePublicationBytes";
import type { IAutoMovieHumanGenerated } from "../../../../packages/human/src/structures/IAutoMovieHumanGenerated";
import { f1 } from "../../../../packages/playground/src/human-parameters";
import { buildGeometry } from "../../../../packages/viewer/src/buildGeometry";

/**
 * Compact mesh transport preserves the actual viewer buffers and hash domains.
 *
 * Scenarios:
 * 1. Random Float32 patterns, neighbouring doubles and rounding boundaries keep
 *    identical IEEE bits; invalid Float32 values refuse publication.
 * 2. All mesh and morph channels rebuild into identical real viewer attributes;
 *    parameters, rig, transforms, topology, metadata, materials and images keep
 *    their original JSON values and shared sources remain frozen and unchanged.
 * 3. Raw publication and parsed wire model/construction hashes stay distinct
 *    from original-double hashes, while input identity stays unchanged.
 * 4. A real owned file accepts matching bytes and rejects wrong domains, sizes,
 *    paths and hashes without increasing the existing byte cap.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual serializer, canonical commitment producer, bounded file reader and buildGeometry consumer. Attribute-bit and preserved-field assertions catch lossy rounding and channel-selection errors; a repeated long-decimal fixture proves the old full-double text misses the declared compact byte budget while the candidate meets it.
 * @evidence contracts/testing.md#independent-expectations DataView Float32 bytes and direct unprojected buildGeometry buffers supply independent expectations. Canonical digests are recomputed with Node SHA-256 over explicit JSON domains. The synthetic compactness budget is at most 75% of the original long-decimal publication, declared before measurement; it is not a whole-person or timing claim.
 * @evidence contracts/testing.md#distinguishing-cases Covers signed zero, subnormals, powers of ten, arbitrary finite bit patterns, midpoint neighbours, all selected channels and nullable morph normals, preserved physical IDs above 2^24, repeated aliases outside the mesh scope, non-finite/overflow refusal, ordinary empty optional populations, reader path/domain/size/hash failures and the unchanged 256 MiB cap. GPU pixels, complete-person byte budgets and Mannequin snapshot authority belong to integration inspection.
 * @evidence contracts/testing.md#execution-ownership Discoverable asynchronous CPU test under --include human_publication. It builds only synthetic Three geometries, disposes them and removes its one temporary file and directory; no Human generation, process, server, browser or GPU starts.
 */
export async function test_human_publication(): Promise<void> {
  const originalFixture: IAutoMovieHumanGenerated = fixture();
  const source: IAutoMovieHumanGenerated & { inspection: { positions: number[] } } = {
    ...originalFixture,
    inspection: { positions: meshOf(originalFixture, 0).positions },
  };
  const before: string = JSON.stringify(source);
  freeze(source);
  const text: string = serializeHumanImagePublication(source);
  const wire: typeof source = JSON.parse(text) as typeof source;
  const mesh: IAutoMovieMesh = meshOf(source, 0);
  const made: IAutoMovieMesh = meshOf(wire, 0);
  TestValidator.predicate("source graph unchanged", JSON.stringify(source) === before);
  for (const [a, b] of [[source.parameters, wire.parameters], [source.inspection, wire.inspection], [source.model.skeleton, wire.model.skeleton], [source.model.materials, wire.model.materials], [source.model.images, wire.model.images], [source.model.parts[0]!.transform, wire.model.parts[0]!.transform], [mesh.indices, made.indices], [mesh.physicalVertices, made.physicalVertices], [mesh.skin!.joints, made.skin!.joints], [mesh.skin!.boneIndices, made.skin!.boneIndices]])
    TestValidator.predicate("non-Float32 field preserved", JSON.stringify(a) === JSON.stringify(b));
  for (let i: number = 0; i < source.model.parts.length; i++) {
    const original: THREE.BufferGeometry = buildGeometry(source.model.parts[i]!.geometry);
    const projected: THREE.BufferGeometry = buildGeometry(wire.model.parts[i]!.geometry);
    try {
      for (const name of Object.keys(original.attributes)) equalBytes(original.getAttribute(name).array, projected.getAttribute(name).array);
      if (original.index !== null) equalBytes(original.index.array, projected.index!.array);
      for (const name of ["position", "normal"] as const) {
        const targets: (THREE.BufferAttribute | THREE.InterleavedBufferAttribute)[] | undefined = original.morphAttributes[name];
        if (targets === undefined) continue;
        targets.forEach((target: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, k: number): void => equalBytes(target.array, projected.morphAttributes[name]![k]!.array));
      }
    } finally { original.dispose(); projected.dispose(); }
  }
  const values: number[] = samples();
  const numerical: IAutoMovieHumanGenerated = fixture();
  meshOf(numerical, 0).positions = values;
  const parsed: IAutoMovieHumanGenerated = JSON.parse(serializeHumanImagePublication(numerical)) as IAutoMovieHumanGenerated;
  equalFloat32(values, meshOf(parsed, 0).positions);
  for (const invalid of [NaN, Infinity, -Infinity, 1e40, -1e40]) {
    const bad: IAutoMovieHumanGenerated = fixture();
    meshOf(bad, 0).positions[0] = invalid;
    let refused: boolean = false;
    try { serializeHumanImagePublication(bad); } catch (error) { refused = error instanceof RangeError; }
    TestValidator.predicate("invalid Float32 refuses", refused);
  }

  // Repeated full-double decimals establish a portable byte budget, not speed.
  const long: IAutoMovieHumanGenerated = fixture();
  meshOf(long, 0).positions = new Array<number>(30000).fill(0.123456789012345);
  const legacyBytes: number = Buffer.byteLength(JSON.stringify(long));
  const compactBytes: number = Buffer.byteLength(serializeHumanImagePublication(long));
  TestValidator.predicate("declared compact byte budget", compactBytes <= 0.75 * legacyBytes);

  const committed: Publication.ICommitted = Publication.commit(text);
  TestValidator.predicate("exact byte digest", committed.sha256 === digest(committed.bytes));
  TestValidator.predicate("parsed wire model digest", committed.modelSha256 === digest(JSON.stringify(wire.model)));
  TestValidator.predicate("parsed wire construction digest", committed.constructionSha256 === digest(JSON.stringify(wire.model.parts.filter((part: IAutoMovieModelPart): boolean => part.id.startsWith("human.construction.")))));
  TestValidator.predicate("original double model is a different domain", committed.modelSha256 !== digest(JSON.stringify(source.model)));
  TestValidator.predicate("original double construction is a different domain", committed.constructionSha256 !== digest(JSON.stringify(source.model.parts.filter((part: IAutoMovieModelPart): boolean => part.id.startsWith("human.construction.")))));
  TestValidator.predicate("input commitment preserved", digest(JSON.stringify(source.parameters)) === digest(JSON.stringify(wire.parameters)));
  TestValidator.predicate("existing byte cap", Publication.MAX_BYTES === 268435456);

  const directory: string = await fs.mkdtemp(path.join(tmpdir(), "human-publication-"));
  const filename: string = path.join(directory, "publication.json");
  const record: Record<string, unknown> = { path: filename, bytes: committed.bytes.length, sha256: committed.sha256, encoding: Publication.ENCODING, canonical: Publication.CANONICAL };
  try {
    await fs.writeFile(filename, committed.bytes);
    TestValidator.predicate("owned byte read", (await readHumanImagePublicationBytes(filename, record)).equals(committed.bytes));
    for (const change of [{ path: filename + ".other" }, { bytes: committed.bytes.length - 1 }, { bytes: Publication.MAX_BYTES + 1 }, { bytes: 1.5 }, { encoding: "original-double" }, { canonical: "original-model" }, { sha256: "0".repeat(64) }]) {
      let refused: boolean = false;
      try { await readHumanImagePublicationBytes(filename, { ...record, ...change }); } catch { refused = true; }
      TestValidator.predicate("publication mismatch refuses", refused);
    }
    await fs.appendFile(filename, " ");
    let changed: boolean = false;
    try { await readHumanImagePublicationBytes(filename, record); } catch { changed = true; }
    TestValidator.predicate("actual larger file refuses", changed);
  } finally { await fs.unlink(filename); await fs.rmdir(directory); }
}

/** Synthetic connected rig and mesh attributes, without a generated person. */
function fixture(): IAutoMovieHumanGenerated {
  const v: number = 0.123456789012345;
  const transform: IAutoMovieTransform = { translation: { x: v, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } };
  const mesh: IAutoMovieMesh = {
    positions: [v, -0, 0, 1 + v, 0, 0, v, 1, 0], normals: [0, 0, 1, 0, 0, 1, 0, 0, 1], uvs: [v, 0, 1, 0, v, 1],
    colors: [v, 0.7, 0.8, v, 0.7, 0.8, v, 0.7, 0.8], reliefWeights: [v, 1, 0], indices: [0, 1, 2],
    physicalVertices: { sources: [{ domain: "fixture", id: 16777217 }, { domain: "fixture", id: 16777218 }, { domain: "fixture", id: 16777219 }], vertices: [0, 1, 2] },
    skin: { joints: ["hips", "head"], boneIndices: [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0], weights: [1 / 3, 2 / 3, 0, -0, 1 / 3, 2 / 3, 0, 0, 1 / 3, 2 / 3, 0, 0], method: "dual-quaternion" },
    targets: [{ name: "position", positions: [v, -0, 0, v, 0, 0, v, 0, 0], normals: null }, { name: "normal", positions: new Array<number>(9).fill(0), normals: [v, 0, 0, v, 0, 0, v, 0, 0] }],
  };
  const part: (id: string) => IAutoMovieModelPart = (id: string): IAutoMovieModelPart => ({ id, name: id, geometry: { type: "mesh", mesh }, material: "fixture", attachedBone: null, transform });
  return {
    parameters: structuredClone(f1),
    model: {
      id: "fixture", name: null, origin: "generated", parts: [part("human.skin.fixture/0"), part("human.construction.fixture/0")], body: null, asset: null,
      skeleton: { id: "fixture", bones: [{ bone: "hips", parent: null, rest: transform, constraint: null }, { bone: "head", parent: "hips", rest: transform, constraint: null }] },
      materials: [{ id: "fixture", name: null, baseColor: { r: v, g: 0, b: 0, a: 1, hex: null }, metallic: 0, roughness: v, emissive: null, opacity: 1, baseColorTexture: null, doubleSided: false }],
      images: [{ id: "fixture", mimeType: "image/png", data: "AAECAwQ=" }],
    },
  };
}

/** Select the fixture's declared raw mesh, refusing a wrong fixture geometry. */
function meshOf(result: IAutoMovieHumanGenerated, index: number): IAutoMovieMesh {
  const geometry: IAutoMovieModelPart["geometry"] = result.model.parts[index]!.geometry;
  if (geometry.type !== "mesh") throw new Error("Fixture must be a mesh");
  return geometry.mesh;
}

/** Portable finite bit patterns, neighbours and decimal/Float32 boundaries. */
function samples(): number[] {
  const values: number[] = [0, -0, Number.MIN_VALUE, -Number.MIN_VALUE, 2 ** -149, -(2 ** -149), 2 ** -126, 1e-7, 1e-6, 1e20, 1e21, 1.0000000596046448, 1.000000059604645];
  const view: DataView = new DataView(new ArrayBuffer(4));
  let seed: number = 0x6a09e667;
  for (let i: number = 0; i < 5000; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    view.setUint32(0, seed, true);
    const value: number = view.getFloat32(0, true);
    if (!Number.isFinite(value)) continue;
    values.push(value, value + value * 1e-9);
    if (value > 0 && seed < 0x7f7fffff) {
      view.setUint32(0, seed + 1, true);
      const midpoint: number = (value + view.getFloat32(0, true)) / 2;
      values.push(midpoint, midpoint - value * Number.EPSILON, midpoint + value * Number.EPSILON);
    }
  }
  return values;
}

/** DataView supplies an independent oracle for exact Float32 bit identity. */
function equalFloat32(a: number[], b: number[]): void {
  TestValidator.predicate("scalar count", a.length === b.length);
  const left: DataView = new DataView(new ArrayBuffer(4));
  const right: DataView = new DataView(new ArrayBuffer(4));
  a.forEach((value: number, i: number): void => {
    left.setFloat32(0, value, true); right.setFloat32(0, b[i]!, true);
    TestValidator.predicate("Float32 bits", left.getUint32(0, true) === right.getUint32(0, true));
  });
}

/** Compare real consumer typed buffers, including integer attributes and indices. */
function equalBytes(a: ArrayBufferView, b: ArrayBufferView): void {
  TestValidator.predicate("typed buffer bytes", Buffer.from(a.buffer, a.byteOffset, a.byteLength).equals(Buffer.from(b.buffer, b.byteOffset, b.byteLength)));
}

/** Freeze shared fixture records before the serializer visits them. */
function freeze(value: unknown, seen: Set<object> = new Set()): void {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  for (const child of Object.values(value)) freeze(child, seen);
  Object.freeze(value);
}

/** Independent canonical or raw-byte digest used by the explicit domain checks. */
function digest(value: string | Buffer): string { return createHash("sha256").update(value).digest("hex"); }

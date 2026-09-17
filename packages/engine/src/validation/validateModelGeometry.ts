/**
 * Geometry admission used by validateModel for each resident model part.
 * Primitive lengths are positive metres. Mesh tuples retain their authored
 * order: positions, normals, UVs, linear RGB, indices and four-weight skin
 * bindings are checked before the shared topology pass. That pass self-guards
 * malformed buffers and permits intended open surfaces. Skin weights are
 * dimensionless and their sum tolerance is the existing 1e-6 contract.
 * No position, index, colour or binding is repaired; only the caller's violation
 * collector changes. Face construction and export depend on these same checks,
 * which establish input validity without certifying anatomical shape.
 */
import type {
  AutoMoviePrimitiveShape,
  IAutoMovieMesh,
  IAutoMovieMeshSkin,
} from "@automovie/interface";

import { appendMeshTopology } from "./validateMeshTopology";
import { ViolationCollector } from "./violation";

/**
 * Push a `type` violation for an unknown primitive shape, or a `range`
 * violation for any non-finite or non-positive primitive dimension.
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Selects the dimensions belonging to each primitive kind and diagnoses nonfinite or nonpositive extents.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Selects the dimensions belonging to each primitive kind and diagnoses nonfinite or nonpositive extents.
 */
export const validateExtents = (
  shape: AutoMoviePrimitiveShape,
  path: string,
  collector: ViolationCollector,
): void => {
  let dims: ReadonlyArray<readonly [string, number]>;
  switch (shape.type) {
    case "box":
      dims = [
        ["width", shape.width],
        ["height", shape.height],
        ["depth", shape.depth],
      ];
      break;
    case "sphere":
      dims = [["radius", shape.radius]];
      break;
    case "plane":
      dims = [
        ["width", shape.width],
        ["depth", shape.depth],
      ];
      break;
    case "cylinder":
    case "cone":
    case "capsule":
      dims = [
        ["radius", shape.radius],
        ["height", shape.height],
      ];
      break;
    default: {
      const unknown = shape as { type: unknown };
      collector.push(
        "type",
        `${path}.type`,
        `unknown primitive shape "${String(unknown.type)}"`,
        unknown.type,
      );
      return;
    }
  }
  for (const [name, value] of dims)
    if (!Number.isFinite(value) || value <= 0)
      collector.push(
        "range",
        `${path}.${name}`,
        `${name} must be a finite number > 0, but was ${value}`,
        value,
      );
};

/**
 * Checks resident attribute cardinality, numeric ranges, joint bindings and shared topology before model use.
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Admits aligned resident buffers and joint references before the self-guarded shared topology pass.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Admits aligned resident buffers and joint references before the self-guarded shared topology pass.
 */
export const validateMesh = (
  mesh: IAutoMovieMesh,
  path: string,
  boneNames: ReadonlySet<string>,
  collector: ViolationCollector,
): void => {
  validateTupleBuffer(mesh.positions, 3, `${path}.positions`, collector);
  // An empty buffer is a multiple of 3, so validateTupleBuffer accepts it; a
  // mesh with no vertices is degenerate geometry (empty GLB export, empty
  // collision proxy) and belongs in the correction round, not at render time,
  // the mesh mirror of a primitive's strictly-positive extents.
  if (mesh.positions.length === 0)
    collector.push(
      "type",
      `${path}.positions`,
      "a mesh must contain at least one vertex",
      mesh.positions.length,
    );
  const vertexCount = mesh.positions.length / 3;

  if (mesh.normals !== null) {
    validateTupleBuffer(mesh.normals, 3, `${path}.normals`, collector);
    validateBufferLength(
      mesh.normals,
      vertexCount * 3,
      `${path}.normals`,
      "normals must contain one xyz triple per position vertex",
      collector,
    );
  }

  if (mesh.uvs !== null) {
    validateTupleBuffer(mesh.uvs, 2, `${path}.uvs`, collector);
    validateBufferLength(
      mesh.uvs,
      vertexCount * 2,
      `${path}.uvs`,
      "uvs must contain one uv pair per position vertex",
      collector,
    );
  }

  if (mesh.colors !== undefined) {
    validateTupleBuffer(mesh.colors, 3, `${path}.colors`, collector);
    validateBufferLength(
      mesh.colors,
      vertexCount * 3,
      `${path}.colors`,
      "colors must contain one linear RGB triple per position vertex",
      collector,
    );
    mesh.colors.forEach((value, index) => {
      if (value < 0 || value > 1)
        collector.push(
          "range",
          `${path}.colors[${index}]`,
          "vertex colour components must be in [0, 1]",
          value,
        );
    });
  }

  if (mesh.indices !== null) {
    validateTupleBuffer(mesh.indices, 3, `${path}.indices`, collector);
    mesh.indices.forEach((index, i) => {
      const valid =
        Number.isInteger(index) && index >= 0 && index < vertexCount;
      if (!valid)
        collector.push(
          "range",
          `${path}.indices[${i}]`,
          `index must be an integer vertex reference in [0, ${vertexCount - 1}], but was ${index}`,
          index,
        );
    });
  }

  if (mesh.skin !== null)
    validateMeshSkin(
      mesh.skin,
      vertexCount,
      `${path}.skin`,
      boneNames,
      collector,
    );

  // Tier-5 topology (#1183): 2-manifold + consistent winding over the welded
  // surface. Self-guards on the buffers this function already reports, so it
  // never reads a malformed index. Watertightness is not demanded here: an
  // open mesh (plane, decal) is a valid model geometry.
  appendMeshTopology(mesh, path, collector, false);
};

const validateTupleBuffer = (
  buffer: number[],
  tupleSize: number,
  path: string,
  collector: ViolationCollector,
): void => {
  if (buffer.length % tupleSize !== 0)
    collector.push(
      "type",
      path,
      `buffer length must be a multiple of ${tupleSize}, but was ${buffer.length}`,
      buffer.length,
    );

  buffer.forEach((value, i) => {
    if (!Number.isFinite(value))
      collector.push(
        "range",
        `${path}[${i}]`,
        `value must be finite, but was ${value}`,
        value,
      );
  });
};

const validateBufferLength = (
  buffer: number[],
  expected: number,
  path: string,
  message: string,
  collector: ViolationCollector,
): void => {
  if (buffer.length !== expected)
    collector.push(
      "type",
      path,
      `${message}; expected length ${expected}, but was ${buffer.length}`,
      buffer.length,
    );
};

const validateMeshSkin = (
  skin: IAutoMovieMeshSkin,
  vertexCount: number,
  path: string,
  boneNames: ReadonlySet<string>,
  collector: ViolationCollector,
): void => {
  const expectedInfluences = vertexCount * 4;
  validateBufferLength(
    skin.boneIndices,
    expectedInfluences,
    `${path}.boneIndices`,
    "boneIndices must contain four joint references per position vertex",
    collector,
  );
  validateBufferLength(
    skin.weights,
    expectedInfluences,
    `${path}.weights`,
    "weights must contain four influence values per position vertex",
    collector,
  );

  const seen = new Set<string>();
  skin.joints.forEach((joint, i) => {
    if (!boneNames.has(joint))
      collector.push(
        "type",
        `${path}.joints[${i}]`,
        `skin joint "${joint}" is not a bone of this model's skeleton`,
        joint,
      );
    if (seen.has(joint))
      collector.push(
        "type",
        `${path}.joints[${i}]`,
        `skin joint "${joint}" is duplicated`,
        joint,
      );
    seen.add(joint);
  });

  skin.boneIndices.forEach((index, i) => {
    const valid =
      Number.isInteger(index) && index >= 0 && index < skin.joints.length;
    if (!valid)
      collector.push(
        "range",
        `${path}.boneIndices[${i}]`,
        `bone index must be an integer skin joint reference in [0, ${skin.joints.length - 1}], but was ${index}`,
        index,
      );
  });

  skin.weights.forEach((weight, i) =>
    collector.range(`${path}.weights[${i}]`, weight, 0, 1, "weight"),
  );

  for (let vertex = 0; vertex < vertexCount; ++vertex) {
    const offset = vertex * 4;
    const weights = skin.weights.slice(offset, offset + 4);
    if (weights.length === 4 && weights.every(Number.isFinite)) {
      const sum = weights.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1) > 1e-6)
        collector.push(
          "range",
          `${path}.weights[${offset}]`,
          `vertex ${vertex} skin weights must sum to 1, but summed to ${sum}`,
          weights,
        );
    }
  }
};

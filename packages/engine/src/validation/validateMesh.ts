import {
  AutoMovieHumanoidBone,
  IAutoMovieDrivenCurvePoint,
  IAutoMovieMesh,
  IAutoMovieMeshMorphTarget,
  IAutoMovieMeshSkin,
  IAutoMovieMorphTargetDriver,
} from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";
import { appendMeshTopology } from "./appendMeshTopology";
import { AUTOMOVIE_ARKIT_CHANNELS } from "./constants/AUTOMOVIE_ARKIT_CHANNELS";
import { AUTOMOVIE_EXPRESSION_PRESETS } from "./constants/AUTOMOVIE_EXPRESSION_PRESETS";

/**
 * Admit tuple/cardinality buffers, dense finite numeric elements, vertex references, skin bindings, morph targets and their drivers, and shared welded topology.
 *
 * @evidence contracts/common.md#principled-implementation Walk IAutoMovieMesh's typed buffer containers for tuple/cardinality, dense finite numeric elements, vertex references, skin bindings and methods, morph target buffers, names and drivers, and shared welded topology; the array/null and skin-record container structure is a precondition rather than an unknown-payload schema check.
 * @evidence contracts/common.md#clear-and-simple-design Attribute, skin and morph target checks stay with the mesh, applying the clip curve's point rules to drivers, while appendMeshTopology owns topology admission and analysis.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Indexed walks inspect resident holes as undefined and malformed numeric coordinates cannot escape through weld analysis. Malformed containers such as positions:null can still throw at length access; skin normalization uses a 1e-6 tolerance.
 * @evidence contracts/common.md#meaningful-documentation States the typed-container premise, one/two/three/four component arities, located numeric/cardinality errors and the separate welded-topology responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Total buffer size, including morph target deltas, drives linear admission; welded topology adds its edge/triangle costs and per-vertex four-weight checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Common tuple/length helpers serve attributes, and the canonical topology owner prevents independent welded rules.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only collector rows remain; local joint and target-name sets and weight slices release and no mesh renderer or byte decoder is created.
 */
export const validateMesh: (
  mesh: IAutoMovieMesh,
  path: string,
  boneNames: ReadonlySet<string>,
  collector: ViolationCollector,
) => void = (
  /** Typed array/null and skin-record structure; this owner admits entries and cardinality without a total unknown-object schema gate. */
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
  const vertexCount: number = mesh.positions.length / 3;

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
    mesh.colors.forEach((value: number, index: number): void => {
      if (value < 0 || value > 1)
        collector.push(
          "range",
          `${path}.colors[${index}]`,
          "vertex colour components must be in [0, 1]",
          value,
        );
    });
  }

  if (mesh.reliefWeights !== undefined) {
    validateBufferLength(
      mesh.reliefWeights,
      vertexCount,
      `${path}.reliefWeights`,
      "reliefWeights must contain one factor per position vertex",
      collector,
    );
    for (let index: number = 0; index < mesh.reliefWeights.length; ++index) {
      const value: number = mesh.reliefWeights[index]!;
      if (!Number.isFinite(value) || value < 0)
        collector.push(
          "range",
          `${path}.reliefWeights[${index}]`,
          "relief weights must be finite and nonnegative",
          value,
        );
    }
  }

  if (mesh.indices !== null) {
    validateTupleBuffer(mesh.indices, 3, `${path}.indices`, collector);
    for (let i: number = 0; i < mesh.indices.length; ++i) {
      const index: number = mesh.indices[i]!;
      const valid: boolean =
        Number.isInteger(index) && index >= 0 && index < vertexCount;
      if (!valid)
        collector.push(
          "range",
          `${path}.indices[${i}]`,
          `index must be an integer vertex reference in [0, ${vertexCount - 1}], but was ${index}`,
          index,
        );
    }
  }

  if (mesh.skin !== null)
    validateMeshSkin(
      mesh.skin,
      vertexCount,
      `${path}.skin`,
      boneNames,
      collector,
    );

  if (mesh.targets !== undefined)
    validateMeshTargets(
      mesh.targets,
      vertexCount,
      `${path}.targets`,
      boneNames,
      collector,
    );

  // Tier-5 topology (#1183): 2-manifold + consistent winding over the welded
  // surface. Self-guards on the buffers this function already reports, so it
  // never reads a malformed index. Watertightness is not demanded here: an
  // open mesh (plane, decal) is a valid model geometry.
  appendMeshTopology(mesh, path, collector, false);
};

/**
 * Require length divisible by tuple arity and inspect every indexed scalar for finiteness.
 *
 * One owner serves position/normal/UV/color/index tuple layout checks.
 *
 * Sparse holes are inspected as undefined and diagnosed rather than skipped by forEach.
 *
 * Arity faults use the buffer path; finite faults use the precise element index.
 *
 * B scalars take O(B) work with constant loop storage.
 *
 * All mesh tuple attributes reuse the same finite/layout predicate.
 *
 * Only collector rows remain; numeric buffers stay borrowed and no copy is retained.
 */
const validateTupleBuffer: (
  buffer: number[],
  tupleSize: number,
  path: string,
  collector: ViolationCollector,
) => void = (
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

  for (let i: number = 0; i < buffer.length; ++i) {
    const value: number = buffer[i]!;
    if (!Number.isFinite(value))
      collector.push(
        "range",
        `${path}[${i}]`,
        `value must be finite, but was ${value}`,
        value,
      );
  }
};

/**
 * Require exact scalar count against the supplied per-vertex cardinality.
 *
 * The attribute/skin owner supplies the semantic expected length/message.
 *
 * No truncation or padding makes a mismatched resident buffer valid.
 *
 * Mismatch diagnostics include actual and expected lengths at the buffer path.
 *
 * One length comparison plus failure text costs bounded work.
 *
 * Normal/UV/color/relief/skin fields share this cardinality check.
 *
 * Buffers remain borrowed and only caller-owned diagnostics escape.
 */
const validateBufferLength: (
  buffer: number[],
  expected: number,
  path: string,
  message: string,
  collector: ViolationCollector,
) => void = (
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

/**
 * Require a known blend method, four references/weights per vertex, declared unique joints, dense bounded weights/references and finite weight sums within1e-6 of one.
 *
 * Shared length/range owners supply scalar diagnostics while this helper owns skin packing.
 *
 * Zero-valued influences still require valid joint references; sparse holes are diagnosed and excluded from sum evaluation.
 *
 * Four-influence layout and exact joint/reference/weight paths are stated.
 *
 * J joints and I influences are scanned linearly; each vertex checks four values with bounded temporary slices.
 *
 * One joint seen set shares duplicate lookup for this skin; current buffers are not cached.
 *
 * Seen/slice storage releases and the collector owns faults; no skeletal renderer or buffer handle remains.
 */
const validateMeshSkin: (
  skin: IAutoMovieMeshSkin,
  vertexCount: number,
  path: string,
  boneNames: ReadonlySet<string>,
  collector: ViolationCollector,
) => void = (
  skin: IAutoMovieMeshSkin,
  vertexCount: number,
  path: string,
  boneNames: ReadonlySet<string>,
  collector: ViolationCollector,
): void => {
  if (
    skin.method !== undefined &&
    skin.method !== "linear" &&
    skin.method !== "dual-quaternion"
  )
    collector.push(
      "type",
      `${path}.method`,
      `skinning method must be "linear" or "dual-quaternion", but was ${JSON.stringify(skin.method)}`,
      skin.method,
    );
  const expectedInfluences: number = vertexCount * 4;
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

  const seen: Set<string> = new Set<string>();
  for (let i: number = 0; i < skin.joints.length; ++i) {
    const joint: AutoMovieHumanoidBone = skin.joints[i]!;
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
  }

  for (let i: number = 0; i < skin.boneIndices.length; ++i) {
    const index: number = skin.boneIndices[i]!;
    const valid: boolean =
      Number.isInteger(index) && index >= 0 && index < skin.joints.length;
    if (!valid)
      collector.push(
        "range",
        `${path}.boneIndices[${i}]`,
        `bone index must be an integer skin joint reference in [0, ${skin.joints.length - 1}], but was ${index}`,
        index,
      );
  }

  for (let i: number = 0; i < skin.weights.length; ++i)
    collector.range(`${path}.weights[${i}]`, skin.weights[i]!, 0, 1, "weight");

  for (let vertex: number = 0; vertex < vertexCount; ++vertex) {
    const offset: number = vertex * 4;
    const weights: number[] = skin.weights.slice(offset, offset + 4);
    if (
      weights.length === 4 &&
      Number.isFinite(weights[0]) &&
      Number.isFinite(weights[1]) &&
      Number.isFinite(weights[2]) &&
      Number.isFinite(weights[3])
    ) {
      const sum: number = weights.reduce(
        (a: number, b: number): number => a + b,
        0,
      );
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

/**
 * Require each morph target to carry a nonempty unique name, one finite delta
 * triple per vertex for positions and for non-null normals, and, when driven, a
 * skeleton bone, a clinical axis, a nonempty finite strictly increasing curve
 * and a name no expression writes.
 *
 * Expressions write preset and ARKit names after the pose, matching ignoring
 * case, so a driven target under such a name would lose its weight every frame.
 *
 * T targets over V vertices cost O(T V) with one name set and one folded
 * expression-name set per call.
 *
 * Only collector rows remain; buffers stay borrowed.
 */
const validateMeshTargets: (
  targets: IAutoMovieMeshMorphTarget[],
  vertexCount: number,
  path: string,
  boneNames: ReadonlySet<string>,
  collector: ViolationCollector,
) => void = (
  targets: IAutoMovieMeshMorphTarget[],
  vertexCount: number,
  path: string,
  boneNames: ReadonlySet<string>,
  collector: ViolationCollector,
): void => {
  const names: Set<string> = new Set<string>();
  const expressionNames: Set<string> = new Set<string>(
    [...AUTOMOVIE_EXPRESSION_PRESETS, ...AUTOMOVIE_ARKIT_CHANNELS].map(
      (name: string): string => name.toLowerCase(),
    ),
  );
  targets.forEach((target: IAutoMovieMeshMorphTarget, i: number): void => {
    const tp: string = `${path}[${i}]`;
    if (typeof target.name !== "string" || target.name.length === 0)
      collector.push(
        "type",
        `${tp}.name`,
        "morph target name must be a nonempty string",
        target.name,
      );
    else if (names.has(target.name))
      collector.push(
        "type",
        `${tp}.name`,
        `morph target name "${target.name}" is duplicated`,
        target.name,
      );
    names.add(target.name);
    validateTupleBuffer(target.positions, 3, `${tp}.positions`, collector);
    validateBufferLength(
      target.positions,
      vertexCount * 3,
      `${tp}.positions`,
      "morph target positions must contain one delta triple per position vertex",
      collector,
    );
    if (target.normals !== null) {
      validateTupleBuffer(target.normals, 3, `${tp}.normals`, collector);
      validateBufferLength(
        target.normals,
        vertexCount * 3,
        `${tp}.normals`,
        "morph target normals must contain one delta triple per position vertex",
        collector,
      );
    }
    const driver: IAutoMovieMorphTargetDriver | null = target.driver ?? null;
    if (driver === null) return;
    if (
      typeof target.name === "string" &&
      expressionNames.has(target.name.toLowerCase())
    )
      collector.push(
        "type",
        `${tp}.name`,
        `driven morph target "${target.name}" shares its name with an expression preset or ARKit channel, which expressions overwrite`,
        target.name,
      );
    if (!boneNames.has(driver.bone))
      collector.push(
        "type",
        `${tp}.driver.bone`,
        `driver bone "${driver.bone}" is not a bone of this model's skeleton`,
        driver.bone,
      );
    if (
      driver.axis !== "flexion" &&
      driver.axis !== "abduction" &&
      driver.axis !== "twist"
    )
      collector.push(
        "type",
        `${tp}.driver.axis`,
        `driver axis must be "flexion", "abduction" or "twist", but was ${JSON.stringify(driver.axis)}`,
        driver.axis,
      );
    const points: IAutoMovieDrivenCurvePoint[] = driver.curve.points;
    if (points.length === 0)
      collector.push(
        "type",
        `${tp}.driver.curve.points`,
        "driver curve needs at least one point",
        points,
      );
    points.forEach((point: IAutoMovieDrivenCurvePoint, k: number): void => {
      const pp: string = `${tp}.driver.curve.points[${k}]`;
      if (!Number.isFinite(point.source))
        collector.push(
          "range",
          `${pp}.source`,
          "curve source must be finite",
          point.source,
        );
      if (!Number.isFinite(point.output))
        collector.push(
          "range",
          `${pp}.output`,
          "curve output must be finite",
          point.output,
        );
      if (k > 0 && !(point.source > points[k - 1]!.source))
        collector.push(
          "range",
          `${pp}.source`,
          `curve sources must strictly increase, but ${point.source} follows ${points[k - 1]!.source}`,
          point.source,
        );
    });
  });
};

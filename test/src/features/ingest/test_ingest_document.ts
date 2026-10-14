import { ingestDocument } from "@automovie/ingest";
import { IAutoMovieNode } from "@automovie/interface";
import { Document } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

const byName: (nodes: IAutoMovieNode[], name: string) => IAutoMovieNode = (
  nodes: IAutoMovieNode[],
  name: string,
): IAutoMovieNode => {
  const n: IAutoMovieNode | undefined = nodes.find(
    (x: IAutoMovieNode): boolean => x.name === name,
  );
  if (n === undefined) throw new Error(`node "${name}" missing`);
  return n;
};

const makeAnimatedDoc: () => {
  doc: Document;
  node: import("@gltf-transform/core").Node;
  time: import("@gltf-transform/core").Accessor;
  values: import("@gltf-transform/core").Accessor;
  sampler: import("@gltf-transform/core").AnimationSampler;
  channel: import("@gltf-transform/core").AnimationChannel;
} = (): {
  doc: Document;
  node: import("@gltf-transform/core").Node;
  time: import("@gltf-transform/core").Accessor;
  values: import("@gltf-transform/core").Accessor;
  sampler: import("@gltf-transform/core").AnimationSampler;
  channel: import("@gltf-transform/core").AnimationChannel;
} => {
  const doc: Document = new Document();
  const node: import("@gltf-transform/core").Node = doc.createNode("target");
  doc.createScene().addChild(node);
  const time: import("@gltf-transform/core").Accessor = doc
    .createAccessor()
    .setType("SCALAR")
    .setArray(new Float32Array([0, 1]));
  const values: import("@gltf-transform/core").Accessor = doc
    .createAccessor()
    .setType("VEC3")
    .setArray(new Float32Array([0, 0, 0, 1, 1, 1]));
  const sampler: import("@gltf-transform/core").AnimationSampler =
    doc.createAnimationSampler();
  const channel: import("@gltf-transform/core").AnimationChannel = doc
    .createAnimationChannel()
    .setTargetPath("translation");
  doc.createAnimation("bad").addSampler(sampler).addChannel(channel);
  return { doc, node, time, values, sampler, channel };
};

/**
 * Ingest a hand-built glTF {@link Document} into the core node graph and clips, exercising all four reachable node kinds, representative references, and all three glTF interpolation modes.
 *
 * The document: a `root` group with a `meshNode` (mesh) and `camNode` (camera) child, plus a `bone` (skin joint), a `skinned` mesh+skin node, and an unnamed node, all under the scene. One named animation drives three channels (translation LINEAR, rotation STEP, scale CUBICSPLINE) and a second, unnamed, empty animation.
 *
 * Scenarios:
 *
 * 1. Six glTF nodes yield six core nodes; the mesh/camera parents refer to the returned root id and the root is parentless. Decimal id spelling and the other scene-level parents are not asserted.
 * 2. Kind inference covers all four reachable kinds: a skin joint → `bone` (even though a mesh would otherwise win), a mesh node → `mesh`, a camera node → `camera`, everything else → `group`.
 * 3. Mesh, camera and skin references are present on their carriers; the mesh node has no camera or skin, an unnamed node remains unnamed, and the mesh translation's x component remains one. Other TRS components and exact resource indices are not observed.
 * 4. Each glTF animation becomes a clip; its channels become tracks whose channel targets the node by id with the right path, and whose interpolation maps LINEAR→linear, STEP→step, CUBICSPLINE→cubicspline. Clip duration is the latest keyframe time; the empty unnamed animation yields a null-named, zero-duration, trackless clip.
 * 5. A channel the sample pass could not replay is refused by its fault: a missing target, sampler, input or output, empty data, an output length off the path's arity, no target path, an interpolation outside glTF's three, keyframe times that do not strictly increase, and a non-finite output value.
 * 6. A normalized 16-bit rotation output decodes to the unit quaternion it means rather than its raw integers.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls Document ingestion and observes node references, kind precedence, channel interpolation and decoded samples, then checks field-specific refusals for unreplayable channels.
 * @evidence contracts/testing.md#independent-expectations The authored graph defines parent relationships, while returned ids are used only to check referential consistency, not their index spelling; accessor values define interpolation vocabulary and sample arity independently. Normalized signed integers define exact decoded zero/one quaternion components; full TRS fidelity, resource-index identity and returned-array independence remain outside these assertions.
 * @evidence contracts/testing.md#distinguishing-cases All four reachable node kinds, named/unnamed and empty clips, translation/rotation/scale/weights, missing channel storage, empty arrays, wrong arity, absent path, unknown interpolation, backward times and nonfinite values are retained; raw container/profile admission belongs to byte-inspector units.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_document entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_document(): void {
  const doc: Document = new Document();
  const scene: import("@gltf-transform/core").Scene = doc.createScene();

  const mesh: import("@gltf-transform/core").Mesh = doc.createMesh("m");
  const cam: import("@gltf-transform/core").Camera = doc
    .createCamera("c")
    .setType("perspective");

  const meshNode: import("@gltf-transform/core").Node = doc
    .createNode("meshNode")
    .setMesh(mesh)
    .setTranslation([1, 2, 3]);
  const camNode: import("@gltf-transform/core").Node = doc
    .createNode("camNode")
    .setCamera(cam);
  const bone: import("@gltf-transform/core").Node = doc
    .createNode("bone")
    .setMesh(mesh);
  const skin: import("@gltf-transform/core").Skin = doc
    .createSkin("skin")
    .addJoint(bone);
  const skinned: import("@gltf-transform/core").Node = doc
    .createNode("skinned")
    .setMesh(mesh)
    .setSkin(skin);
  const unnamed: import("@gltf-transform/core").Node = doc.createNode();
  const root: import("@gltf-transform/core").Node = doc
    .createNode("root")
    .addChild(meshNode)
    .addChild(camNode);
  scene.addChild(root);
  scene.addChild(bone);
  scene.addChild(skinned);
  scene.addChild(unnamed);

  // animation: T linear, R step, S cubicspline
  const time: import("@gltf-transform/core").Accessor = doc
    .createAccessor()
    .setType("SCALAR")
    .setArray(new Float32Array([0, 1]));
  const trans: import("@gltf-transform/core").Accessor = doc
    .createAccessor()
    .setType("VEC3")
    .setArray(new Float32Array([0, 0, 0, 10, 0, 0]));
  const rot: import("@gltf-transform/core").Accessor = doc
    .createAccessor()
    .setType("VEC4")
    .setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1]));
  const scl: import("@gltf-transform/core").Accessor = doc
    .createAccessor()
    .setType("VEC3")
    .setArray(new Float32Array(new Array(18).fill(1)));

  const sT: import("@gltf-transform/core").AnimationSampler = doc
    .createAnimationSampler()
    .setInput(time)
    .setOutput(trans)
    .setInterpolation("LINEAR");
  const sR: import("@gltf-transform/core").AnimationSampler = doc
    .createAnimationSampler()
    .setInput(time)
    .setOutput(rot)
    .setInterpolation("STEP");
  const sS: import("@gltf-transform/core").AnimationSampler = doc
    .createAnimationSampler()
    .setInput(time)
    .setOutput(scl)
    .setInterpolation("CUBICSPLINE");
  const cT: import("@gltf-transform/core").AnimationChannel = doc
    .createAnimationChannel()
    .setTargetNode(meshNode)
    .setTargetPath("translation")
    .setSampler(sT);
  const cR: import("@gltf-transform/core").AnimationChannel = doc
    .createAnimationChannel()
    .setTargetNode(meshNode)
    .setTargetPath("rotation")
    .setSampler(sR);
  const cS: import("@gltf-transform/core").AnimationChannel = doc
    .createAnimationChannel()
    .setTargetNode(meshNode)
    .setTargetPath("scale")
    .setSampler(sS);
  doc
    .createAnimation("walk")
    .addSampler(sT)
    .addSampler(sR)
    .addSampler(sS)
    .addChannel(cT)
    .addChannel(cR)
    .addChannel(cS);
  doc.createAnimation(); // unnamed, empty

  const {
    nodes,
    clips,
  }: import("../../../../packages/ingest/src/IAutoMovieIngestResult").IAutoMovieIngestResult =
    ingestDocument(doc);

  // 1. node count + parent references
  TestValidator.predicate("node count", test12ValuesClose(nodes.length, 6));
  const rootId: string = byName(nodes, "root").id;
  TestValidator.predicate(
    "mesh node parents root",
    test12ValuesClose(byName(nodes, "meshNode").parent, rootId),
  );
  TestValidator.predicate(
    "camera node parents root",
    test12ValuesClose(byName(nodes, "camNode").parent, rootId),
  );
  TestValidator.predicate(
    "root is parentless",
    test12ValuesClose(byName(nodes, "root").parent, null),
  );

  // 2. kind inference (all four)
  TestValidator.predicate(
    "joint is bone",
    test12ValuesClose(byName(nodes, "bone").kind, "bone"),
  );
  TestValidator.predicate(
    "mesh node is mesh",
    test12ValuesClose(byName(nodes, "meshNode").kind, "mesh"),
  );
  TestValidator.predicate(
    "camera node is camera",
    test12ValuesClose(byName(nodes, "camNode").kind, "camera"),
  );
  TestValidator.predicate(
    "root is group",
    test12ValuesClose(byName(nodes, "root").kind, "group"),
  );

  // 3. payload ids, unnamed → null, TRS carried
  const mn: IAutoMovieNode = byName(nodes, "meshNode");
  TestValidator.predicate(
    "mesh id present",
    test12ValuesClose(mn.mesh !== null, true),
  );
  TestValidator.predicate(
    "mesh node has no camera",
    test12ValuesClose(mn.camera, null),
  );
  TestValidator.predicate(
    "mesh node has no skin",
    test12ValuesClose(mn.skin, null),
  );
  TestValidator.predicate(
    "camera id present",
    test12ValuesClose(byName(nodes, "camNode").camera !== null, true),
  );
  TestValidator.predicate(
    "skinned has skin id",
    test12ValuesClose(byName(nodes, "skinned").skin !== null, true),
  );
  TestValidator.predicate(
    "unnamed node name is null",
    test12ValuesClose(
      nodes.find((n: IAutoMovieNode): boolean => n.name === null) !== undefined,
      true,
    ),
  );
  TestValidator.predicate(
    "translation carried",
    nclose(mn.transform.translation.x, 1),
  );

  // 4. clips, tracks, interpolation mapping, duration
  TestValidator.predicate("clip count", test12ValuesClose(clips.length, 2));
  const walk: import("@automovie/interface").IAutoMovieClip = clips.find(
    (c: import("@automovie/interface").IAutoMovieClip): boolean =>
      c.name === "walk",
  )!;
  TestValidator.predicate(
    "walk track count",
    test12ValuesClose(walk.tracks.length, 3),
  );
  TestValidator.predicate("walk duration", nclose(walk.duration, 1));
  const path: (p: string) => import("@automovie/interface").IAutoMovieTrack = (
    p: string,
  ): import("@automovie/interface").IAutoMovieTrack =>
    walk.tracks.find(
      (t: import("@automovie/interface").IAutoMovieTrack): boolean =>
        t.channel.kind === "node" && t.channel.path === p,
    )!;
  TestValidator.predicate(
    "translation linear",
    test12ValuesClose(path("translation").interpolation, "linear"),
  );
  TestValidator.predicate(
    "rotation step",
    test12ValuesClose(path("rotation").interpolation, "step"),
  );
  TestValidator.predicate(
    "scale cubicspline",
    test12ValuesClose(path("scale").interpolation, "cubicspline"),
  );
  const translationChannel: import("@automovie/interface").IAutoMovieChannel =
    path("translation").channel;
  TestValidator.predicate(
    "track targets node by id",
    test12ValuesClose(
      translationChannel.kind === "node" && translationChannel.node,
      mn.id,
    ),
  );
  TestValidator.predicate(
    "translation values",
    test12ValuesClose(path("translation").values, [0, 0, 0, 10, 0, 0]),
  );

  const weightsDoc: ReturnType<typeof makeAnimatedDoc> = makeAnimatedDoc();
  const weightValues: import("@gltf-transform/core").Accessor = weightsDoc.doc
    .createAccessor()
    .setType("SCALAR")
    .setArray(new Float32Array([0, 0.5, 1, 0.25]));
  weightsDoc.sampler.setInput(weightsDoc.time).setOutput(weightValues);
  weightsDoc.channel
    .setTargetNode(weightsDoc.node)
    .setTargetPath("weights")
    .setSampler(weightsDoc.sampler);
  const weightsClip: import("@automovie/interface").IAutoMovieClip =
    ingestDocument(weightsDoc.doc).clips[0]!;
  TestValidator.predicate(
    "weights track count",
    test12ValuesClose(weightsClip.tracks.length, 1),
  );
  TestValidator.predicate(
    "weights values keep per-key width",
    test12ValuesClose(weightsClip.tracks[0]!.values, [0, 0.5, 1, 0.25]),
  );

  const empty: import("@automovie/interface").IAutoMovieClip = clips.find(
    (c: import("@automovie/interface").IAutoMovieClip): boolean =>
      c.name === null,
  )!;
  TestValidator.predicate(
    "empty clip has no tracks",
    test12ValuesClose(empty.tracks.length, 0),
  );
  TestValidator.predicate(
    "empty clip zero duration",
    test12ValuesClose(empty.duration, 0),
  );

  const missingTarget: ReturnType<typeof makeAnimatedDoc> = makeAnimatedDoc();
  missingTarget.sampler
    .setInput(missingTarget.time)
    .setOutput(missingTarget.values);
  missingTarget.channel.setSampler(missingTarget.sampler);
  TestValidator.predicate(
    "animation channel without target rejects",
    throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieIngestResult").IAutoMovieIngestResult =>
        ingestDocument(missingTarget.doc),
      "animation channel must target a node",
    ),
  );

  const missingSampler: ReturnType<typeof makeAnimatedDoc> = makeAnimatedDoc();
  missingSampler.channel.setTargetNode(missingSampler.node);
  TestValidator.predicate(
    "animation channel without sampler rejects",
    throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieIngestResult").IAutoMovieIngestResult =>
        ingestDocument(missingSampler.doc),
      'animation channel for node "node_0" must have a sampler',
    ),
  );

  const missingInput: ReturnType<typeof makeAnimatedDoc> = makeAnimatedDoc();
  missingInput.sampler.setOutput(missingInput.values);
  missingInput.channel
    .setTargetNode(missingInput.node)
    .setSampler(missingInput.sampler);
  TestValidator.predicate(
    "animation sampler without input rejects",
    throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieIngestResult").IAutoMovieIngestResult =>
        ingestDocument(missingInput.doc),
      'animation channel for node "node_0" must have input times',
    ),
  );

  const missingOutput: ReturnType<typeof makeAnimatedDoc> = makeAnimatedDoc();
  missingOutput.sampler.setInput(missingOutput.time);
  missingOutput.channel
    .setTargetNode(missingOutput.node)
    .setSampler(missingOutput.sampler);
  TestValidator.predicate(
    "animation sampler without output rejects",
    throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieIngestResult").IAutoMovieIngestResult =>
        ingestDocument(missingOutput.doc),
      'animation channel for node "node_0" must have output values',
    ),
  );

  const emptyInput: ReturnType<typeof makeAnimatedDoc> = makeAnimatedDoc();
  emptyInput.sampler
    .setInput(emptyInput.doc.createAccessor().setType("SCALAR"))
    .setOutput(emptyInput.values);
  emptyInput.channel
    .setTargetNode(emptyInput.node)
    .setSampler(emptyInput.sampler);
  TestValidator.predicate(
    "animation input accessor without data rejects",
    throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieIngestResult").IAutoMovieIngestResult =>
        ingestDocument(emptyInput.doc),
      'animation channel for node "node_0" input times must have data',
    ),
  );

  const emptyOutput: ReturnType<typeof makeAnimatedDoc> = makeAnimatedDoc();
  emptyOutput.sampler
    .setInput(emptyOutput.time)
    .setOutput(emptyOutput.doc.createAccessor().setType("VEC3"));
  emptyOutput.channel
    .setTargetNode(emptyOutput.node)
    .setSampler(emptyOutput.sampler);
  TestValidator.predicate(
    "animation output accessor without data rejects",
    throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieIngestResult").IAutoMovieIngestResult =>
        ingestDocument(emptyOutput.doc),
      'animation channel for node "node_0" output values must have data',
    ),
  );

  const emptyInputArray: ReturnType<typeof makeAnimatedDoc> = makeAnimatedDoc();
  emptyInputArray.sampler
    .setInput(
      emptyInputArray.doc
        .createAccessor()
        .setType("SCALAR")
        .setArray(new Float32Array([])),
    )
    .setOutput(emptyInputArray.values);
  emptyInputArray.channel
    .setTargetNode(emptyInputArray.node)
    .setSampler(emptyInputArray.sampler);
  TestValidator.predicate(
    "animation input accessor with empty data rejects",
    throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieIngestResult").IAutoMovieIngestResult =>
        ingestDocument(emptyInputArray.doc),
      'animation channel for node "node_0" input times must not be empty',
    ),
  );

  const emptyOutputArray: ReturnType<typeof makeAnimatedDoc> =
    makeAnimatedDoc();
  emptyOutputArray.sampler
    .setInput(emptyOutputArray.time)
    .setOutput(
      emptyOutputArray.doc
        .createAccessor()
        .setType("VEC3")
        .setArray(new Float32Array([])),
    );
  emptyOutputArray.channel
    .setTargetNode(emptyOutputArray.node)
    .setSampler(emptyOutputArray.sampler);
  TestValidator.predicate(
    "animation output accessor with empty data rejects",
    throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieIngestResult").IAutoMovieIngestResult =>
        ingestDocument(emptyOutputArray.doc),
      'animation channel for node "node_0" output values must not be empty',
    ),
  );

  const shortTranslationOutput: ReturnType<typeof makeAnimatedDoc> =
    makeAnimatedDoc();
  shortTranslationOutput.sampler
    .setInput(shortTranslationOutput.time)
    .setOutput(
      shortTranslationOutput.doc
        .createAccessor()
        .setType("VEC3")
        .setArray(new Float32Array([0, 0, 0, 1, 1])),
    );
  shortTranslationOutput.channel
    .setTargetNode(shortTranslationOutput.node)
    .setSampler(shortTranslationOutput.sampler);
  TestValidator.predicate(
    "translation output arity rejects",
    throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieIngestResult").IAutoMovieIngestResult =>
        ingestDocument(shortTranslationOutput.doc),
      ["translation output values length", "6", "5"],
    ),
  );

  const shortCubicOutput: ReturnType<typeof makeAnimatedDoc> =
    makeAnimatedDoc();
  shortCubicOutput.sampler
    .setInput(shortCubicOutput.time)
    .setOutput(
      shortCubicOutput.doc
        .createAccessor()
        .setType("VEC3")
        .setArray(new Float32Array(new Array(6).fill(1))),
    )
    .setInterpolation("CUBICSPLINE");
  shortCubicOutput.channel
    .setTargetNode(shortCubicOutput.node)
    .setTargetPath("scale")
    .setSampler(shortCubicOutput.sampler);
  TestValidator.predicate(
    "cubic output arity rejects",
    throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieIngestResult").IAutoMovieIngestResult =>
        ingestDocument(shortCubicOutput.doc),
      ["scale output values length", "18", "6"],
    ),
  );

  const unevenWeightsOutput: ReturnType<typeof makeAnimatedDoc> =
    makeAnimatedDoc();
  unevenWeightsOutput.sampler.setInput(unevenWeightsOutput.time).setOutput(
    unevenWeightsOutput.doc
      .createAccessor()
      .setType("SCALAR")
      .setArray(new Float32Array([0, 0.5, 1])),
  );
  unevenWeightsOutput.channel
    .setTargetNode(unevenWeightsOutput.node)
    .setTargetPath("weights")
    .setSampler(unevenWeightsOutput.sampler);
  TestValidator.predicate(
    "weights output arity rejects",
    throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieIngestResult").IAutoMovieIngestResult =>
        ingestDocument(unevenWeightsOutput.doc),
      ["weights output values length", "multiple of 2", "3"],
    ),
  );

  const replayable: () => ReturnType<typeof makeAnimatedDoc> = (): ReturnType<
    typeof makeAnimatedDoc
  > => {
    const fixture: ReturnType<typeof makeAnimatedDoc> = makeAnimatedDoc();
    fixture.sampler.setInput(fixture.time).setOutput(fixture.values);
    fixture.channel.setTargetNode(fixture.node).setSampler(fixture.sampler);
    return fixture;
  };

  const noPath: ReturnType<typeof makeAnimatedDoc> = replayable();
  noPath.channel.setTargetPath(null as unknown as "translation");
  TestValidator.predicate(
    "animation channel without a target path rejects",
    throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieIngestResult").IAutoMovieIngestResult =>
        ingestDocument(noPath.doc),
      'animation channel for node "node_0" target path must be translation, rotation, scale, or weights, but was null',
    ),
  );

  const unknownInterpolation: ReturnType<typeof makeAnimatedDoc> = replayable();
  unknownInterpolation.sampler.setInterpolation(
    "BEZIER" as unknown as "LINEAR",
  );
  TestValidator.predicate(
    "unknown interpolation rejects instead of reading as linear",
    throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieIngestResult").IAutoMovieIngestResult =>
        ingestDocument(unknownInterpolation.doc),
      'interpolation must be LINEAR, STEP, or CUBICSPLINE, but was "BEZIER"',
    ),
  );

  const backwardTimes: ReturnType<typeof makeAnimatedDoc> = replayable();
  backwardTimes.time.setArray(new Float32Array([1, 0]));
  TestValidator.predicate(
    "keyframe times that do not increase reject",
    throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieIngestResult").IAutoMovieIngestResult =>
        ingestDocument(backwardTimes.doc),
      "input times must be finite, non-negative and strictly increasing, but key 1 is 0",
    ),
  );

  const nonFiniteOutput: ReturnType<typeof makeAnimatedDoc> = replayable();
  nonFiniteOutput.values.setArray(new Float32Array([0, 0, 0, 1, NaN, 1]));
  TestValidator.predicate(
    "a non-finite output value rejects",
    throwsError(
      (): import("../../../../packages/ingest/src/IAutoMovieIngestResult").IAutoMovieIngestResult =>
        ingestDocument(nonFiniteOutput.doc),
      "output values must be finite",
    ),
  );

  const quantized: ReturnType<typeof makeAnimatedDoc> = replayable();
  quantized.sampler.setOutput(
    quantized.doc
      .createAccessor()
      .setType("VEC4")
      .setArray(new Int16Array([0, 0, 0, 32767, 0, 32767, 0, 0]))
      .setNormalized(true),
  );
  quantized.channel.setTargetPath("rotation");
  TestValidator.predicate(
    "normalized rotation output decodes to unit quaternions",
    test12ValuesClose(
      ingestDocument(quantized.doc).clips[0]!.tracks[0]!.values,
      [0, 0, 0, 1, 0, 1, 0, 0],
    ),
  );
}

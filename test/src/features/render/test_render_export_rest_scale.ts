import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";
import { Document, Node, NodeIO } from "@gltf-transform/core";
import { IAutoMovieModel } from "@automovie/interface";
import { exportModelToGLB } from "../../../../packages/render/src/node/exportModelToGLB";
import { TestValidator } from "@nestia/e2e";
/** A rig whose hips rest carries a non-unit scale (a common VRM import). */
const MODEL: IAutoMovieModel = {
  id: "scaled",
  name: "scaled",
  origin: "imported",
  body: null,
  skeleton: {
    id: "rig",
    bones: [
      {
        bone: "hips",
        parent: null,
        rest: {
          translation: { x: 0, y: 1, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1.02, y: 1.02, z: 1.02 },
        },
        constraint: null,
      },
    ],
  },
  materials: [],
  parts: [
    {
      id: "lamp",
      name: "lamp",
      geometry: { type: "primitive", shape: { type: "sphere", radius: 0.1 } },
      material: null,
      attachedBone: "hips",
      transform: {
        translation: { x: 0, y: 0.2, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 2, y: 3, z: 4 },
      },
    },
  ],
  asset: null,
};

/**
 * Exported bone nodes follow the decision-309 rig convention (#1086): the engine's FK and the live viewer compose bone-rest rotation and translation only (#1052), so the exporter must not bake rest scale onto glTF bone nodes: external viewers compose node scale into every descendant, and a VRM-style rig with slight non-unit rest scales would render a scaled body no automovie renderer or validator ever saw. Part node scale remains authored: parts are not rig bones on either side of the convention.
 *
 * Scenarios (hips rest scale 1.02, attached part scale (2,3,4)):
 *
 * 1. The exported hips node carries unit scale while its rest translation and rotation survive verbatim.
 * 2. Negative twin: the attached part's node keeps its authored (2,3,4) scale and its own translation.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads exported bone and part TRS through NodeIO, catching bone-rest scale leakage while preserving the part's independently authored scale and translation.
 * @evidence contracts/testing.md#independent-expectations The rig convention defines unit bone scale, rest translation (0,1,0), identity rotation and part scale (2,3,4) with translation (0,0.2,0); numeric components use nclose rather than exact deep equality. The reader does not compare displayed bounds.
 * @evidence contracts/testing.md#distinguishing-cases Bone rest scale 1.02 is the changing case and a scaled attached part is the positive twin that must retain scale; general rest hierarchy and missing references belong to the GLB export test.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_export_rest_scale owns its cases. In-memory GLB conversion and SDK parsing only, with no live viewer or renderer.
 */
export async function test_render_export_rest_scale(): Promise<void> {
  const glb: Uint8Array<ArrayBufferLike> = await exportModelToGLB(MODEL);
  const doc: Document = await new NodeIO().readBinary(glb);
  const nodes: Map<string, Node> = new Map(
    doc
      .getRoot()
      .listNodes()
      .map((node: Node): [string, Node] => [node.getName(), node]),
  );

  // 1. the bone node drops rest scale, keeps rotation + translation
  const hips: Node = nodes.get("hips")!;
  TestValidator.predicate("the exported bone carries unit scale", filmEffectValuesClose([...hips.getScale()], [1, 1, 1]));
  TestValidator.predicate("the bone rest translation survives", filmEffectValuesClose([...hips.getTranslation()], [0, 1, 0]));
  TestValidator.predicate("the bone rest rotation survives", filmEffectValuesClose([...hips.getRotation()], [0, 0, 0, 1]));

  // 2. negative twin: the part node's scale is first-class
  const lamp: Node = nodes.get("lamp")!;
  TestValidator.predicate("the attached part keeps its authored scale", filmEffectValuesClose([...lamp.getScale()], [2, 3, 4]));
  TestValidator.predicate("the part translation survives", filmEffectValuesClose([...lamp.getTranslation()], [0, 0.2, 0]));
}

import {
  adoptAutoMovieExternalMotion,
  humanoidSkeleton,
} from "@automovie/ingest";
import type {
  IAutoMovieExternalModelInspection,
  IAutoMovieExternalMotionNodeInspection,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { Document, Node as GLTFNode } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { test12MotionFixture } from "../../../internal/test12Motion/test12MotionFixture";
import { test12MotionInspect } from "../../../internal/test12Motion/test12MotionInspect";
import { test12MotionSkeleton } from "../../../internal/test12Motion/test12MotionSkeleton";

/**
 * A walk to a bone's nearest mapped ancestor ends at a parent cycle: a glTF
 * node hierarchy is a set of disjoint strict trees (glTF 2.0, section 3.5),
 * so a walk that meets an ancestor twice has left that contract, and both
 * mappers refuse it where they used to circle it without end.
 *
 * Scenarios:
 * 1. A glTF-transform document whose unmapped helpers parent each other,
 *    `Hips` under `HelperA` under `HelperB` under `HelperA`, both helpers
 *    outside the skin: `humanoidSkeleton` throws naming the cycle. Before
 *    the walk refused a revisit, it circled the two helpers forever.
 * 2. The same document without the loop, `HelperB` a root, still maps
 *    `Hips` to the parentless hips with its own rest.
 * 3. The motion fixture's inspection with its unmapped helper `node_1`
 *    edited to be its own parent: native adoption throws naming the cycle,
 *    where the walk from the mapped chest circled `node_1` forever.
 * 4. The unedited inspection still adopts, the chest's parent the hips.
 */
export function test_unit_ingest_ingest_parent_cycle_refusal(): void {
  const findings: string[] = [];
  const refusal = (run: () => unknown): string | null => {
    try {
      run();
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  };

  // 1-2. The naming mapper over a helper cycle and over its acyclic twin.
  const helpers = (looped: boolean): Document => {
    const doc: Document = new Document();
    const hips: GLTFNode = doc.createNode("mixamorig:Hips");
    const a: GLTFNode = doc.createNode("HelperA");
    const b: GLTFNode = doc.createNode("HelperB");
    a.addChild(hips);
    b.addChild(a);
    if (looped) a.addChild(b);
    else doc.createScene().addChild(b);
    doc.createSkin("body").addJoint(hips);
    return doc;
  };
  const cycled: string | null = refusal(() => humanoidSkeleton(helpers(true)));
  if (cycled === null || !cycled.includes("ancestor cycle"))
    findings.push(`helper cycle: ${cycled ?? "returned"}`);
  const tree: IAutoMovieSkeleton | null = humanoidSkeleton(helpers(false));
  if (
    tree === null ||
    tree.bones.length !== 1 ||
    tree.bones[0]!.bone !== "hips" ||
    tree.bones[0]!.parent !== null
  )
    findings.push(`acyclic helpers: ${JSON.stringify(tree)}`);

  // 3-4. Motion adoption over a self-parented helper and over the fixture.
  const fixture: ReturnType<typeof test12MotionFixture> = test12MotionFixture();
  const inspection: IAutoMovieExternalModelInspection =
    test12MotionInspect(fixture);
  const adopt = (
    of: IAutoMovieExternalModelInspection,
  ): ReturnType<typeof adoptAutoMovieExternalMotion> =>
    adoptAutoMovieExternalMotion({
      inspection: of,
      source: {
        path: "public/motion/walk.gltf",
        digest: `sha256:${"a".repeat(64)}`,
        byteLength: fixture.bytes.byteLength,
      },
      decision: {
        mode: "native",
        take: "clip_0",
        sourceRig: test12MotionSkeleton(),
        mapping: [
          { node: "node_2", bone: "chest" },
          { node: "node_0", bone: "hips" },
        ],
      },
    });
  const edited: IAutoMovieExternalModelInspection = structuredClone(inspection);
  const helper: IAutoMovieExternalMotionNodeInspection | undefined =
    edited.motion?.nodes.find(
      (node: IAutoMovieExternalMotionNodeInspection): boolean =>
        node.id === "node_1",
    );
  if (helper === undefined) findings.push("the fixture has no node_1 helper");
  else {
    helper.parent = "node_1";
    const looped: string | null = refusal(() => adopt(edited));
    if (looped === null || !looped.includes("parent cycle"))
      findings.push(`self-parented helper: ${looped ?? "adopted"}`);
  }
  const adopted: ReturnType<typeof adopt> = adopt(inspection);
  const chest: IAutoMovieSkeleton["bones"][number] | undefined =
    adopted.handoff.sourceRig.bones.find(
      (bone: IAutoMovieSkeleton["bones"][number]): boolean =>
        bone.bone === "chest",
    );
  if (chest?.parent !== "hips")
    findings.push(`fixture chest parent: ${chest?.parent}`);

  TestValidator.equals(
    "a parent cycle is refused, a tree is mapped",
    findings,
    [],
  );
}

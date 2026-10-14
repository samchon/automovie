import { test12ValuesClose } from "../internal/test12ValuesClose";
import { humanoidSkeleton } from "@automovie/ingest";
import { IAutoMovieBone } from "@automovie/interface";
import { Document } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

const bonesOf: (bones: IAutoMovieBone[]) => string[] = (bones: IAutoMovieBone[]): string[] =>
  bones.map((b: IAutoMovieBone): import("@automovie/interface").AutoMovieHumanoidBone => b.bone).sort((a: import("@automovie/interface").AutoMovieHumanoidBone, b: import("@automovie/interface").AutoMovieHumanoidBone): number => a.localeCompare(b));

/**
 * Multi-skin documents map humanoid slots over every skin's joints, not only `skins[0]` (#1104): exporters bind clothes/hair as their own skins with no ordering guarantee, so the body rig must be found wherever it sits. The union is first-wins per slot in document order, and single-skin behavior is untouched.
 *
 * Scenarios:
 *
 * 1. An accessory-first document (skin "cloth" holds only an unmapped `Button`, skin "body" holds `Hips → Spine`) still yields the body skeleton: before the fix `skins[0]` had no hips and the whole character demoted to `null`.
 * 2. Negative twin: the same joints with the body skin first yield the identical skeleton, pinning order independence when slots do not conflict.
 * 3. Complementary partial skins union: skin one maps `Hips`, skin two maps `Spine` (sharing the hips joint), and the emitted skeleton carries both slots with `spine` parenting `hips` across the skin boundary.
 * 4. First-wins across skins: when two skins name distinct nodes `Spine`, the earlier skin's node owns the slot: the later duplicate is dropped, matching the single-skin duplicate rule.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the mapper with reordered, complementary and conflicting skins, checking mapped slots, hierarchy and first-owner rest; reading only the first skin or replacing an earlier slot fails.
 * @evidence contracts/testing.md#independent-expectations Authored joint names and parent edges determine hips/spine membership, and the earlier Spine's quarter-metre offset fixes the first-wins expectation independently.
 * @evidence contracts/testing.md#distinguishing-cases Accessory/body order twins, complementary skin union and duplicate slots across distinct nodes are covered; helper composition and no-hips behavior belong to the single-rig unit, and order independence applies only to nonconflicting slots.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_humanoid_skeleton_multi_skin entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_humanoid_skeleton_multi_skin(): void {
  // 1. accessory skin first: the body rig sits in the second skin
  const accessoryFirst: Document = new Document();
  const button: import("@gltf-transform/core").Node = accessoryFirst.createNode("Button");
  const aHips: import("@gltf-transform/core").Node = accessoryFirst.createNode("Hips").setTranslation([0, 1, 0]);
  const aSpine: import("@gltf-transform/core").Node = accessoryFirst.createNode("Spine").setTranslation([0, 0.2, 0]);
  aHips.addChild(aSpine);
  aHips.addChild(button);
  accessoryFirst.createSkin("cloth").addJoint(button);
  accessoryFirst.createSkin("body").addJoint(aHips).addJoint(aSpine);
  accessoryFirst.createScene().addChild(aHips);
  const accessorySkel: import("@automovie/interface").IAutoMovieSkeleton | null = humanoidSkeleton(accessoryFirst, "acc");
  if (accessorySkel === null)
    throw new Error("accessory-first document must still yield the body rig");
  TestValidator.predicate("accessory-first document maps the body skin's bones", test12ValuesClose(bonesOf(accessorySkel.bones), ["hips", "spine"]));

  // 2. negative twin: body skin first, identical result
  const bodyFirst: Document = new Document();
  const bButton: import("@gltf-transform/core").Node = bodyFirst.createNode("Button");
  const bHips: import("@gltf-transform/core").Node = bodyFirst.createNode("Hips").setTranslation([0, 1, 0]);
  const bSpine: import("@gltf-transform/core").Node = bodyFirst.createNode("Spine").setTranslation([0, 0.2, 0]);
  bHips.addChild(bSpine);
  bHips.addChild(bButton);
  bodyFirst.createSkin("body").addJoint(bHips).addJoint(bSpine);
  bodyFirst.createSkin("cloth").addJoint(bButton);
  bodyFirst.createScene().addChild(bHips);
  const bodySkel: import("@automovie/interface").IAutoMovieSkeleton | null = humanoidSkeleton(bodyFirst, "acc");
  if (bodySkel === null) throw new Error("body-first document must map");
  TestValidator.predicate("skin order does not change the mapping", test12ValuesClose(bodySkel.bones, accessorySkel.bones));

  // 3. complementary partial skins union across the skin boundary
  const partial: Document = new Document();
  const pHips: import("@gltf-transform/core").Node = partial.createNode("Hips").setTranslation([0, 1, 0]);
  const pSpine: import("@gltf-transform/core").Node = partial.createNode("Spine").setTranslation([0, 0.3, 0]);
  pHips.addChild(pSpine);
  partial.createSkin("lower").addJoint(pHips);
  partial.createSkin("upper").addJoint(pHips).addJoint(pSpine);
  partial.createScene().addChild(pHips);
  const partialSkel: import("@automovie/interface").IAutoMovieSkeleton | null = humanoidSkeleton(partial, "partial");
  if (partialSkel === null) throw new Error("partial skins must union");
  TestValidator.predicate("complementary skins union hips and spine", test12ValuesClose(bonesOf(partialSkel.bones), ["hips", "spine"]));
  TestValidator.predicate("spine parents hips across the skin boundary", test12ValuesClose(partialSkel.bones.find((b: IAutoMovieBone): boolean => b.bone === "spine")!.parent, "hips"));

  // 4. first-wins across skins for a slot two skins both name
  const dup: Document = new Document();
  const dHips: import("@gltf-transform/core").Node = dup.createNode("Hips").setTranslation([0, 1, 0]);
  const spineOne: import("@gltf-transform/core").Node = dup.createNode("Spine").setTranslation([0, 0.25, 0]);
  const spineTwo: import("@gltf-transform/core").Node = dup.createNode("Spine").setTranslation([0, 0.5, 0]);
  dHips.addChild(spineOne);
  dHips.addChild(spineTwo);
  dup.createSkin("first").addJoint(dHips).addJoint(spineOne);
  dup.createSkin("second").addJoint(spineTwo);
  dup.createScene().addChild(dHips);
  const dupSkel: import("@automovie/interface").IAutoMovieSkeleton | null = humanoidSkeleton(dup, "dup");
  if (dupSkel === null) throw new Error("duplicate-slot document must map");
  const dupSpine: IAutoMovieBone = dupSkel.bones.find((b: IAutoMovieBone): boolean => b.bone === "spine")!;
  TestValidator.predicate("the earlier skin's node owns a slot both skins name", test12ValuesClose(dupSpine.rest.translation.y, 0.25));
}

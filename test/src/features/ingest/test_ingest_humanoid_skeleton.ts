import { resolvePose } from "@automovie/engine";
import { humanoidSkeleton } from "@automovie/ingest";
import { IAutoMovieBone } from "@automovie/interface";
import { Document, Node as GLTFNode } from "@gltf-transform/core";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, vclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

const find: (bones: IAutoMovieBone[], bone: string) => IAutoMovieBone = (
  bones: IAutoMovieBone[],
  bone: string,
): IAutoMovieBone => {
  const b: IAutoMovieBone | undefined = bones.find(
    (x: IAutoMovieBone): boolean => x.bone === bone,
  );
  if (b === undefined) throw new Error(`bone ${bone} missing`);
  return b;
};

/**
 * Retarget an imported skin's joints onto the humanoid slots by name, rebuilding the hierarchy over the mapped bones only.
 *
 * The synthetic rig (Mixamo-style names): `Hips → HelperBone → Spine → LeftArm`, plus a duplicate `Spine` and an unmapped `RandomThing`, all in the skin.
 *
 * Scenarios:
 *
 * 1. A document with no skin yields `null`.
 * 2. A skin without a hips joint yields `null` (no humanoid root).
 * 3. The full rig maps `Hips→hips`, `Spine→spine`, `LeftArm→leftUpperArm`; the `mixamorig:` prefix and separators are normalized away.
 * 4. The unmapped `HelperBone` is skipped, but `Spine`'s parent resolves to `hips` through it (nearest mapped ancestor), and `LeftArm`'s parent is `spine`; hips itself is parentless.
 * 5. The duplicate `Spine` and the unmapped `RandomThing` joints are dropped, so only three bones remain, and the hips rest translation is carried through.
 * 6. A translated helper's offset composes into the child's emitted rest (#1042): `Hips(0,1,0) → Helper(+0.1y) → Spine(+0.05y)` emits spine rest y = 0.15 (relative to hips, per the `IAutoMovieBone.rest` contract), and FK through `resolvePose` places the spine at world y = 1.15.
 * 7. A rotated helper (90° about z) rotates the child's offset and rolls its rest rotation: spine local (0,0.2,0) emits rest t ≈ (−0.2,0,0) with the helper's quaternion, and FK lands at world (−0.2,1,0).
 * 8. A root bone does not compose its unmapped ancestors (an armature's transform belongs to the imported object, not the skeleton): hips under a translated `Armature` keeps its own local rest.
 * 9. UE-mannequin naming maps in-chain: `pelvis → spine_01 → spine_02 → spine_03` land on hips/spine/chest/upperChest (#1042's amplifier: an unmapped spine chain made dropped helper offsets the common case).
 * 10. A joint named `constructor`, an `Object.prototype` member, maps to no slot, so the skeleton keeps only the hips it really names.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls naming-based skeleton mapping and forward kinematics, observing mapped hierarchy/rest transforms and null cases; lost helper translation/rotation or inherited alias keys fails.
 * @evidence contracts/testing.md#independent-expectations Authored helper offsets and a 90-degree Z rotation determine local/world positions by independent rigid-transform arithmetic; naming expectations follow the declared alias vocabulary rather than anatomical inference.
 * @evidence contracts/testing.md#distinguishing-cases No skin/hips, duplicates/unmapped helpers, root armature exclusion, translated/rotated helpers, mannequin chains and constructor-name refusal are retained; multi-skin selection has a separate unit and noncommuting scale/shear is outside these rigid cases.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_ingest_humanoid_skeleton entry owns these synchronous portable ingestion cases and registered local facts; resident Document or byte fixtures require no external files, host process, editor or GPU.
 */
export function test_ingest_humanoid_skeleton(): void {
  // 1. no skin
  const noSkin: Document = new Document();
  noSkin.createScene().addChild(noSkin.createNode("mixamorig:Hips"));
  TestValidator.predicate(
    "no skin → null",
    test12ValuesClose(humanoidSkeleton(noSkin), null),
  );

  // 2. skin without hips
  const noHips: Document = new Document();
  const spineOnly: GLTFNode = noHips.createNode("mixamorig:Spine");
  noHips.createSkin("s").addJoint(spineOnly);
  noHips.createScene().addChild(spineOnly);
  TestValidator.predicate(
    "no hips → null",
    test12ValuesClose(humanoidSkeleton(noHips), null),
  );

  // 3-5. full rig
  const doc: Document = new Document();
  const hips: GLTFNode = doc
    .createNode("mixamorig:Hips")
    .setTranslation([0, 1, 0]);
  const helper: GLTFNode = doc.createNode("HelperBone");
  const spine: GLTFNode = doc.createNode("mixamorig:Spine");
  const arm: GLTFNode = doc.createNode("mixamorig:LeftArm");
  const dup: GLTFNode = doc.createNode("mixamorig:Spine");
  const junk: GLTFNode = doc.createNode("RandomThing");
  hips.addChild(helper);
  helper.addChild(spine);
  spine.addChild(arm);
  hips.addChild(dup);
  hips.addChild(junk);
  doc
    .createSkin("skin")
    .addJoint(hips)
    .addJoint(helper)
    .addJoint(spine)
    .addJoint(arm)
    .addJoint(dup)
    .addJoint(junk);
  doc.createScene().addChild(hips);

  const skel: import("@automovie/interface").IAutoMovieSkeleton | null =
    humanoidSkeleton(doc, "human");
  if (skel === null) throw new Error("expected a skeleton");

  TestValidator.predicate("skeleton id", test12ValuesClose(skel.id, "human"));
  TestValidator.predicate(
    "three mapped bones",
    test12ValuesClose(skel.bones.length, 3),
  );
  TestValidator.predicate(
    "hips is root",
    test12ValuesClose(find(skel.bones, "hips").parent, null),
  );
  TestValidator.predicate(
    "spine parents hips through the helper",
    test12ValuesClose(find(skel.bones, "spine").parent, "hips"),
  );
  TestValidator.predicate(
    "left arm parents spine",
    test12ValuesClose(find(skel.bones, "leftUpperArm").parent, "spine"),
  );
  TestValidator.predicate(
    "hips rest translation carried",
    nclose(find(skel.bones, "hips").rest.translation.y, 1),
  );

  // 6. a translated helper's offset survives into the emitted rest
  const restPose: (id: string) => {
    skeleton: string;
    root: null;
    joints: never[];
  } = (id: string): { skeleton: string; root: null; joints: never[] } => ({
    skeleton: id,
    root: null,
    joints: [],
  });
  const worldOf: (
    skeleton: { id: string; bones: IAutoMovieBone[] },
    bone: string,
  ) => import("@automovie/engine").IAutoMovieResolvedBone = (
    skeleton: { id: string; bones: IAutoMovieBone[] },
    bone: string,
  ): import("@automovie/engine").IAutoMovieResolvedBone =>
    resolvePose(restPose(skeleton.id), skeleton).find(
      (r: import("@automovie/engine").IAutoMovieResolvedBone): boolean =>
        r.bone === bone,
    )!;

  const shifted: Document = new Document();
  const sHips: GLTFNode = shifted.createNode("Hips").setTranslation([0, 1, 0]);
  const sHelper: GLTFNode = shifted
    .createNode("Helper")
    .setTranslation([0, 0.1, 0]);
  const sSpine: GLTFNode = shifted
    .createNode("Spine")
    .setTranslation([0, 0.05, 0]);
  sHips.addChild(sHelper);
  sHelper.addChild(sSpine);
  shifted.createSkin("skin").addJoint(sHips).addJoint(sHelper).addJoint(sSpine);
  shifted.createScene().addChild(sHips);
  const shiftedSkel: import("@automovie/interface").IAutoMovieSkeleton =
    humanoidSkeleton(shifted, "shifted")!;
  TestValidator.predicate(
    "a translated helper's offset composes into the child's rest",
    nclose(find(shiftedSkel.bones, "spine").rest.translation.y, 0.15),
  );
  TestValidator.predicate(
    "FK places the spine beyond the helper offset",
    vclose(worldOf(shiftedSkel, "spine").worldPosition, {
      x: 0,
      y: 1.15,
      z: 0,
    }),
  );

  // 7. a rotated helper rolls the child's offset and rest rotation
  const sq: number = Math.SQRT1_2;
  const rolled: Document = new Document();
  const rHips: GLTFNode = rolled.createNode("Hips").setTranslation([0, 1, 0]);
  const rHelper: GLTFNode = rolled
    .createNode("Roll")
    .setRotation([0, 0, sq, sq]);
  const rSpine: GLTFNode = rolled
    .createNode("Spine")
    .setTranslation([0, 0.2, 0]);
  rHips.addChild(rHelper);
  rHelper.addChild(rSpine);
  rolled.createSkin("skin").addJoint(rHips).addJoint(rHelper).addJoint(rSpine);
  rolled.createScene().addChild(rHips);
  const rolledSkel: import("@automovie/interface").IAutoMovieSkeleton =
    humanoidSkeleton(rolled, "rolled")!;
  const rolledSpine: IAutoMovieBone = find(rolledSkel.bones, "spine");
  TestValidator.predicate(
    "a rotated helper rotates the child's rest offset and rolls its rotation",
    test12ValuesClose(
      namedFacts([
        [
          "vcloseRolledSpineRest",
          (): boolean =>
            vclose(rolledSpine.rest.translation, { x: -0.2, y: 0, z: 0 }),
        ],
        [
          "ncloseRolledSpineRest",
          (): boolean => nclose(rolledSpine.rest.rotation.z, sq),
        ],
        [
          "ncloseRolledSpineRest2",
          (): boolean => nclose(rolledSpine.rest.rotation.w, sq),
        ],
      ]),
      {
        vcloseRolledSpineRest: true,
        ncloseRolledSpineRest: true,
        ncloseRolledSpineRest2: true,
      },
    ),
  );
  TestValidator.predicate(
    "FK lands the rolled spine beside the hips",
    vclose(worldOf(rolledSkel, "spine").worldPosition, { x: -0.2, y: 1, z: 0 }),
  );

  // 8. a root bone keeps its own local rest: the armature is not composed
  const wrapped: Document = new Document();
  const armature: GLTFNode = wrapped
    .createNode("Armature")
    .setTranslation([5, 0, 0]);
  const wHips: GLTFNode = wrapped.createNode("Hips").setTranslation([0, 1, 0]);
  const wSpine: GLTFNode = wrapped
    .createNode("Spine")
    .setTranslation([0, 0.3, 0]);
  armature.addChild(wHips);
  wHips.addChild(wSpine);
  wrapped.createSkin("skin").addJoint(wHips).addJoint(wSpine);
  wrapped.createScene().addChild(armature);
  const wrappedSkel: import("@automovie/interface").IAutoMovieSkeleton =
    humanoidSkeleton(wrapped, "wrapped")!;
  TestValidator.predicate(
    "a root bone keeps its local rest without the armature transform",
    vclose(find(wrappedSkel.bones, "hips").rest.translation, {
      x: 0,
      y: 1,
      z: 0,
    }),
  );

  // 9. UE-mannequin spine chain maps in-chain
  const ue: Document = new Document();
  const pelvis: GLTFNode = ue.createNode("pelvis");
  const s01: GLTFNode = ue.createNode("spine_01");
  const s02: GLTFNode = ue.createNode("spine_02");
  const s03: GLTFNode = ue.createNode("spine_03");
  pelvis.addChild(s01);
  s01.addChild(s02);
  s02.addChild(s03);
  ue.createSkin("skin")
    .addJoint(pelvis)
    .addJoint(s01)
    .addJoint(s02)
    .addJoint(s03);
  ue.createScene().addChild(pelvis);
  const ueSkel: import("@automovie/interface").IAutoMovieSkeleton =
    humanoidSkeleton(ue, "ue")!;
  TestValidator.predicate(
    "UE-mannequin spine chain maps hips/spine/chest/upperChest in-chain",
    test12ValuesClose(
      ["hips", "spine", "chest", "upperChest"].map(
        (
          b: string,
        ): import("@automovie/interface").AutoMovieHumanoidBone | null =>
          find(ueSkel.bones, b).parent,
      ),
      [null, "hips", "spine", "chest"],
    ),
  );

  // 10. a prototype member name is not an alias
  const inherited: Document = new Document();
  const iHips: GLTFNode = inherited.createNode("Hips");
  const iOther: GLTFNode = inherited.createNode("constructor");
  iHips.addChild(iOther);
  inherited.createSkin("skin").addJoint(iHips).addJoint(iOther);
  inherited.createScene().addChild(iHips);
  TestValidator.predicate(
    "a joint named after an Object.prototype member maps to no slot",
    test12ValuesClose(
      humanoidSkeleton(inherited, "inherited")?.bones.map(
        (bone: IAutoMovieBone): string => bone.bone,
      ),
      ["hips"],
    ),
  );
}

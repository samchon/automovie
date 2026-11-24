import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  assembleCostumeArmour,
  createArmour,
  createBow,
  createCostumeCuirass,
  createCostumeGauntlet,
  createCostumeGreave,
  createCostumeHelmet,
  createCostumeMail,
  createCostumeVambrace,
  createHolster,
  createProjectile,
  createStageBallProp,
  createStageBladeCarrier,
  createStageBladeProp,
  createStageCartridgeProp,
  createStageFencingProp,
  createStageFittedCarrier,
  createStageGrenadeProp,
  createStageHammerProp,
  createStageHandBowProp,
  createStageHolster,
  createStageLinkedProp,
  createStageMaceProp,
  createStagePoleBladeProp,
  createStagePouch,
  createStagePracticeSwordProp,
  createStageQuiver,
  createStageRoundProp,
  createStageShaftProp,
  createStageShaftToken,
  createStageStockBowProp,
  createStageStoneProp,
  createStageTwoHandedSwordProp,
  createStageWeaponProp,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";
import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

/**
 * Independent inert silhouettes preserve old model frames and assemble into wearable props.
 *
 * Scenarios:
 * 1. Every former kind of the six screen-prop families builds the same model through its named producer at one seed.
 * 2. A fitted carrier at the shortest and longest padded display clears all four walls, encloses the stored length up to its mouth, seats the display centred with its guard above the mouth and opens clear of it.
 * 3. A wrong display, a shared id, a wrong slot, a reused piece and a body without the slot's joints are refused.
 * 4. Through a walk, the display follows the carrier seat, the carrier's belt hook faces the pelvis, the vambrace and greave centre on their posed segments with +Y toward the upper joint, and the helmet centres midway up the head.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers the former six families and admits a separate digital carrier and a measured costume in a real performance.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public producers and live model props to check seeded silhouettes, enclosed vacant geometry, film-clock mounts, the belt hook and measured wear placement.
 * @evidence contracts/development/testing.md#independent-expectations Derives physical bounds from rendered collider parts, and compares the worn pieces with the midpoints and directions of the wearer's displayed joints and the body's stature.
 * @evidence contracts/development/testing.md#distinguishing-cases An invalid display shape, duplicate id, wrong wear slot and jointless body are refused. Two scale endpoints distinguish a fitted channel from a fixed or filled receiver. The arm and leg pieces separate a segment centre from the joint a bone origin carries.
 * @evidence contracts/development/testing.md#execution-ownership Uses an in-memory native performance, collider reads and numeric assertions.
 */
export function test_archetype_catalogue_transport_props_screen(): void {
  const id: string = "screen-prop";
  const seed: string = "canonical-screen-prop";
  const variants = {
    mace: createStageMaceProp({ id }, seed),
    pike: createStageShaftProp({ id, kind: "pike" }, seed),
    shuo: createStageShaftProp({ id, kind: "shuo" }, seed),
    halberd: createStageShaftProp({ id, kind: "halberd" }, seed),
    longBlade: createStagePoleBladeProp({ id, kind: "longBlade" }, seed),
    crescentBlade: createStagePoleBladeProp(
      { id, kind: "crescentBlade" },
      seed,
    ),
    sideBlade: createStagePoleBladeProp({ id, kind: "sideBlade" }, seed),
    serpentBlade: createStagePoleBladeProp({ id, kind: "serpentBlade" }, seed),
    offsetHammer: createStageHammerProp({ id }, seed),
    linked: createStageLinkedProp({ id }, seed),
  } satisfies Record<createStageWeaponProp.Kind, AutoMovieArchetype>;
  for (const kind of createStageWeaponProp.KINDS)
    sameModel(kind, variants[kind], createStageWeaponProp({ id, kind }, seed));
  const swords = {
    foil: createStageFencingProp({ id, kind: "foil" }, seed),
    epee: createStageFencingProp({ id, kind: "epee" }, seed),
    sabre: createStageFencingProp({ id, kind: "sabre" }, seed),
    shinai: createStagePracticeSwordProp({ id }, seed),
    longsword: createStageTwoHandedSwordProp({ id }, seed),
  } satisfies Record<createStageBladeProp.Kind, AutoMovieArchetype>;
  for (const kind of createStageBladeProp.KINDS)
    sameModel(kind, swords[kind], createStageBladeProp({ id, kind }, seed));
  for (const kind of createStageHandBowProp.KINDS)
    sameModel(
      kind,
      createStageHandBowProp({ id, kind }, seed),
      createBow({ id, kind }, seed),
    );
  sameModel(
    "stock silhouette",
    createStageStockBowProp({ id }, seed),
    createBow({ id, kind: "crossbow" }, seed),
  );
  const storage = {
    holster: createStageHolster({ id }, seed),
    scabbard: createStageBladeCarrier({ id, kind: "scabbard" }, seed),
    sheath: createStageBladeCarrier({ id, kind: "sheath" }, seed),
    quiver: createStageQuiver({ id, slots: 2 }, seed),
    pouch: createStagePouch({ id }, seed),
  } satisfies Record<createHolster.Kind, AutoMovieArchetype>;
  for (const kind of createHolster.KINDS)
    sameModel(
      kind,
      storage[kind],
      createHolster(
        { id, kind, ...(kind === "quiver" ? { slots: 2 } : {}) },
        seed,
      ),
    );
  const tokens = {
    ball: createStageBallProp({ id }, seed),
    arrow: createStageShaftToken({ id, kind: "arrow" }, seed),
    bolt: createStageShaftToken({ id, kind: "bolt" }, seed),
    roundShot: createStageRoundProp({ id }, seed),
    grenade: createStageGrenadeProp({ id }, seed),
    cartridge: createStageCartridgeProp({ id }, seed),
    stone: createStageStoneProp({ id }, seed),
  } satisfies Record<createProjectile.Kind, AutoMovieArchetype>;
  for (const kind of createProjectile.KINDS)
    sameModel(kind, tokens[kind], createProjectile({ id, kind }, seed));
  TestValidator.equals(
    "the two round silhouette contacts are distinct",
    [
      tokens.ball.affordance("body").grip,
      tokens.roundShot.affordance("body").grip,
    ],
    ["precision", "two-hand"],
  );
  const costumes = {
    openHelmet: createCostumeHelmet({ kind: "openHelmet", id: "helmet" }, seed),
    closedHelmet: createCostumeHelmet(
      { kind: "closedHelmet", id: "fullHelmet" },
      seed,
    ),
    brimmedHelmet: createCostumeHelmet(
      { kind: "brimmedHelmet", id: "wideHelmet" },
      seed,
    ),
    cuirass: createCostumeCuirass({ id: "cuirass" }, seed),
    mail: createCostumeMail({ id: "shirt" }, seed),
    gauntlet: createCostumeGauntlet({ id: "glove" }, seed),
    vambrace: createCostumeVambrace({ id: "sleeve" }, seed),
    greave: createCostumeGreave({ id: "shin" }, seed),
  } satisfies Record<createArmour.Kind, ReturnType<typeof createArmour>>;
  for (const kind of createArmour.KINDS)
    sameModel(
      kind,
      costumes[kind],
      createArmour({ id: costumes[kind].id, kind }, seed),
    );

  for (const length of [0.55, 1.45]) {
    const display: ReturnType<typeof createStageTwoHandedSwordProp> =
      createStageTwoHandedSwordProp({ id: "padded-display", length });
    const carrier: ReturnType<typeof createStageFittedCarrier> =
      createStageFittedCarrier({ display, id: "fitted-carrier" });
    checkHollow(carrier, display);
  }
  refuses("unsupported display shape", "display", () =>
    createStageFittedCarrier({
      display: createStageBladeProp({ id, kind: "foil" }, seed),
    }),
  );
  refuses("duplicate display and carrier identity", "display", () =>
    createStageFittedCarrier({ display: swords.longsword, id }),
  );
  const body: IAutoMovieMotionHumanBody = motionHumanBody("f-average");
  refuses("head slot rejects a different wearable", "slot", () =>
    assembleCostumeArmour({
      subject: "actor",
      body,
      pieces: { head: costumes.gauntlet },
    }),
  );
  refuses("two slots cannot duplicate one visible model", "id", () =>
    assembleCostumeArmour({
      subject: "actor",
      body,
      pieces: {
        leftHand: costumes.gauntlet,
        rightHand: costumes.gauntlet,
      },
    }),
  );
  refuses("a body without the slot's joints cannot be fitted", "body", () =>
    assembleCostumeArmour({
      subject: "actor",
      body: { ...body, rest: new Map() },
      pieces: { rightLowerLeg: costumes.greave },
    }),
  );

  const carrier: ReturnType<typeof createStageFittedCarrier> =
    createStageFittedCarrier({ display: swords.longsword });
  const costume: ReturnType<typeof assembleCostumeArmour> =
    assembleCostumeArmour({
      subject: "actor",
      body,
      pieces: {
        head: costumes.openHelmet,
        rightLowerArm: costumes.vambrace,
        leftLowerLeg: costumes.greave,
      },
    });
  checkMount(carrier, swords.longsword, costume, body);
}

/** Compare stable model bytes and explicit draw provenance on the two authoring paths. */
function sameModel(
  label: string,
  canonical: AutoMovieArchetype,
  legacy: AutoMovieArchetype,
): void {
  TestValidator.equals(
    label,
    JSON.stringify(canonical),
    JSON.stringify(legacy),
  );
  TestValidator.equals(
    label + " dimensions",
    canonical.dimensions,
    legacy.dimensions,
  );
  TestValidator.equals(
    label + " provenance",
    canonical.provenance,
    legacy.provenance,
  );
}

/** Independently prove the moving digital display fits the actual empty channel. */
function checkHollow(
  carrier: ReturnType<typeof createStageFittedCarrier>,
  display: ReturnType<typeof createStageTwoHandedSwordProp>,
): void {
  const seated: IAutoMovieTransform = carrier.affordance("seated").frame;
  const clear: IAutoMovieTransform = carrier.affordance("opening").frame;
  const mouth: number = carrier.affordance("mouth").frame.translation.y;
  const floor: number = archetypeExtent(carrier, "y", ["base"]).high;
  const radial: number = archetypeExtent(display, "x", [
    "shaft",
    "endCap",
  ]).high;
  const depth: number = archetypeExtent(display, "z", ["shaft", "endCap"]).high;
  const tip: number = archetypeExtent(display, "y", ["endCap"]).high;
  const guard: number = archetypeExtent(display, "y", ["guard"]).high;
  const gaps: number[] = [
    archetypeExtent(carrier, "x", ["left-wall"]).low,
    -archetypeExtent(carrier, "x", ["right-wall"]).high,
    archetypeExtent(carrier, "z", ["front-wall"]).low,
    -archetypeExtent(carrier, "z", ["rear-wall"]).high,
  ];
  const tops: number[] = [
    "left-wall",
    "right-wall",
    "front-wall",
    "rear-wall",
  ].map((wall: string): number => archetypeExtent(carrier, "y", [wall]).high);
  TestValidator.predicate(
    "shaft and foam cap leave positive clearance at all four walls",
    Math.max(radial, depth) < Math.min(...gaps) &&
      carrier.shapes().length === 5,
  );
  TestValidator.predicate(
    "every wall rises to the physical mouth, so the stored length is enclosed",
    tops.every((top: number): boolean => nclose(top, mouth, 1e-9)),
  );
  TestValidator.predicate(
    "the aligned root sites surround a clear motion interval",
    Quaternion.angle(seated.rotation, clear.rotation) <= 1e-9 &&
      AutoMovieArchetypeFrame.axis(seated, "y").y < -0.999 &&
      nclose(seated.translation.x, 0, 1e-12) &&
      nclose(seated.translation.z, 0, 1e-12) &&
      seated.translation.y - tip > floor &&
      seated.translation.y - tip < mouth &&
      seated.translation.y - guard > mouth &&
      clear.translation.y - tip > mouth,
  );
}

/** Verify native performance follows installed costume and prop mount contacts. */
function checkMount(
  carrier: ReturnType<typeof createStageFittedCarrier>,
  display: ReturnType<typeof createStageTwoHandedSwordProp>,
  costume: ReturnType<typeof assembleCostumeArmour>,
  body: IAutoMovieMotionHumanBody,
): void {
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const rest: IAutoMovieRigidTransform = {
    position: zero,
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };

  // Hang the carrier by its authored belt hook at the left hip's side: the
  // hook's site sits 0.18 m left of the hips joint and its +Y, which faces
  // the wearer, keeps the carrier's own orientation.
  const belt: IAutoMovieTransform = carrier.affordance("belt").frame;
  const carry: IAutoMovieMotionHumanProp = {
    ...HumanObject.prop(carrier.id, carrier, rest),
    worn: {
      subject: "actor",
      bone: "hips",
      offset: {
        ...rest,
        position: Vector3.subtract({ x: 0.18, y: 0, z: 0 }, belt.translation),
      },
    },
  };
  const mounted: IAutoMovieMotionHumanProp = {
    ...HumanObject.prop(display.id, display, rest),
    mounted: { prop: carrier.id, point: "seated", offset: rest },
  };
  const performance: HumanPerformance = new HumanPerformance({
    seed: "fitted-stage-display",
    performers: [
      {
        subject: "actor",
        body,
        at: zero,
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      mounted,
      carry,
      ...costume.map(
        ({ model, worn }): IAutoMovieMotionHumanProp => ({
          ...HumanObject.prop(model.id, model, rest),
          worn,
        }),
      ),
    ],
    composition: HumanChain.subject("actor").walk({
      to: { x: 0, y: 0, z: 1.5 },
    }).node,
  });
  const seat: IAutoMovieTransform = carrier.affordance("seated").frame;
  const end: number = performance.duration;
  const headReach: number = body.measure.stature - body.rest.get("head")!.y;
  for (const time of [0, end / 4, end / 2, (3 * end) / 4, end]) {
    const world: IAutoMovieRigidTransform = performance.prop(carrier.id, time);
    const joint: (bone: AutoMovieHumanoidBone) => IAutoMovieVector3 = jointsAt(
      performance,
      time,
    );
    const hook: IAutoMovieRigidTransform = place(world, belt);
    const inward: IAutoMovieVector3 = Vector3.subtract(
      joint("hips"),
      hook.position,
    );
    const facing: IAutoMovieVector3 = Quaternion.rotateVector(hook.rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    TestValidator.predicate(
      "the authored belt hook faces the wearer's pelvis",
      Vector3.dot(
        Vector3.normalize({ x: facing.x, y: 0, z: facing.z }),
        Vector3.normalize({ x: inward.x, y: 0, z: inward.z }),
      ) > 0.99,
    );
    for (const { model, worn } of costume) {
      const wear: IAutoMovieRigidTransform = place(
        performance.prop(model.id, time),
        model.affordance("wear").frame,
      );
      const up: IAutoMovieVector3 = Quaternion.rotateVector(wear.rotation, {
        x: 0,
        y: 1,
        z: 0,
      });
      if (worn.bone === "head") {
        const rise: IAutoMovieVector3 = Vector3.subtract(
          wear.position,
          joint("head"),
        );
        TestValidator.predicate(
          "the helmet centres midway between the head joint and the vertex",
          nclose(Vector3.length(rise), headReach / 2, 1e-3) &&
            Vector3.dot(Vector3.normalize(rise), up) > Math.cos(Math.PI / 180),
        );
        continue;
      }
      const [upper, lower]: [AutoMovieHumanoidBone, AutoMovieHumanoidBone] =
        worn.bone === "rightLowerArm"
          ? ["rightLowerArm", "rightHand"]
          : ["leftLowerLeg", "leftFoot"];
      const along: IAutoMovieVector3 = Vector3.subtract(
        joint(upper),
        joint(lower),
      );
      TestValidator.predicate(
        `the ${model.name} centres on its posed segment with +Y toward the upper joint`,
        Vector3.distance(
          wear.position,
          Vector3.scale(Vector3.add(joint(upper), joint(lower)), 0.5),
        ) <= 1e-3 &&
          Vector3.dot(Vector3.normalize(along), up) > Math.cos(Math.PI / 180),
      );
    }
    const child: IAutoMovieRigidTransform = performance.prop(display.id, time);
    const expected: IAutoMovieVector3 = Vector3.add(
      world.position,
      Quaternion.rotateVector(world.rotation, seat.translation),
    );
    TestValidator.predicate(
      "one separate display follows the wearer's carrier socket",
      Vector3.length(Vector3.subtract(expected, child.position)) <= 1e-8 &&
        Quaternion.angle(
          Quaternion.multiply(world.rotation, seat.rotation),
          child.rotation,
        ) <= 1e-6,
    );
  }
  TestValidator.predicate(
    "the carrier actually moves on the wearer",
    Vector3.length(
      Vector3.subtract(
        performance.prop(carrier.id, end).position,
        performance.prop(carrier.id, 0).position,
      ),
    ) > 0.25,
  );
}

/** A model-local frame carried by a displayed prop frame into the world. */
function place(
  frame: IAutoMovieRigidTransform,
  local: IAutoMovieTransform,
): IAutoMovieRigidTransform {
  return {
    position: Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, local.translation),
    ),
    rotation: Quaternion.multiply(frame.rotation, local.rotation),
  };
}

/** Read the performer's displayed joint origins at one film time. */
function jointsAt(
  performance: HumanPerformance,
  time: number,
): (bone: AutoMovieHumanoidBone) => IAutoMovieVector3 {
  const joints: ReturnType<HumanPerformance["bones"]> = performance.bones(
    "actor",
    time,
  );
  return (bone: AutoMovieHumanoidBone): IAutoMovieVector3 => {
    const found: IAutoMovieVector3 | undefined =
      joints.get(bone)?.worldPosition;
    if (found === undefined) throw new Error(`The actor has no ${bone} joint`);
    return found;
  };
}

/** Require a named producer admission failure. */
function refuses(label: string, axis: string, build: () => unknown): void {
  let result: unknown;
  try {
    build();
  } catch (error) {
    result = error;
  }
  TestValidator.predicate(
    label,
    result instanceof AutoMovieArchetypeRefusal && result.axis === axis,
  );
}

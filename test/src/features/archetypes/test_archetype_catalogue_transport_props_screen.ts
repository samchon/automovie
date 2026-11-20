import {
  type Archetype,
  ArchetypeFrame,
  ArchetypeRefusal,
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
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Independent inert silhouettes preserve old model frames and assemble into wearable props.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers the former six families and admits a separate digital carrier and a costume in a real performance.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public producers and live model props to check seeded silhouettes, enclosed vacant geometry, film-clock mounts and distinct wear attachments.
 * @evidence contracts/development/testing.md#independent-expectations Derives physical bounds from rendered collider parts, and compares world motion against the displayed carrier and the wearer's independently read bones.
 * @evidence contracts/development/testing.md#distinguishing-cases An invalid display shape, duplicate id and wrong wear slot are refused. Two scale endpoints distinguish a fitted channel from a fixed or filled receiver.
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
  } satisfies Record<createStageWeaponProp.Kind, Archetype>;
  for (const kind of createStageWeaponProp.KINDS)
    sameModel(kind, variants[kind], createStageWeaponProp({ id, kind }, seed));
  const swords = {
    foil: createStageFencingProp({ id, kind: "foil" }, seed),
    epee: createStageFencingProp({ id, kind: "epee" }, seed),
    sabre: createStageFencingProp({ id, kind: "sabre" }, seed),
    shinai: createStagePracticeSwordProp({ id }, seed),
    longsword: createStageTwoHandedSwordProp({ id }, seed),
  } satisfies Record<createStageBladeProp.Kind, Archetype>;
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
  } satisfies Record<createHolster.Kind, Archetype>;
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
  } satisfies Record<createProjectile.Kind, Archetype>;
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
    createStageFittedCarrier({ display: swords.foil }),
  );
  refuses("duplicate display and carrier identity", "display", () =>
    createStageFittedCarrier({ display: swords.longsword, id }),
  );
  refuses("head slot rejects a different wearable", "slot", () =>
    assembleCostumeArmour({
      subject: "actor",
      pieces: { head: costumes.gauntlet },
    }),
  );
  refuses("two slots cannot duplicate one visible model", "id", () =>
    assembleCostumeArmour({
      subject: "actor",
      pieces: {
        leftHand: costumes.gauntlet,
        rightHand: costumes.gauntlet,
      },
    }),
  );

  const carrier: ReturnType<typeof createStageFittedCarrier> =
    createStageFittedCarrier({ display: swords.longsword });
  const costume: ReturnType<typeof assembleCostumeArmour> =
    assembleCostumeArmour({
      subject: "actor",
      pieces: { head: costumes.openHelmet, rightLowerArm: costumes.vambrace },
    });
  checkMount(carrier, swords.longsword, costume);
}

/** Compare stable model bytes and explicit draw provenance on the two authoring paths. */
function sameModel(
  label: string,
  canonical: Archetype,
  legacy: Archetype,
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
  const tip: number = archetypeExtent(display, "y", ["endCap"]).high;
  const guard: number = archetypeExtent(display, "y", ["guard"]).high;
  const wallGap: number = archetypeExtent(carrier, "x", ["left-wall"]).low;
  const foreGap: number = archetypeExtent(carrier, "z", ["front-wall"]).low;
  TestValidator.predicate(
    "shaft and foam cap leave positive clearance at both walls",
    radial < Math.min(wallGap, foreGap) && carrier.shapes().length === 5,
  );
  TestValidator.predicate(
    "the aligned root sites surround a clear motion interval",
    Quaternion.angle(seated.rotation, clear.rotation) <= 1e-9 &&
      ArchetypeFrame.axis(seated, "y").y < -0.999 &&
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
): void {
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const rest: IAutoMovieRigidTransform = {
    position: zero,
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const carry: IAutoMovieMotionHumanProp = {
    ...HumanObject.prop(carrier.id, carrier, rest),
    worn: {
      subject: "actor",
      bone: "hips",
      offset: { ...rest, position: { x: -0.28, y: -0.3, z: 0.05 } },
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
        body: motionHumanBody("f-average"),
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
  for (const time of [end, 0, end / 2, end]) {
    const world: IAutoMovieRigidTransform = performance.prop(carrier.id, time);
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
    for (const { model, worn } of costume)
      TestValidator.predicate(
        "costume remains on its own displayed bone",
        Vector3.length(
          Vector3.subtract(
            performance.prop(model.id, time).position,
            performance.bones("actor", time).get(worn.bone)!.worldPosition,
          ),
        ) <= 1e-8,
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
    result instanceof ArchetypeRefusal && result.axis === axis,
  );
}

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeRefusal,
  assembleCostumeArmour,
  createArmour,
  createLongGun,
  createStageBallProp,
  createStageBayonet,
  createStageBladeCarrier,
  createStageBladeProp,
  createStageCartridgeProp,
  createStageCasing,
  createStageFencingProp,
  createStageFittedCarrier,
  createStageGrenadeProp,
  createStageHandBowProp,
  createStageHolster,
  createStagePercussionRifle,
  createStagePouch,
  createStagePracticeSwordProp,
  createStageQuiver,
  createStageRoundProp,
  createStageShaftToken,
  createStageStockBowProp,
  createStageStoneProp,
  createStageTwoHandedSwordProp,
  createStageWeaponProp,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  physicalShapePairDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanColliders } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** One held cell: a stage prop and the contact the right hand takes it by. */
interface IHoldCase {
  /** The cell's name in the record. */
  label: string;

  /** The inert stage model. */
  model: AutoMovieArchetype;

  /** The contact the hand takes. */
  handle: string;
}

/** One worn cell: a carrier and the bone it rides. */
interface IWornCase {
  /** The cell's name in the record. */
  label: string;

  /** The worn prop with its binding. */
  prop: IAutoMovieMotionHumanProp;
}

/** One placed collider group, as the collider reader returns it. */
type BodyPart = ReturnType<
  ReturnType<typeof HumanColliders.preparePlaced>
>[number];

/** The two surveyed casts. */
type Cast = "f-small" | "m-average";

/** The actual hand contact bound, metres: the catalogue matrix's 10 mm. */
const CONTACT: number = 0.01;

/** Rigid hold allowance, metres: the 1 mm mount bound. */
const RIGID: number = 0.001;

/** Rigid hold allowance, radians: one degree. */
const TURN: number = Math.PI / 180;

/** A held prop's least clearance from the partner's body, metres: a fist's width of air on a medium two-shot. */
const PAIRED: number = 0.05;

/** The rest frame of a binding. */
const REST: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

/**
 * Inert held and worn stage props across two casts: actual hand contact,
 * steady holds and worn placement, cue order, paired clearance, a worn to
 * held transfer, and named binding, reach and fit refusals.
 *
 * Scenarios:
 * 1. Each held variant is picked up by its own contact and held still on both
 *    casts. The right hand's colliders stay within 10 mm of the prop, the
 *    contact keeps one frame in the hand, and the prop stays put until the
 *    pickup's grip.
 * 2. Two performers 1.3 m apart each hold a two-handed display; neither prop
 *    comes within 50 mm of the partner's body.
 * 3. The carriers and a costume ride their bones through a 1 m walk.
 * 4. A slung percussion rifle rides the hips until the right hand takes its
 *    grip, then rides the hand.
 * 5. A missing handle and an out-of-reach prop are refused with named
 *    refusals; a foil in the fitted carrier and a gauntlet on the head are
 *    impossible fits.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names every cell family, the casts, the measured reads and the refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Runs public pickup, stand and walk compositions through HumanPerformance and reads the displayed prop frames, posed bones and posed colliders.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm contact and the 1 mm and 1 degree rigid bounds are the catalogue matrix's; the 50 mm paired clearance is a fist's width of air on a two-shot.
 * @evidence contracts/development/testing.md#distinguishing-cases Every held variant on two casts, the worn carriers, one transfer between custody states, and four refused cells of three causes.
 * @evidence contracts/development/testing.md#execution-ownership Runs in memory on the scenario runner with prepared polygon bodies and the public producers and readers.
 */
export function test_motion_stage_fight_stage_prop_matrix(): void {
  const failures: string[] = [];
  for (const cast of [
    "f-small",
    "m-average",
  ] as const satisfies readonly Cast[]) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(cast);
    const right: ReturnType<typeof HumanColliders.preparePlaced> = colliders(
      body,
      /^right(Hand|Thumb|Index|Middle|Ring|Little)/,
    );
    for (const cell of holds()) {
      const label: string = `${cast} ${cell.label}`;
      try {
        held(body, cell, right, failures, label);
      } catch (error: unknown) {
        failures.push(`${label}: ${String(error)}`);
      }
    }
    guard(failures, ` worn`, (): void => worn(body, cast, failures));
    guard(failures, ` transfer`, (): void => transfer(body, cast, failures));
  }
  guard(failures, "paired", (): void => paired(failures));
  guard(failures, "refusals", (): void => refusals(failures));
  TestValidator.equals(
    `stage prop actor matrix: ${failures.join(" | ")}`,
    failures,
    [],
  );
}

/** Run one cell family, recording an unexpected error as its failure. */
function guard(failures: string[], label: string, run: () => void): void {
  try {
    run();
  } catch (error: unknown) {
    failures.push(`${label}: ${String(error)}`);
  }
}

/** The held variants and the contact each is taken by. */
function holds(): IHoldCase[] {
  const cases: IHoldCase[] = [];
  for (const kind of createStageWeaponProp.KINDS)
    cases.push({
      label: kind,
      model: createStageWeaponProp({ kind, id: "prop" }),
      handle: kind.endsWith("Blade") ? "grip-lower" : "grip",
    });
  for (const kind of createStageFencingProp.KINDS)
    cases.push({
      label: kind,
      model: createStageFencingProp({ kind, id: "prop" }),
      handle: "grip",
    });
  for (const kind of createStageHandBowProp.KINDS)
    cases.push({
      label: kind,
      model: createStageHandBowProp({ kind, id: "prop" }),
      handle: "grip",
    });
  for (const kind of createStageShaftToken.KINDS)
    cases.push({
      label: kind,
      model: createStageShaftToken({ kind, id: "prop" }),
      handle: "shaft",
    });
  cases.push(
    {
      label: "shinai",
      model: createStagePracticeSwordProp({ id: "prop" }),
      handle: "grip",
    },
    {
      label: "longsword",
      model: createStageTwoHandedSwordProp({ id: "prop" }),
      handle: "grip",
    },
    {
      label: "crossbow",
      model: createStageStockBowProp({ id: "prop" }),
      handle: "grip",
    },
    {
      label: "ball",
      model: createStageBallProp({ id: "prop" }),
      handle: "body",
    },
    {
      label: "roundShot",
      model: createStageRoundProp({ id: "prop" }),
      handle: "body",
    },
    {
      label: "grenade",
      model: createStageGrenadeProp({ id: "prop" }),
      handle: "body",
    },
    {
      label: "stone",
      model: createStageStoneProp({ id: "prop" }),
      handle: "body",
    },
    {
      label: "cartridge",
      model: createStageCartridgeProp({ id: "prop" }),
      handle: "grip",
    },
    {
      label: "casing",
      model: createStageCasing({ id: "prop" }),
      handle: "grip",
    },
    {
      label: "bayonet",
      model: createStageBayonet({
        gun: createLongGun({ kind: "musket" }),
        id: "prop",
      }),
      handle: "handle",
    },
  );
  return cases;
}

/** Pick one variant up by its contact, hold it still and read the hold. */
function held(
  body: IAutoMovieMotionHumanBody,
  cell: IHoldCase,
  right: ReturnType<typeof HumanColliders.preparePlaced>,
  failures: string[],
  label: string,
): void {
  const contact: IAutoMovieTransform = cell.model.affordance(cell.handle).frame;
  const at: number = Math.max(0, 0.95 - contact.translation.y);
  const prop: IAutoMovieMotionHumanProp = HumanObject.prop("prop", cell.model, {
    at: { x: -0.25, y: at, z: 0.35 },
    yaw: 0,
  });
  const performance: HumanPerformance = new HumanPerformance({
    seed: "stage-prop-matrix",
    performers: [performer("actor", body, 0)],
    props: [prop],
    composition: HumanChain.subject("actor")
      .pickUp({ prop: "prop", handle: cell.handle, hand: "right" })
      .stand({ hold: 0.4, sway: 0 }).node,
  });
  const [pick, hold]: readonly IAutoMovieMotionHumanSegment[] =
    performance.segments("actor");
  if (pick === undefined || hold === undefined)
    throw new Error("the pickup and hold segments are missing");
  if (!(pick.end <= hold.start))
    failures.push(`${label}: the hold starts before the pickup ends`);
  if (
    Vector3.distance(
      performance.prop("prop", 0).position,
      prop.frame.position,
    ) > 1e-9
  )
    failures.push(`${label}: the prop moved before the pickup`);

  const times: number[] = [hold.start, (hold.start + hold.end) / 2, hold.end];
  const frames: IAutoMovieRigidTransform[] = times.map(
    (time: number): IAutoMovieRigidTransform =>
      inFrame(
        boneFrame(performance, "actor", "rightHand", time),
        place(performance.prop("prop", time), contact),
      ),
  );
  if (
    !frames.every(
      (frame: IAutoMovieRigidTransform): boolean =>
        Vector3.distance(frame.position, frames[0]!.position) <= RIGID &&
        Quaternion.angle(frame.rotation, frames[0]!.rotation) <= TURN,
    )
  )
    failures.push(`${label}: the ${cell.handle} moves in the hand`);
  const gap: number = nearest(
    right(performance.bones("actor", times[1]!)),
    cell.model.shapes(),
    performance.prop("prop", times[1]!),
  );
  if (!(gap <= CONTACT))
    failures.push(`${label}: the hand is ${gap} m from the prop`);
}

/** Two performers each hold a longsword; neither blade reaches the partner. */
function paired(failures: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const whole: ReturnType<typeof HumanColliders.preparePlaced> = colliders(
    body,
    /./,
  );
  const swords: AutoMovieArchetype[] = ["a", "b"].map(
    (id: string): AutoMovieArchetype => createStageTwoHandedSwordProp({ id }),
  );
  const performance: HumanPerformance = new HumanPerformance({
    seed: "stage-prop-pair",
    performers: [performer("a", body, 0), performer("b", body, 1.3)],
    props: swords.map(
      (model: AutoMovieArchetype, i: number): IAutoMovieMotionHumanProp =>
        HumanObject.prop(model.id, model, {
          at: { x: -0.25 + 1.3 * i, y: 0.6, z: 0.35 },
          yaw: 0,
        }),
    ),
    composition: {
      kind: "parallel",
      parts: ["a", "b"].map(
        (who: string): IAutoMovieComposition =>
          HumanChain.subject(who)
            .pickUp({ prop: who, handle: "grip", hand: "right" })
            .stand({ hold: 0.4, sway: 0 }).node,
      ),
    },
  });
  for (const [holder, partner] of [
    ["a", "b"],
    ["b", "a"],
  ] as const) {
    const end: number = performance.duration;
    const gap: number = nearest(
      whole(performance.bones(partner, end)),
      swords
        .find((model: AutoMovieArchetype): boolean => model.id === holder)!
        .shapes(),
      performance.prop(holder, end),
    );
    if (!(gap >= PAIRED))
      failures.push(`paired: ${holder}'s blade is ${gap} m from ${partner}`);
  }
}

/** Carriers and a costume ride their bones through a 1 m walk. */
function worn(
  body: IAutoMovieMotionHumanBody,
  cast: Cast,
  failures: string[],
): void {
  const at: (x: number, y: number, z: number) => IAutoMovieRigidTransform = (
    x: number,
    y: number,
    z: number,
  ): IAutoMovieRigidTransform => ({
    ...REST,
    position: { x, y, z },
  });
  const wear: (
    label: string,
    model: AutoMovieArchetype,
    bone: AutoMovieHumanoidBone,
    offset: IAutoMovieRigidTransform,
  ) => IWornCase = (
    label: string,
    model: AutoMovieArchetype,
    bone: AutoMovieHumanoidBone,
    offset: IAutoMovieRigidTransform,
  ): IWornCase => ({
    label,
    prop: {
      ...HumanObject.prop(model.id, model, REST),
      worn: { subject: "actor", bone, offset },
    },
  });
  const cases: IWornCase[] = [
    wear(
      "holster",
      createStageHolster({ id: "holster" }),
      "hips",
      at(-0.2, -0.05, 0),
    ),
    wear(
      "sheath",
      createStageBladeCarrier({ kind: "sheath", id: "sheath" }),
      "hips",
      at(0.2, -0.05, 0),
    ),
    wear(
      "quiver",
      createStageQuiver({ id: "quiver" }),
      "chest",
      at(0.1, 0, -0.15),
    ),
    wear(
      "pouch",
      createStagePouch({ id: "pouch" }),
      "hips",
      at(0, -0.05, 0.12),
    ),
    wear(
      "fitted carrier",
      createStageFittedCarrier({
        display: createStageTwoHandedSwordProp({ id: "display" }),
      }),
      "hips",
      at(-0.25, -0.3, 0.05),
    ),
    ...assembleCostumeArmour({
      subject: "actor",
      body,
      pieces: {
        head: createArmour({ kind: "openHelmet", id: "helmet" }),
        rightLowerArm: createArmour({ kind: "vambrace", id: "vambrace" }),
      },
    }).map(
      ({ model, worn: binding }): IWornCase => ({
        label: model.name ?? model.id,
        prop: { ...HumanObject.prop(model.id, model, REST), worn: binding },
      }),
    ),
  ];
  const performance: HumanPerformance = new HumanPerformance({
    seed: "stage-prop-worn",
    performers: [performer("actor", body, 0)],
    props: cases.map((cell: IWornCase): IAutoMovieMotionHumanProp => cell.prop),
    composition: HumanChain.subject("actor").walk({ to: { x: 0, y: 0, z: 1 } })
      .node,
  });
  for (const cell of cases)
    for (const time of [0, performance.duration / 2, performance.duration]) {
      const expected: IAutoMovieRigidTransform = compose(
        boneFrame(performance, "actor", cell.prop.worn!.bone, time),
        cell.prop.worn!.offset,
      );
      const shown: IAutoMovieRigidTransform = performance.prop(
        cell.prop.subject,
        time,
      );
      if (
        Vector3.distance(expected.position, shown.position) > 1e-6 ||
        Quaternion.angle(expected.rotation, shown.rotation) > 1e-6
      )
        failures.push(
          `${cast} ${cell.label}: leaves its ${cell.prop.worn!.bone} at ${time} s`,
        );
    }
}

/** A slung rifle rides the hips, then the right hand once it takes the grip. */
function transfer(
  body: IAutoMovieMotionHumanBody,
  cast: Cast,
  failures: string[],
): void {
  const rifle: ReturnType<typeof createStagePercussionRifle> =
    createStagePercussionRifle({ id: "rifle" });
  const offset: IAutoMovieRigidTransform = {
    position: { x: -0.22, y: -0.35, z: 0.2 },
    rotation: { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
  };
  const performance: HumanPerformance = new HumanPerformance({
    seed: "stage-prop-transfer",
    performers: [performer("actor", body, 0)],
    props: [
      {
        ...HumanObject.prop("rifle", rifle, REST),
        worn: { subject: "actor", bone: "hips", offset },
      },
    ],
    composition: HumanChain.subject("actor")
      .stand({ hold: 0.3, sway: 0 })
      .pickUp({ prop: "rifle", handle: "grip", hand: "right" })
      .stand({ hold: 0.4, sway: 0 }).node,
  });
  const [before, , after]: readonly IAutoMovieMotionHumanSegment[] =
    performance.segments("actor");
  if (before === undefined || after === undefined) {
    failures.push(`${cast} rifle: the transfer segments are missing`);
    return;
  }
  const slung: IAutoMovieRigidTransform = compose(
    boneFrame(performance, "actor", "hips", before.end),
    offset,
  );
  if (
    Vector3.distance(
      slung.position,
      performance.prop("rifle", before.end).position,
    ) > 1e-6
  )
    failures.push(`${cast} rifle: not on its sling before the pickup`);
  const grip: IAutoMovieTransform = rifle.affordance("grip").frame;
  const frames: IAutoMovieRigidTransform[] = [after.start, after.end].map(
    (time: number): IAutoMovieRigidTransform =>
      inFrame(
        boneFrame(performance, "actor", "rightHand", time),
        place(performance.prop("rifle", time), grip),
      ),
  );
  if (
    Vector3.distance(frames[0]!.position, frames[1]!.position) > RIGID ||
    Quaternion.angle(frames[0]!.rotation, frames[1]!.rotation) > TURN
  )
    failures.push(
      `${cast} rifle: the grip moves in the hand after the transfer`,
    );
}

/** Binding, reach and fit refusals carry their named causes. */
function refusals(failures: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const model: AutoMovieArchetype = createStageTwoHandedSwordProp({
    id: "prop",
  });
  for (const [label, handle, z, kind] of [
    ["a missing handle", "pommel", 0.35, "affordance"],
    ["an out-of-reach prop", "grip", 2.5, "reach"],
  ] as const) {
    try {
      new HumanPerformance({
        seed: "stage-prop-refusal",
        performers: [performer("actor", body, 0)],
        props: [
          HumanObject.prop("prop", model, {
            at: { x: -0.25, y: 0.6, z },
            yaw: 0,
          }),
        ],
        composition: HumanChain.subject("actor").pickUp({
          prop: "prop",
          handle,
          hand: "right",
        }).node,
      }).segments("actor");
      failures.push(`refusal: ${label} was admitted`);
    } catch (error: unknown) {
      if (!(error instanceof HumanRefusal && error.kind === kind))
        failures.push(`refusal: ${label} gave ${String(error)}`);
    }
  }
  for (const [label, build, axis] of [
    [
      "a foil in the fitted carrier",
      (): unknown =>
        createStageFittedCarrier({
          display: createStageBladeProp({ kind: "foil" }),
        }),
      "display",
    ],
    [
      "a gauntlet on the head",
      (): unknown =>
        assembleCostumeArmour({
          subject: "actor",
          body,
          pieces: { head: createArmour({ kind: "gauntlet", id: "glove" }) },
        }),
      "slot",
    ],
  ] as const) {
    try {
      build();
      failures.push(`fit: ${label} was admitted`);
    } catch (error: unknown) {
      if (!(error instanceof AutoMovieArchetypeRefusal && error.axis === axis))
        failures.push(`fit: ${label} gave ${String(error)}`);
    }
  }
}

/** A trained performer at a lateral place, facing `+Z`. */
function performer(
  subject: string,
  body: IAutoMovieMotionHumanBody,
  x: number,
): ConstructorParameters<typeof HumanPerformance>[0]["performers"][number] {
  return {
    subject,
    body,
    at: { x, y: 0, z: 0 },
    yaw: 0,
    proficiency: { level: "trained" },
  };
}

/** The body's colliders on the bones a pattern selects. */
function colliders(
  body: IAutoMovieMotionHumanBody,
  pattern: RegExp,
): ReturnType<typeof HumanColliders.preparePlaced> {
  return HumanColliders.preparePlaced(
    body,
    new Set(
      [...HumanColliders.bones(body)].filter(
        (bone: AutoMovieHumanoidBone): boolean => pattern.test(bone),
      ),
    ),
  );
}

/** The least distance between placed body colliders and a placed prop's colliders, metres. */
function nearest(
  parts: readonly BodyPart[],
  shapes: readonly IAutoMoviePhysicalShape[],
  frame: IAutoMovieRigidTransform,
): number {
  let least: number = Infinity;
  for (const part of parts)
    for (const own of part.shapes)
      for (const shape of shapes)
        least = Math.min(
          least,
          physicalShapePairDistance(part.pose, own, frame, shape),
        );
  return least;
}

/** A posed bone's world frame. */
function boneFrame(
  performance: HumanPerformance,
  subject: string,
  bone: AutoMovieHumanoidBone,
  time: number,
): IAutoMovieRigidTransform {
  const read: NonNullable<
    ReturnType<ReturnType<HumanPerformance["bones"]>["get"]>
  > = performance.bones(subject, time).get(bone)!;
  return { position: read.worldPosition, rotation: read.worldRotation };
}

/** A child frame given in a parent frame, carried into the world. */
function compose(
  parent: IAutoMovieRigidTransform,
  child: IAutoMovieRigidTransform,
): IAutoMovieRigidTransform {
  return {
    position: Vector3.add(
      parent.position,
      Quaternion.rotateVector(parent.rotation, child.position),
    ),
    rotation: Quaternion.multiply(parent.rotation, child.rotation),
  };
}

/** A model-local frame carried by a displayed prop frame into the world. */
function place(
  frame: IAutoMovieRigidTransform,
  local: IAutoMovieTransform,
): IAutoMovieRigidTransform {
  return compose(frame, {
    position: local.translation,
    rotation: local.rotation,
  });
}

/** Express a world frame in another world frame. */
function inFrame(
  parent: IAutoMovieRigidTransform,
  child: IAutoMovieRigidTransform,
): IAutoMovieRigidTransform {
  const inverse: IAutoMovieRigidTransform["rotation"] = Quaternion.inverse(
    parent.rotation,
  );
  return {
    position: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(child.position, parent.position),
    ),
    rotation: Quaternion.multiply(inverse, child.rotation),
  };
}

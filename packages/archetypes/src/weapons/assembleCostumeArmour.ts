import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../core";
import type { AutoMovieArchetypeArmour } from "./AutoMovieArchetypeArmour";

/** Every wearer socket a costume piece can occupy, in declaration order. */
const SLOTS: readonly assembleCostumeArmour.Slot[] = [
  "head",
  "chest",
  "leftHand",
  "rightHand",
  "leftLowerArm",
  "rightLowerArm",
  "leftLowerLeg",
  "rightLowerLeg",
];

/** The piece names each existing wearer socket can carry. */
const PIECES: Readonly<
  Record<assembleCostumeArmour.Slot, readonly AutoMovieArchetypeArmour.Kind[]>
> = {
  head: ["openHelmet", "closedHelmet", "brimmedHelmet"],
  chest: ["cuirass", "mail"],
  leftHand: ["gauntlet"],
  rightHand: ["gauntlet"],
  leftLowerArm: ["vambrace"],
  rightLowerArm: ["vambrace"],
  leftLowerLeg: ["greave"],
  rightLowerLeg: ["greave"],
};

/** The rest body's up direction, world. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The rest body's facing, world: the canonical body faces `+Z`. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/**
 * Bind separate digital costume pieces to one performer's named bones.
 *
 * Each piece remains its own model. Its `wear` socket, the centre of the body
 * part it covers, is placed on that part's centre on the wearer's T-pose rest
 * with `+Y` up the segment and `+Z` toward the body's front. The binding is
 * that placement expressed in the slot bone's rest frame, so the piece rides
 * the bone through every pose:
 *
 * - A forearm or shank piece centres between the slot joint and the next joint
 *   down the limb (elbow and wrist, knee and ankle), `+Y` toward the upper
 *   joint;
 * - A gauntlet centres half the measured hand length from the wrist toward the
 *   middle finger's base, `+Y` toward the wrist;
 * - A helmet centres midway between the head joint and the vertex at stature;
 * - A cuirass or mail shirt hangs from the shoulder height, its centre half the
 *   piece's own height below it, over the chest joint.
 *
 * @param params The performer id and body, and up to one distinct costume model
 *   per slot.
 * @returns The models and their initial worn bindings for the scene.
 * @throws {AutoMovieArchetypeRefusal} For a mismatched slot, reused model id,
 *   missing piece, a body without the slot's joints or a trunk piece without
 *   its height.
 */
export function assembleCostumeArmour(
  params: assembleCostumeArmour.IParams,
): readonly assembleCostumeArmour.IPiece[] {
  const slots: readonly assembleCostumeArmour.Slot[] = SLOTS;
  if (params.subject.trim().length === 0)
    throw refuse(
      "subject",
      params.subject,
      "name the performer who wears the costume",
    );
  const entries: [string, assembleCostumeArmour.Model][] = Object.entries(
    params.pieces,
  );
  if (entries.length === 0)
    throw refuse("pieces", "empty", "supply at least one costume piece");

  const ids: Set<string> = new Set();
  return entries.map(([name, model]): assembleCostumeArmour.IPiece => {
    const named: string = ArchetypeDraw.choice(
      "costumeArmour",
      "slot",
      name,
      slots,
    );
    const bone: assembleCostumeArmour.Slot = slots.find(
      (slot: assembleCostumeArmour.Slot): boolean => slot === named,
    )!;
    if (
      model.archetype !== "armour" ||
      !PIECES[bone].some(
        (kind: AutoMovieArchetypeArmour.Kind): boolean => kind === model.name,
      )
    )
      throw refuse(
        "slot",
        bone,
        "supply a generated costume piece for this bone",
      );
    if (ids.has(model.id) || model.id === params.subject)
      throw refuse(
        "id",
        model.id,
        "give every piece and its performer a distinct scene id",
      );
    ids.add(model.id);

    const wear: IAutoMovieAffordance = model.affordance("wear");
    const covered: IAutoMovieTransform = segment(bone, params.body, model);
    const slotFrame: IAutoMovieTransform = restFrame(params.body, bone);
    return {
      model,
      worn: {
        subject: params.subject,
        bone,
        offset: rigid(
          AutoMovieArchetypeFrame.compose(
            AutoMovieArchetypeFrame.compose(invert(slotFrame), covered),
            invert(wear.frame),
          ),
        ),
      },
    };
  });
}

/** Costume piece selection and the binding consumed by a scene. */
export namespace assembleCostumeArmour {
  /** Bones supported by the existing head, chest, hand and limb costume pieces. */
  export type Slot =
    | "head"
    | "chest"
    | "leftHand"
    | "rightHand"
    | "leftLowerArm"
    | "rightLowerArm"
    | "leftLowerLeg"
    | "rightLowerLeg";

  /** The shared measured costume model, retaining its wear socket. */
  export type Model = AutoMovieArchetype<
    AutoMovieArchetypeArmour.Affordance,
    AutoMovieArchetypeArmour.Dimension
  >;

  /**
   * The wearer's T-pose rest joints in canonical world metres, its bone records
   * and its anthropometric measure.
   */
  export type IWearer = Pick<
    IAutoMovieMotionHumanBody,
    "rest" | "bones" | "measure"
  >;

  /** A selection of separate models and their wearer. */
  export interface IParams {
    /** The performer's scene identity. */
    subject: string;

    /** The performer's body, read at its rest to find each covered segment. */
    body: IWearer;

    /** At most one independent and anatomically corresponding model per bone. */
    pieces: Readonly<Partial<Record<Slot, Model>>>;
  }

  /** One source model and its initial bone binding. */
  export interface IPiece {
    /** The original source model with its existing id and geometry. */
    model: Model;

    /** The resolved binding for the performance and renderer. */
    worn: IAutoMovieMotionHumanProp.IWorn;
  }
}

/**
 * The covered segment's centre frame on the rest body, world: `+Y` up the
 * segment, `+Z` toward the front.
 */
function segment(
  slot: assembleCostumeArmour.Slot,
  body: assembleCostumeArmour.IWearer,
  model: assembleCostumeArmour.Model,
): IAutoMovieTransform {
  if (slot === "head") {
    const joint: IAutoMovieVector3 = restAt(body, "head");
    const reach: number = body.measure.stature - joint.y;
    return frameAt(Vector3.add(joint, Vector3.scale(UP, reach / 2)), UP);
  }
  if (slot === "chest") {
    const joint: IAutoMovieVector3 = restAt(body, "chest");
    const height: number | undefined = model.dimensions.height;
    if (height === undefined || !(height > 0))
      throw refuse("height", model.id, "use a trunk piece with its height");
    return frameAt(
      { x: joint.x, y: body.measure.shoulderHeight - height / 2, z: joint.z },
      UP,
    );
  }
  const side: AutoMovieHumanSide = slot.startsWith("left") ? "left" : "right";
  if (slot === "leftHand" || slot === "rightHand") {
    const wrist: IAutoMovieVector3 = restAt(body, slot);
    const along: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(restAt(body, `${side}MiddleProximal`), wrist),
    );
    return frameAt(
      Vector3.add(wrist, Vector3.scale(along, body.measure.hand / 2)),
      Vector3.scale(along, -1),
    );
  }
  const upper: IAutoMovieVector3 = restAt(body, slot);
  const lower: IAutoMovieVector3 = restAt(
    body,
    slot.endsWith("Arm") ? `${side}Hand` : `${side}Foot`,
  );
  return frameAt(
    Vector3.scale(Vector3.add(upper, lower), 0.5),
    Vector3.subtract(upper, lower),
  );
}

/**
 * A frame at a point with `+Y` along `up` and `+Z` as near the body's front as
 * `up` allows.
 */
function frameAt(
  at: IAutoMovieVector3,
  up: IAutoMovieVector3,
): IAutoMovieTransform {
  return AutoMovieArchetypeFrame.facing(at, up, Vector3.cross(up, FORWARD));
}

/**
 * A bone's rest frame in the world: its rest joint and its rotation chained
 * from the root.
 */
function restFrame(
  body: assembleCostumeArmour.IWearer,
  bone: AutoMovieHumanoidBone,
): IAutoMovieTransform {
  const chain: IAutoMovieQuaternion[] = [];
  for (let current: AutoMovieHumanoidBone | null = bone; current !== null; ) {
    const record: IAutoMovieBone | undefined = body.bones.get(current);
    if (record === undefined) throw missing(current);
    chain.push(record.rest.rotation);
    current = record.parent;
  }
  const rotation: IAutoMovieQuaternion = chain.reduceRight(
    (
      world: IAutoMovieQuaternion,
      local: IAutoMovieQuaternion,
    ): IAutoMovieQuaternion => Quaternion.multiply(world, local),
    Quaternion.identity(),
  );
  return {
    translation: restAt(body, bone),
    rotation: Quaternion.normalize(rotation),
    scale: { ...AutoMovieArchetypeFrame.UNIT },
  };
}

/** A joint's rest position, or the refusal naming the missing joint. */
function restAt(
  body: assembleCostumeArmour.IWearer,
  bone: AutoMovieHumanoidBone,
): IAutoMovieVector3 {
  const at: IAutoMovieVector3 | undefined = body.rest.get(bone);
  if (at === undefined) throw missing(bone);
  return at;
}

/** The inverse of a unit-scale frame. */
function invert(frame: IAutoMovieTransform): IAutoMovieTransform {
  const rotation: IAutoMovieQuaternion = Quaternion.inverse(frame.rotation);
  return {
    translation: Quaternion.rotateVector(
      rotation,
      Vector3.scale(frame.translation, -1),
    ),
    rotation,
    scale: { ...AutoMovieArchetypeFrame.UNIT },
  };
}

/** A unit-scale frame as the rigid offset the worn record takes. */
function rigid(frame: IAutoMovieTransform): IAutoMovieRigidTransform {
  return { position: frame.translation, rotation: frame.rotation };
}

/** Refuse a body that lacks a joint the slot's segment reads. */
function missing(bone: AutoMovieHumanoidBone): AutoMovieArchetypeRefusal {
  return refuse("body", bone, "supply the wearer's canonical rigged body");
}

/** Produce the assembly refusal with its offending option. */
function refuse(
  axis: string,
  value: unknown,
  fix: string,
): AutoMovieArchetypeRefusal {
  return new AutoMovieArchetypeRefusal({
    kind: "parameter",
    archetype: "costumeArmour",
    axis,
    value,
    feasible: null,
    reason: "the selected costume pieces cannot be assembled for this wearer",
    fix,
  });
}

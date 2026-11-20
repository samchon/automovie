import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { Archetype, ArchetypeDraw, ArchetypeRefusal } from "../core";
import type { createArmour } from "./createArmour";

/** The piece names each existing wearer socket can carry. */
const PIECES: Readonly<
  Record<assembleCostumeArmour.Slot, readonly createArmour.Kind[]>
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

/**
 * Bind separate digital costume pieces to one performer's named bones.
 *
 * Each piece remains its own model. The inverse of its wear socket places
 * the model in the bone frame so the two centres coincide.
 *
 * @param params The performer id and up to one distinct costume model per slot.
 * @returns The models and their initial worn bindings for the scene.
 * @throws {ArchetypeRefusal} For a mismatched slot, reused model id or missing piece.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the supported assembly owners and inverse wear frames.
 * @evidence contracts/development/implementation.md#principled-implementation Maps a closed costume slot to its humanoid bone and composes the piece through its actual model-local wear socket.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit one piece per named slot, preserve its id, and compute its initial worn binding.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No detached layer, duplicate geometry, or baked actor mesh. Mismatched or reused pieces refuse.
 * @evidence contracts/development/implementation.md#efficient-algorithms Processes at most eight pieces with one lookup per piece.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses canonical wear contacts and the shared prop binding contract.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned bindings reference only the caller's models and independently owned offset records.
 */
export function assembleCostumeArmour(
  params: assembleCostumeArmour.IParams,
): readonly assembleCostumeArmour.IPiece[] {
  const slots: assembleCostumeArmour.Slot[] = Object.keys(
    PIECES,
  ) as assembleCostumeArmour.Slot[];
  if (typeof params.subject !== "string" || params.subject.trim().length === 0)
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
    const bone: assembleCostumeArmour.Slot = ArchetypeDraw.choice(
      "costumeArmour",
      "slot",
      name as assembleCostumeArmour.Slot,
      slots,
    );
    if (
      !(model instanceof Archetype) ||
      model.archetype !== "armour" ||
      !PIECES[bone].some(
        (kind: createArmour.Kind): boolean => kind === model.name,
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

    const contact: IAutoMovieAffordance = model.affordance("wear");
    const rotation: IAutoMovieQuaternion = Quaternion.inverse(
      contact.frame.rotation,
    );
    return {
      model,
      worn: {
        subject: params.subject,
        bone,
        offset: {
          position: Quaternion.rotateVector(
            rotation,
            Vector3.scale(contact.frame.translation, -1),
          ),
          rotation,
        },
      },
    };
  });
}

/**
 * Costume piece selection and the binding consumed by a scene.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the scene identity, accepted costume slots and separate worn models.
 * @evidence contracts/development/design.md#principled-representation Uses closed costume slots and canonical motion-prop worn records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Each slot identifies one existing renderable model and one bone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Duplicate ids and incompatible types are refused during assembly.
 */
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
  export type Model = Archetype<
    createArmour.Affordance,
    createArmour.Dimension
  >;

  /** A selection of separate models and their wearer. */
  export interface IParams {
    /** The performer's scene identity. */
    subject: string;
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

/** Produce the assembly refusal with its offending option. */
function refuse(axis: string, value: unknown, fix: string): ArchetypeRefusal {
  return new ArchetypeRefusal({
    kind: "parameter",
    archetype: "costumeArmour",
    axis,
    value,
    feasible: null,
    reason: "the selected costume pieces cannot be assembled for this wearer",
    fix,
  });
}

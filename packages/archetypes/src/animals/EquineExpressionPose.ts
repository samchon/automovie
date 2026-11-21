import { Quaternion, Vector3, rotationBetween } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type Archetype, ArchetypeFrame, type ArchetypeRide } from "../core";
import type { EquineExpressionCue } from "./EquineExpressionCue";
import type { EquineHeadReach } from "./EquineHeadReach";
import { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedRigDelta } from "./QuadrupedRigDelta";

/** The rig's own bones, which carry themselves. */
const BONES: ReadonlySet<string> = new Set<string>([
  "trunk",
  "hindquarters",
  "neck",
  "head",
  "tail",
  ...QuadrupedBody.LIMBS.flatMap(
    (limb: QuadrupedBody.Limb): readonly string[] => QuadrupedBody.BONES[limb],
  ),
]);

/** The identity turn. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/**
 * Re-pose one sample of an equid's ride through its actual rig: the neck and head, each ear about its root, the jaw about its hinge and the tail about its dock.
 *
 * The sample's own bone frames are read by the shared FK reader; the neck, head and tail get new frames and every other bone keeps its own, and a part or contact whose carrier keeps its frame keeps its own transform untouched, so the limbs, the trunk and everything they carry are the base sample's exactly. Each non-bone part rides its declared carrier (`QuadrupedSkeleton.apply`'s rigid delta), the head's tack, ears and jaw riding the head; an ear is then turned about its root and the jaw about its hinge. Spans such as the lead and the reins are laid again by the model between their ends, so a rope stays on its halter and its held point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is re-posed, what is kept exactly and how carried parts and spans follow.
 * @evidence contracts/development/design.md#principled-representation Channel values and the source's rest frames in, one re-posed sample out.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Called by `EquineExpression` for each sample; FK, carrier deltas and span laying stay with their owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No limb, trunk or contact is moved by this layer.
 */
export namespace EquineExpressionPose {
  /**
   * What one sample's channels ask for, already weighted by their cues' shares.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member's unit and frame.
   * @evidence contracts/development/design.md#principled-representation Optional per channel: absent leaves that channel as the base sample has it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The five channels the layer drives.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IChannels {
    /** The neck's and head's full turns and the share of them shown. */
    head?: IHead;

    /** Each ear's target carriage, a direction in the rest model's space for the left ear (the right mirrors X), and its share. */
    ears: Partial<Record<EquineExpressionCue.Side, IEar>>;

    /** The jaw's opening about its hinge, degrees, ventral positive. */
    jaw: number;

    /** The tail's raise about the trunk's lateral axis and its swing about the trunk's long axis, degrees. */
    tail: ITail;
  }

  /**
   * The head channel's turns and share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The turns are model-space deltas; the share is in [0, 1].
   * @evidence contracts/development/design.md#principled-representation The full solve and the shown fraction of it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A member of `IChannels`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IHead {
    /** The full turns. */
    turn: EquineHeadReach.ITurn;

    /** The share shown, 0 to 1. */
    share: number;
  }

  /**
   * One ear's target and share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The direction is in the rest model's space; the share is in [0, 1].
   * @evidence contracts/development/design.md#principled-representation A direction and a share.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A member of `IChannels`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IEar {
    /** The carriage's direction for the left ear, rest model space. */
    direction: IAutoMovieVector3;

    /** The share shown, 0 to 1. */
    share: number;
  }

  /**
   * The tail's raise and swing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Degrees about the trunk's lateral and long axes.
   * @evidence contracts/development/design.md#principled-representation Two angles.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A member of `IChannels`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITail {
    /** Raise, degrees: positive lifts a tail that hangs back. */
    raise: number;

    /** Swing, degrees, about the trunk's long axis. */
    swing: number;
  }

  /**
   * The source's rest frames and carriers, prepared once.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each member is.
   * @evidence contracts/development/design.md#principled-representation Rest rotations of the trunk and head and one carrier per non-bone part and contact.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `pose` reads beyond the sample.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPrepared {
    /** The trunk bar's rest rotation. */
    trunk: IAutoMovieQuaternion;

    /** The head bar's rest rotation. */
    head: IAutoMovieQuaternion;

    /** The carrier of each non-bone part. */
    parts: Readonly<Record<string, QuadrupedBody.Bone>>;

    /** The carrier of each contact. */
    contacts: Readonly<Record<string, QuadrupedBody.Bone>>;
  }

  /**
   * Re-pose one sample.
   *
   * @param sample The base ride's sample.
   * @param current The sample's own bone frames, as the shared FK reader reads them from its model.
   * @param prepared The source's rest frames and carriers.
   * @param channels The channels' values.
   * @returns The re-posed sample, at the base sample's placement.
   * @throws {RangeError} As the shared FK reader and carrier deltas refuse a malformed model.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the output and the refusal owner.
   * @evidence contracts/development/implementation.md#principled-implementation Read the sample's FK frames, pre-multiply the neck's and head's rotations by the shown share of their turns (slerp from identity) with the poll carried about the neck's root, turn the tail about its dock in the trunk's frame, move every part by its carrier's rigid delta, then turn each ear about its root toward its carriage in the current head's frame and the jaw about its hinge on the head's lateral axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Bone frames, carrier deltas, per-part local turns, one emission.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Limbs, trunk and contacts keep the base sample's frames exactly; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(B) rig read, O(B) deltas and O(P+A) part and contact moves, as the carrier emitter does.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the shared rig reader, `QuadrupedRigDelta` and the model's own repose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned model owns its parts; nothing is retained.
   */
  export function pose<Id extends string, D extends string>(
    sample: ArchetypeRide.IPose<Id, D>,
    current: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform>,
    prepared: IPrepared,
    channels: IChannels,
  ): ArchetypeRide.IPose<Id, D> {
    const animal: Archetype<Id, D> = sample.archetype;
    const posed: Map<QuadrupedBody.Bone, IAutoMovieTransform> = new Map(
      current,
    );
    const trunk: IAutoMovieTransform = current.get("trunk")!;
    const body: IAutoMovieQuaternion = Quaternion.multiply(
      trunk.rotation,
      Quaternion.inverse(prepared.trunk),
    );

    // The neck turns about its root and carries the poll; the head turns about the moved poll.
    if (channels.head !== undefined && channels.head.share > 0) {
      const neck: IAutoMovieTransform = current.get("neck")!;
      const head: IAutoMovieTransform = current.get("head")!;
      const turnNeck: IAutoMovieQuaternion = Quaternion.slerp(
        IDENTITY,
        channels.head.turn.neck,
        channels.head.share,
      );
      const turnHead: IAutoMovieQuaternion = Quaternion.slerp(
        IDENTITY,
        channels.head.turn.head,
        channels.head.share,
      );
      posed.set("neck", {
        ...neck,
        rotation: Quaternion.normalize(
          Quaternion.multiply(turnNeck, neck.rotation),
        ),
      });
      posed.set("head", {
        ...head,
        translation: Vector3.add(
          neck.translation,
          Quaternion.rotateVector(
            turnNeck,
            Vector3.subtract(head.translation, neck.translation),
          ),
        ),
        rotation: Quaternion.normalize(
          Quaternion.multiply(turnHead, head.rotation),
        ),
      });
    }

    // The tail turns about its dock in the trunk's frame.
    if (channels.tail.raise !== 0 || channels.tail.swing !== 0) {
      const tail: IAutoMovieTransform = current.get("tail")!;
      const local: IAutoMovieQuaternion = Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, channels.tail.swing),
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, channels.tail.raise),
      );
      posed.set("tail", {
        ...tail,
        rotation: Quaternion.normalize(
          Quaternion.multiply(
            Quaternion.multiply(
              Quaternion.multiply(body, local),
              Quaternion.inverse(body),
            ),
            tail.rotation,
          ),
        ),
      });
    }

    const deltas: ReadonlyMap<QuadrupedBody.Bone, ArchetypeFrame.IMotion> =
      QuadrupedRigDelta.between(current, posed);
    const head: IAutoMovieQuaternion = Quaternion.multiply(
      posed.get("head")!.rotation,
      Quaternion.inverse(prepared.head),
    );
    const parts: IAutoMovieModelPart[] = animal.parts.map(
      (part: IAutoMovieModelPart): IAutoMovieModelPart => {
        const carrier: QuadrupedBody.Bone | undefined = BONES.has(part.id)
          ? (part.id as QuadrupedBody.Bone)
          : prepared.parts[part.id];
        const source: IAutoMovieTransform =
          part.transform ?? ArchetypeFrame.upright({ x: 0, y: 0, z: 0 });
        let frame: IAutoMovieTransform =
          carrier !== undefined && posed.get(carrier) !== current.get(carrier)
            ? QuadrupedRigDelta.move(source, carrier, deltas, part.id)
            : ArchetypeFrame.copy(source);
        if (part.id === "leftEar" || part.id === "rightEar")
          frame = ear(
            part,
            frame,
            channels.ears[part.id === "leftEar" ? "left" : "right"],
            part.id === "leftEar" ? 1 : -1,
            head,
          );
        else if (part.id === "jaw" && channels.jaw !== 0)
          frame = about(
            frame,
            start(part, frame),
            Quaternion.fromAxisAngle(
              Quaternion.rotateVector(head, { x: 1, y: 0, z: 0 }),
              channels.jaw,
            ),
          );
        return { ...structuredClone(part), transform: frame };
      },
    );
    const frames: Map<string, IAutoMovieTransform> = new Map(
      animal.affordances.map(
        (contact: IAutoMovieAffordance): [string, IAutoMovieTransform] => {
          const carrier: QuadrupedBody.Bone | undefined =
            prepared.contacts[contact.id];
          return [
            contact.id,
            carrier !== undefined && posed.get(carrier) !== current.get(carrier)
              ? QuadrupedRigDelta.move(
                  contact.frame,
                  carrier,
                  deltas,
                  contact.id,
                )
              : ArchetypeFrame.copy(contact.frame),
          ];
        },
      ),
    );
    return {
      archetype: animal.reposed(parts, frames),
      placement: ArchetypeFrame.copy(sample.placement),
    };
  }

  /** Turn an ear about its root toward its carriage, carried into the current head's frame. */
  function ear(
    part: IAutoMovieModelPart,
    frame: IAutoMovieTransform,
    channel: IEar | undefined,
    sign: number,
    head: IAutoMovieQuaternion,
  ): IAutoMovieTransform {
    if (channel === undefined || channel.share <= 0) return frame;
    const now: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    const wanted: IAutoMovieVector3 = Quaternion.rotateVector(
      head,
      Vector3.normalize({
        x: sign * channel.direction.x,
        y: channel.direction.y,
        z: channel.direction.z,
      }),
    );
    return about(
      frame,
      start(part, frame),
      Quaternion.slerp(IDENTITY, rotationBetween(now, wanted), channel.share),
    );
  }

  /** The end of a part's local +Y from which it hangs: a bar's start, a plate's root. */
  function start(
    part: IAutoMovieModelPart,
    frame: IAutoMovieTransform,
  ): IAutoMovieVector3 {
    const geometry: IAutoMovieModelPart["geometry"] = part.geometry;
    const length: number =
      geometry.type === "primitive" &&
      (geometry.shape.type === "box" ||
        geometry.shape.type === "cylinder" ||
        geometry.shape.type === "capsule")
        ? geometry.shape.height
        : 0;
    return Vector3.subtract(
      frame.translation,
      Quaternion.rotateVector(frame.rotation, { x: 0, y: length / 2, z: 0 }),
    );
  }

  /** A rigid turn of a frame about a pivot. */
  function about(
    frame: IAutoMovieTransform,
    pivot: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): IAutoMovieTransform {
    return ArchetypeFrame.move(
      {
        rotation,
        translation: Vector3.subtract(
          pivot,
          Quaternion.rotateVector(rotation, pivot),
        ),
      },
      frame,
    );
  }
}

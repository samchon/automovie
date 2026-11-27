import { Quaternion, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeConvexCell,
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeRide,
} from "../../core";
import { ApplyQuadrupedCarrierPose } from "../quadruped/ApplyQuadrupedCarrierPose";
import type { AutoMovieArchetypeEquineExpressionCue } from "../AutoMovieArchetypeEquineExpressionCue";
import { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import type { EquineHeadReach } from "./EquineHeadReach";
import { QuadrupedRigDelta } from "../quadruped/QuadrupedRigDelta";
import { QuadrupedScapula } from "../quadruped/QuadrupedScapula";

/*
 * Re-pose one sample of an equid's ride through its rig: the neck and head,
 * each ear about its root, the jaw about its hinge, the upper lip about its
 * root and the tail about its dock.
 *
 * The sample's own bone frames are read by the shared FK reader; the neck, head
 * and tail get new frames and every other bone keeps its own, and a part or
 * contact whose carrier keeps its frame keeps its own transform untouched, so
 * the limbs, the trunk and everything they carry are the base sample's exactly.
 * Each non-bone part rides its declared carrier
 * (`AutoMovieArchetypeQuadrupedSkeleton.apply`'s rigid delta), the head's tack,
 * ears and jaw riding the head; an ear is then turned about its root and the
 * jaw about its hinge. Spans such as the lead and the reins are laid again by
 * the model between their ends, so a rope stays on its halter and its held
 * point.
 */
export namespace EquineExpressionPose {
  /*
   * What one sample's channels ask for, already weighted by their cues' shares.
   */
  export interface IChannels {
    /*
     * The neck's and head's full turns and the share of them shown.
     */
    head?: IHead;

    /*
     * Each ear's target carriage, a direction in the rest model's space for the
     * left ear (the right mirrors X), and its share.
     */
    ears: Partial<Record<AutoMovieArchetypeEquineExpressionCue.Side, IEar>>;

    /*
     * The jaw's opening about its hinge, degrees, ventral positive.
     */
    jaw: number;

    /*
     * The upper lip's curl about its root on the head's lateral axis, degrees,
     * dorsal positive.
     */
    lip: number;

    /*
     * The neck's roll about its own bar at its root, carrying the head,
     * degrees.
     */
    roll: number;

    /*
     * The tail's raise about the trunk's lateral axis and its swing about the
     * trunk's long axis, degrees.
     */
    tail: ITail;
  }

  /*
   * The head channel's turns and share.
   */
  export interface IHead {
    /*
     * The full turns.
     */
    turn: EquineHeadReach.ITurn;

    /*
     * The share shown, 0 to 1.
     */
    share: number;
  }

  /*
   * One ear's target and share.
   */
  export interface IEar {
    /*
     * The carriage's direction for the left ear, rest model space.
     */
    direction: IAutoMovieVector3;

    /*
     * The share shown, 0 to 1.
     */
    share: number;
  }

  /*
   * The tail's raise and swing.
   */
  export interface ITail {
    /*
     * Raise, degrees: positive lifts a tail that hangs back.
     */
    raise: number;

    /*
     * Swing, degrees, about the trunk's long axis.
     */
    swing: number;
  }

  /*
   * The source's rest frames and carriers, prepared once.
   */
  export interface IPrepared {
    /*
     * The trunk bar's rest rotation.
     */
    trunk: IAutoMovieQuaternion;

    /*
     * The head bar's rest rotation.
     */
    head: IAutoMovieQuaternion;

    /*
     * The carrier of each non-bone part.
     */
    parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>;

    /*
     * The carrier of each contact.
     */
    contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>;
  }

  /*
   * Re-pose one sample.
   * Parameter sample: The base ride's sample.
   * Parameter current: The sample's own bone frames, as the shared FK reader reads
   * them from its model.
   * Parameter prepared: The source's rest frames and carriers.
   * Parameter channels: The channels' values.
   * Returns: The re-posed sample, at the base sample's placement.
   * As the shared FK reader and carrier deltas refuse a
   * malformed model.
   */
  export function pose<Id extends string, D extends string>(
    sample: AutoMovieArchetypeRide.IPose<Id, D>,
    current: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    >,
    prepared: IPrepared,
    channels: IChannels,
  ): AutoMovieArchetypeRide.IPose<Id, D> {
    const animal: AutoMovieArchetype<Id, D> = sample.archetype;
    const posed: Map<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    > = new Map(current);
    const trunk: IAutoMovieTransform = current.get("trunk")!;
    const body: IAutoMovieQuaternion = Quaternion.multiply(
      trunk.rotation,
      Quaternion.inverse(prepared.trunk),
    );

    // The neck turns about its root and carries the poll; the head turns about the moved poll.
    if (
      (channels.head !== undefined && channels.head.share > 0) ||
      channels.roll !== 0
    ) {
      const neck: IAutoMovieTransform = current.get("neck")!;
      const head: IAutoMovieTransform = current.get("head")!;
      const turned: IAutoMovieQuaternion = Quaternion.slerp(
        IDENTITY,
        channels.head?.turn.neck ?? IDENTITY,
        channels.head?.share ?? 0,
      );

      // A roll turns the turned neck about its own bar and carries the head with it.
      const roll: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        Quaternion.rotateVector(Quaternion.multiply(turned, neck.rotation), {
          x: 0,
          y: 1,
          z: 0,
        }),
        channels.roll,
      );
      const turnNeck: IAutoMovieQuaternion = Quaternion.multiply(roll, turned);
      const turnHead: IAutoMovieQuaternion = Quaternion.multiply(
        roll,
        Quaternion.slerp(
          IDENTITY,
          channels.head?.turn.head ?? IDENTITY,
          channels.head?.share ?? 0,
        ),
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

    const deltas: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      AutoMovieArchetypeFrame.IMotion
    > = QuadrupedRigDelta.between(current, posed);
    const head: IAutoMovieQuaternion = Quaternion.multiply(
      posed.get("head")!.rotation,
      Quaternion.inverse(prepared.head),
    );
    const cells: AutoMovieArchetypeConvexCell.Table = animal.convexCells;
    const parts: IAutoMovieModelPart[] = animal.parts.map(
      (part: IAutoMovieModelPart): IAutoMovieModelPart => {
        const carrier: AutoMovieArchetypeQuadrupedBody.Bone | undefined =
          BONES.find(
            (bone: AutoMovieArchetypeQuadrupedBody.Bone): boolean =>
              bone === part.id,
          ) ?? prepared.parts[part.id];
        const source: IAutoMovieTransform =
          part.transform ??
          AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 });
        let frame: IAutoMovieTransform =
          carrier !== undefined && posed.get(carrier) !== current.get(carrier)
            ? QuadrupedRigDelta.move(source, carrier, deltas, part.id)
            : AutoMovieArchetypeFrame.copy(source);
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
        else if (part.id === "lip" && channels.lip !== 0)
          frame = about(
            frame,
            start(part, frame),
            Quaternion.fromAxisAngle(
              Quaternion.rotateVector(head, { x: 1, y: 0, z: 0 }),
              -channels.lip,
            ),
          );
        return { ...ApplyQuadrupedCarrierPose.copy(part, cells), transform: frame };
      },
    );
    const frames: Map<string, IAutoMovieTransform> = new Map(
      animal.affordances.map(
        (contact: IAutoMovieAffordance): [string, IAutoMovieTransform] => {
          const carrier: AutoMovieArchetypeQuadrupedBody.Bone | undefined =
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
              : AutoMovieArchetypeFrame.copy(contact.frame),
          ];
        },
      ),
    );
    return {
      archetype: animal.reposed(parts, frames),
      placement: AutoMovieArchetypeFrame.copy(sample.placement),
    };
  }

  /*
   * Turn an ear about its root toward its carriage, carried into the current
   * head's frame.
   */
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
      Quaternion.slerp(IDENTITY, AutoMovieEngineMath.rotationBetween(now, wanted), channel.share),
    );
  }

  /*
   * The end of a part's local +Y from which it hangs: a bar's start, a plate's
   * root.
   */
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

  /*
   * A rigid turn of a frame about a pivot.
   */
  function about(
    frame: IAutoMovieTransform,
    pivot: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): IAutoMovieTransform {
    return AutoMovieArchetypeFrame.move(
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

/*
 * The rig's own bones, which carry themselves.
 */
const BONES: readonly AutoMovieArchetypeQuadrupedBody.Bone[] = [
  "trunk",
  "hindquarters",
  "neck",
  "head",
  "tail",
  ...Object.values(QuadrupedScapula.BONES),
  ...AutoMovieArchetypeQuadrupedBody.LIMBS.flatMap(
    (
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
    ): readonly AutoMovieArchetypeQuadrupedBody.Bone[] =>
      AutoMovieArchetypeQuadrupedBody.BONES[limb],
  ),
];

/*
 * The identity turn.
 */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

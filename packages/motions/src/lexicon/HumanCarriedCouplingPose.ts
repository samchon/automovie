import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionCoupling,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanCarriedCouplingPose,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { bendLower } from "../everyday/bendLower";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The borne body of a coupled carry placed on its bearer (#3437): the carry's
 * key posture, the region places both bodies are read at, the anchor bone
 * the borne body rides, its posture carried by that bone at each instant
 * and the bearer's hold places. `HumanCarriedCoupling` states the coupling these
 * read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is placed, what is read and who states the coupling.
 * @evidence contracts/development/design.md#principled-representation The borne body's place as its key frame carried by the bearer's anchor bone, a parent constraint, and the holds as points in the same frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The anchor rule and its bone reader, the key and stance postures with the stance's bones, the region reader, the borne posture and the holds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The bearer never reads the borne body's displayed bones, so the two cannot chase each other.
 */
export namespace HumanCarriedCouplingPose {
  /** The bones `HumanTrunk.resolve` places from a posture's root and joints alone. */
  export const TRUNK: readonly AutoMovieHumanoidBone[] = [
    "hips",
    "spine",
    "chest",
    "upperChest",
    "neck",
    "head",
    "leftShoulder",
    "rightShoulder",
  ];

  /**
   * The bone a region's place is carried by, as the coupling anchors on it:
   * the region's own bone, a trunk bone or a limb's (a drag's thigh).
   *
   * @param body The body.
   * @param name The region.
   * @returns The bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule.
   * @evidence contracts/development/implementation.md#principled-implementation A region rides its own bone, so whatever moves that bone moves what rests on it; a reader of a limb's bone resolves the limb (`bones`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fallback bone: a limb anchor is read where the limb's fit puts it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function anchor(
    body: IAutoMovieMotionHumanBody,
    name: AutoMovieHumanoidRegion,
  ): AutoMovieHumanoidBone {
    return body.surfaces.regions[name].bone;
  }

  /**
   * A posture's bones as far as the anchor needs them: the trunk's alone
   * (`HumanTrunk.resolve`) for a trunk anchor, the whole fitted pose for a
   * limb's.
   *
   * @param body The body.
   * @param posture The posture.
   * @param anchor The anchor bone.
   * @param resolution The forward-kinematics reader of the posture evaluation this call is part of, used for this call only; a fresh one when absent.
   * @param requested The bones the caller reads; every bone when absent.
   * @returns The resolved bones, only the requested ones and their ancestors when a set is given.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which resolution is taken when, the borrowed reader and the requested set.
   * @evidence contracts/development/implementation.md#principled-implementation A trunk bone stands from the root and the joints alone; a limb's stands where its fit puts it, so only then are the limbs fitted.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One membership test, one resolution.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A limb anchor is never read off the trunk-only resolution, whose limb bones stand at clinical zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms A trunk anchor costs one trunk resolution; a limb anchor one whole-posture fit; with a requested set, forward kinematics composes only those bones and their ancestors.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A limb anchor's fit and its read-back share one forward-kinematics reader, and a caller's reader is shared with them, so one posture evaluation composes each bone once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader is held only during the call; the returned map holds bone records alone.
   */
  export function bones(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    anchor: AutoMovieHumanoidBone,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    if (TRUNK.includes(anchor))
      return HumanTrunk.resolve(body, posture, undefined, resolution, requested);
    const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
    return poseBones(body,
      resolveHumanPosture.seeded(body, posture, undefined, {}, read).pose,
      read(), requested);
  }

  /**
   * The borne body's posture at an instant: the key pose carried rigidly by
   * the bearer's anchor bone as displayed, its clinging hands on the
   * bearer's regions.
   *
   * @param body The borne body.
   * @param coupling The coupling.
   * @param row The carry's row, for its key posture.
   * @param bearers Each bearer's body and displayed bones at the instant, by role.
   * @returns The posture, with a whole-body rotation.
   * @throws {HumanRefusal} A `participant` refusal on `by` when a bearer the coupling names is not given or lacks its anchor bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what carries the borne body and what the hands do.
   * @evidence contracts/development/implementation.md#principled-implementation The borne root frame is the bearer's anchor bone's displayed frame composed with the key frame, a parent constraint at its offset as a held object keeps its offset in the hand; the resting region therefore stays on its region however the bearer's trunk turns. The frame becomes the root and a whole-body rotation about it (#3423), and each clinging hand's world goal is taken back through that rotation so the turned goal lands on the bearer's region.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The anchor's frame, the composed frame, the posture, the hands.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The held regions are the bearer's hands' to reach (`holds`); the borne body is not dragged onto the hands.
   * @evidence contracts/development/implementation.md#efficient-algorithms One frame composition and one key resolution per instant.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The key posture is `key`'s, the region places the engine's, the arm bend `AutoMovieMotionHumanBend.hang`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function of the instant's bones.
   */
  export function posture(
    body: IAutoMovieMotionHumanBody,
    coupling: IAutoMovieMotionCoupling,
    row: IAutoMovieMotionHumanCarried.IRow,
    bearers: Readonly<
      Record<string, IAutoMovieMotionHumanCarriedCouplingPose.IBearer>
    >,
  ): IAutoMovieMotionHumanPosture {
    const of = (
      role: string,
    ): IAutoMovieMotionHumanCarriedCouplingPose.IBearer => {
      const found:
        | IAutoMovieMotionHumanCarriedCouplingPose.IBearer
        | undefined = bearers[role];
      if (found === undefined)
        throw new HumanRefusal({
          kind: "participant",
          axis: "by",
          value: role,
          reason: `the carry's ${role} is not given`,
          fix: "name every bearer of the carry",
        });
      return found;
    };
    const anchored: IAutoMovieResolvedBone | undefined = of(
      coupling.bearer,
    ).bones.get(coupling.anchor);
    if (anchored === undefined)
      throw new HumanRefusal({
        kind: "participant",
        axis: "by",
        value: coupling.anchor,
        reason: `the bearer's rig has no ${coupling.anchor} to carry the borne body by`,
        fix: "carry on a body of the canonical humanoid rig",
      });

    // The borne root frame: the anchor's displayed frame composed with the
    // key frame.
    const keyed: IAutoMovieMotionHumanPosture = key(row, coupling.key.legs);
    const root: IAutoMovieVector3 = Vector3.add(
      anchored.worldPosition,
      Quaternion.rotateVector(anchored.worldRotation, coupling.key.position),
    );
    const turn: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.multiply(anchored.worldRotation, coupling.key.rotation),
        Quaternion.inverse(resolveHumanPosture.heading(keyed)),
      ),
    );
    const placed: IAutoMovieMotionHumanPosture = { ...keyed, root };
    const back: IAutoMovieQuaternion = Quaternion.inverse(turn);
    const unturn = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(
        root,
        Quaternion.rotateVector(back, Vector3.subtract(point, root)),
      );
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const contact of coupling.contacts)
      if (contact.kind === "grip") {
        const bearer: IAutoMovieMotionHumanCarriedCouplingPose.IBearer = of(contact.on.role);
        const side: "left" | "right" =
          contact.part === "leftHand" ? "left" : "right";
        limbs[`${side}Arm`] = {
          point: unturn(
            region(
              bearer.body,
              bearer.bones,
              contact.on.region,
            ),
          ),
          bend: AutoMovieMotionHumanBend.hang(body, placed, side),
        };
      }
    return { ...placed, limbs, rotation: { about: root, turn } };
  }

  /**
   * Where each hand of a bearer holds, in that bearer's anchor frame: the
   * borne region it holds on the coupling's key pose, left then right; null
   * for a hand that does not hold.
   *
   * @param borne The borne body.
   * @param coupling The coupling.
   * @param row The carry's row.
   * @param role The bearer's role; the coupling's first bearer when absent.
   * @returns The two holds, each the held region's point and outward normal in that bearer's anchor frame, and the anchor bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the order and the null.
   * @evidence contracts/development/implementation.md#principled-implementation The hold is read off the same key relation the borne body rides by, in the same anchor frame, so the bearer reaches where the borne body lies without reading it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One key resolution and one frame change per holding hand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bearer never reads the borne body's displayed bones, which read the bearer's, so the two cannot chase each other.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution of the key pose per call, then one contact lookup and one point-and-normal placement per hand.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The key pose is `key`'s and the surface placement the engine's `pointNormal`; nothing is cached between calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function holds(
    borne: IAutoMovieMotionHumanBody,
    coupling: IAutoMovieMotionCoupling,
    row: IAutoMovieMotionHumanCarried.IRow,
    role: string = coupling.bearer,
  ): IAutoMovieMotionHumanCarriedCouplingPose.IHoldsResult {
    // A further bearer reads the places in its own anchor frame.
    const frame:
      | {
          position: IAutoMovieVector3;
          rotation: IAutoMovieQuaternion;
          anchor: AutoMovieHumanoidBone;
        }
      | undefined =
      role === coupling.bearer ? undefined : coupling.bearers?.[role];
    const keyed: IAutoMovieMotionHumanPosture = key(row, coupling.key.legs);
    const mine: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(borne, keyed);
    const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(keyed);
    const at = (
      palm: AutoMovieHumanoidRegion,
    ): IAutoMovieMotionHumanCarriedCouplingPose.IHold | null => {
      const contact: IAutoMovieMotionCoupling.IContact | undefined =
        coupling.contacts.find(
          (c: IAutoMovieMotionCoupling.IContact): boolean =>
            c.kind === "bear" && c.on.role === role && c.on.region === palm,
        );
      if (contact === undefined) return null;
      const surface: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
        borne.surfaces.regions[contact.region];
      const placed: { point: IAutoMovieVector3; normal: IAutoMovieVector3 } =
        resolveAutoMovieHumanoidSurfaces.pointNormal(
          surface,
          mine.get(surface.bone)!,
        );
      const back: IAutoMovieQuaternion = Quaternion.inverse(heading);
      const point: IAutoMovieVector3 = Vector3.add(
        coupling.key.position,
        Quaternion.rotateVector(
          coupling.key.rotation,
          Quaternion.rotateVector(back, placed.point),
        ),
      );
      const normal: IAutoMovieVector3 = Quaternion.rotateVector(
        coupling.key.rotation,
        Quaternion.rotateVector(back, placed.normal),
      );
      if (frame === undefined) return { point, normal };
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(frame.rotation);
      return {
        point: Quaternion.rotateVector(
          inverse,
          Vector3.subtract(point, frame.position),
        ),
        normal: Quaternion.rotateVector(inverse, normal),
      };
    };
    return {
      anchor: frame?.anchor ?? coupling.anchor,
      places: [at("palmLeft"), at("palmRight")],
    };
  }

  /**
   * A bearer at the origin in the performer's actual standing posture
   * (`stand.posture`), lowered as a squat by the stance's depth with the
   * trunk inclined by its angle (`bendLower.lower`). The standing alignment,
   * planted feet and minimum knee bend are the same at zero and at every
   * nonzero inclination or depth, so the stance has no finite jump at zero.
   *
   * @param body The bearer's body.
   * @param bent The stance: the trunk's forward inclination, degrees, and the lowering, a share of a squat's drop.
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two cases, the inputs and their units.
   * @evidence contracts/development/implementation.md#principled-implementation Applies the bend law's continuous lowering to the same planted standing posture at every parameter, rather than changing the kinematic representation at zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One standing posture and one lowering.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No zero-only trunk shortcut with different feet, knee extension or trunk alignment.
   * @evidence contracts/development/implementation.md#efficient-algorithms One lowering, constant work beyond its leg solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `bendLower.lower` and `stand.posture` own both operations.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function stance(
    body: IAutoMovieMotionHumanBody,
    bent: IAutoMovieMotionHumanCarriedCouplingPose.IStanceBent,
  ): IAutoMovieMotionHumanPosture {
    return bendLower.lower(
      body,
      stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
      "squat",
      bent.incline,
      bent.depth,
      0,
    );
  }

  /**
   * A bearer's bones in its planted stance (`stance`), including at zero:
   * every trial is resolved by the same whole-body kinematics.
   *
   * @param body The bearer's body.
   * @param bent The stance.
   * @returns The resolved bones.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which resolution is taken when.
   * @evidence contracts/development/implementation.md#principled-implementation One kinematic map for the whole parameter domain, so finite differences describe a stance's derivative rather than a branch's finite jump.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One posture resolution and one forward kinematics pass.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A standing bearer is never substituted with a clinical-zero skeleton.
   * @evidence contracts/development/implementation.md#efficient-algorithms One resolved pose per stance, shared by the fitter's stance cache.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `stance`, `resolveHumanPosture` and `poseBones`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function stood(
    body: IAutoMovieMotionHumanBody,
    bent: IAutoMovieMotionHumanCarriedCouplingPose.IStoodBent,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return poseBones(body, resolveHumanPosture(body, stance(body, bent)));
  }

  /**
   * The carry's key posture of the borne body at the origin: the row's
   * heading and tip, and its leg angles or the fitted ones.
   *
   * @param row The carry's row.
   * @param legs Both legs' hip flexion, knee flexion and hip abduction, degrees; the row's when absent.
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the posture takes from the row.
   * @evidence contracts/development/implementation.md#principled-implementation The carry's table posture, both legs alike, the arms left to the clinging goals.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The angles are the row's provisional ones, stated there.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function key(
    row: IAutoMovieMotionHumanCarried.IRow,
    legs: readonly [number, number, number] = row.legs,
  ): IAutoMovieMotionHumanPosture {
    const [hip, knee, apart]: readonly [number, number, number] = legs;
    return {
      root: { x: 0, y: 0, z: 0 },
      yaw: row.turn,
      pitch: row.pitch,
      roll: 0,
      joints: {
        leftUpperLeg: [hip, apart, 0],
        rightUpperLeg: [hip, apart, 0],
        leftLowerLeg: [knee, 0, 0],
        rightLowerLeg: [knee, 0, 0],
      },
      limbs: {},
    };
  }

  /**
   * A region's world point on resolved bones.
   *
   * @param body The body.
   * @param bones Its resolved bones.
   * @param name The region.
   * @returns World metres.
   * @throws {HumanRefusal} A `parameter` refusal on `carry` when the rig lacks the region's bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the frame and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The region's bone-local point carried by its bone's world frame (`resolveAutoMovieHumanoidSurfaces.point`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one placement; the carry laws' one region reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing bone is refused, never read as the origin.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The engine's surface placement owns the point.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function region(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    name: AutoMovieHumanoidRegion,
  ): IAutoMovieVector3 {
    const frame: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
      body.surfaces.regions[name];
    const bone: IAutoMovieResolvedBone | undefined = bones.get(frame.bone);
    if (bone === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "carry",
        value: name,
        reason: `the rig has no bone ${frame.bone} for the region ${name}`,
        fix: "carry on a body of the canonical humanoid rig",
      });
    return resolveAutoMovieHumanoidSurfaces.point(frame, bone);
  }
}

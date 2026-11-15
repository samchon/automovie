import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { HumanCarried } from "./HumanCarried";

/**
 * The borne body of a coupled carry placed on its bearer (#3437): the carry's
 * key posture, the region places both bodies are read at, the anchor bone
 * the borne body rides, its posture carried by that bone at each instant
 * and the bearer's hold places. `HumanCarriedCoupling` states the coupling these
 * read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is placed, what is read and who states the coupling.
 * @evidence contracts/development/design.md#principled-representation The borne body's place as its key frame carried by the bearer's anchor bone, a parent constraint, and the holds as points in the same frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bearer record, the anchor rule and its bone reader, the key and standing postures, the region reader, the borne posture and the holds.
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

  /** Where a bearer's hand holds: the held region's point and outward normal, in the bearer's anchor frame. */
  export interface IHold {
    /** Metres. */
    point: IAutoMovieVector3;

    /** Unit, out of the borne body. */
    normal: IAutoMovieVector3;
  }

  /** A bearer as the borne body reads it at an instant. */
  export interface IBearer {
    /** The bearer's body. */
    body: IHumanBody;

    /** Its displayed bones at the instant. */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

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
    body: IHumanBody,
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
   * @returns The resolved bones, the anchor's among them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which resolution is taken when.
   * @evidence contracts/development/implementation.md#principled-implementation A trunk bone stands from the root and the joints alone; a limb's stands where its fit puts it, so only then are the limbs fitted.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One membership test, one resolution.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A limb anchor is never read off the trunk-only resolution, whose limb bones stand at clinical zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics pass for a trunk anchor; the limb fits only for a limb anchor.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `HumanTrunk.resolve`, `resolveHumanPosture` and `poseBones`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function bones(
    body: IHumanBody,
    posture: IHumanPosture,
    anchor: AutoMovieHumanoidBone,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return TRUNK.includes(anchor)
      ? HumanTrunk.resolve(body, posture)
      : poseBones(body, resolveHumanPosture(body, posture));
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
    body: IHumanBody,
    coupling: AutoMovieMotionMeeting.ICoupling,
    row: HumanCarried.IRow,
    bearers: Readonly<Record<string, IBearer>>,
  ): IHumanPosture {
    const of = (role: string): IBearer => {
      const found: IBearer | undefined = bearers[role];
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
    const keyed: IHumanPosture = key(row);
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
    const placed: IHumanPosture = { ...keyed, root };
    const back: IAutoMovieQuaternion = Quaternion.inverse(turn);
    const unturn = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(
        root,
        Quaternion.rotateVector(back, Vector3.subtract(point, root)),
      );
    const limbs: IHumanPosture["limbs"] = {};
    for (const contact of coupling.contacts)
      if (contact.kind === "grip") {
        const side: "left" | "right" =
          contact.part === "leftHand" ? "left" : "right";
        limbs[`${side}Arm`] = {
          point: unturn(
            region(
              of(contact.on.role).body,
              of(contact.on.role).bones,
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
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution per call; a law calls it once at plan time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The coupling's key frame and the engine's region places.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function holds(
    borne: IHumanBody,
    coupling: AutoMovieMotionMeeting.ICoupling,
    row: HumanCarried.IRow,
    role: string = coupling.bearer,
  ): {
    anchor: AutoMovieHumanoidBone;
    places: readonly [IHold | null, IHold | null];
  } {
    // A further bearer reads the places in its own anchor frame.
    const frame:
      | {
          position: IAutoMovieVector3;
          rotation: IAutoMovieQuaternion;
          anchor: AutoMovieHumanoidBone;
        }
      | undefined =
      role === coupling.bearer ? undefined : coupling.bearers?.[role];
    const keyed: IHumanPosture = key(row);
    const mine: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(borne, keyed);
    const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(keyed);
    const at = (palm: AutoMovieHumanoidRegion): IHold | null => {
      const contact: AutoMovieMotionMeeting.ICoupledContact | undefined =
        coupling.contacts.find(
          (c: AutoMovieMotionMeeting.ICoupledContact): boolean =>
            c.kind === "bear" && c.on.role === role && c.on.region === palm,
        );
      if (contact === undefined) return null;
      const surface: IHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
        borne.surfaces.regions[contact.region];
      const placed: { point: IAutoMovieVector3; normal: IAutoMovieVector3 } =
        resolveAutoMovieHumanoidSurfaces.place(
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
   * The posture of a body standing still at the origin.
   *
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the posture.
   * @evidence contracts/development/implementation.md#principled-implementation The rest stance at the world origin facing +Z, the frame the coupling's key relation is stated in.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function still(): IHumanPosture {
    return {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    };
  }

  /**
   * The carry's key posture of the borne body at the origin: the row's
   * heading, tip and leg angles.
   *
   * @param row The carry's row.
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
  export function key(row: HumanCarried.IRow): IHumanPosture {
    const [hip, knee, apart]: readonly [number, number, number] = row.legs;
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
   * @evidence contracts/development/implementation.md#principled-implementation The engine's surface resolution of the region's frame on its bone.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing bone is refused, never read as the origin.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `resolveAutoMovieHumanoidSurfaces.place`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function region(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    name: AutoMovieHumanoidRegion,
  ): IAutoMovieVector3 {
    const frame: IHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
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
    return resolveAutoMovieHumanoidSurfaces.place(frame, bone).point;
  }
}

import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  fitRigidMeshTransform,
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
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { HumanCarried } from "./HumanCarried";

/**
 * The borne body of a coupled carry placed on its bearer (#3437): the carry's
 * key posture, the region places both bodies are read at, the per-instant
 * registration of the key pose on the bearer's displayed regions and the
 * bearer's hold places. `HumanCarriedCoupling` states the coupling these
 * read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is placed, what is read and who states the coupling.
 * @evidence contracts/development/design.md#principled-representation The borne body's place as a rigid registration of its key pose on the bearer's contacts, and the holds as points in the bearer's hips frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The key and standing postures, the region reader, the borne posture and the holds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The bearer never reads the borne body's displayed bones, so the two cannot chase each other.
 */
export namespace HumanCarriedCouplingPose {
  /**
   * The borne body's posture at an instant: the key pose registered rigidly
   * on the bearer's displayed regions, its clinging hands on theirs.
   *
   * @param body The borne body.
   * @param coupling The coupling.
   * @param row The carry's row, for its key posture.
   * @param bearer The bearer's body.
   * @param theirs The bearer's displayed bones at the instant.
   * @returns The posture, with a whole-body rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is registered on what and what the hands do.
   * @evidence contracts/development/implementation.md#principled-implementation Horn's least-squares rigid motion maps the key pose's bearing regions onto the bearer's displayed ones; with fewer than three bearing contacts the key frame carried by the bearer's hips adds three correspondences (its origin and two axis points), so the rotation is determined. The rigid motion becomes the root shift and a whole-body rotation about the registered centre (#3423), and each clinging hand's world goal is taken back through that rotation so the turned goal lands on the bearer's region.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Correspondences, one fit, the posture, the hands.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No contact is dragged onto its region after the fit: what the rigid key pose cannot meet stays a residual the slip check reads.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution of the key pose, the bearer's region reads and one four-by-four eigen solve per instant.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fit is `fitRigidMeshTransform`, the region places the engine's, the arm bend `AutoMovieMotionHumanBend.hang`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function of the instant's bones.
   */
  export function posture(
    body: IHumanBody,
    coupling: AutoMovieMotionMeeting.ICoupling,
    row: HumanCarried.IRow,
    bearer: IHumanBody,
    theirs: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IHumanPosture {
    const keyed: IHumanPosture = key(row);
    const mine: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(body, keyed);
    const hips: IAutoMovieResolvedBone | undefined = theirs.get("hips");
    if (hips === undefined)
      throw new HumanRefusal({
        kind: "participant",
        axis: "by",
        value: "hips",
        reason: "the bearer's rig has no hips to carry the borne body by",
        fix: "carry on a body of the canonical humanoid rig",
      });
    const reference: IAutoMovieVector3[] = [];
    const target: IAutoMovieVector3[] = [];
    for (const contact of coupling.contacts)
      if (contact.kind === "bear") {
        reference.push(region(body, mine, contact.region));
        target.push(region(bearer, theirs, contact.on.region));
      }

    // Fewer than three correspondences leave a turn free: the key frame,
    // carried by the bearer's hips, fixes it.
    if (reference.length < 3) {
      const frame = (local: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(
          hips.worldPosition,
          Quaternion.rotateVector(
            hips.worldRotation,
            Vector3.add(
              coupling.key.position,
              Quaternion.rotateVector(coupling.key.rotation, local),
            ),
          ),
        );
      const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(keyed);
      const unit: number = body.measure.stature / 2;
      for (const axis of [
        { x: 0, y: 0, z: 0 },
        { x: unit, y: 0, z: 0 },
        { x: 0, y: 0, z: unit },
      ]) {
        reference.push(Quaternion.rotateVector(heading, axis));
        target.push(frame(axis));
      }
    }
    const fit: ReturnType<typeof fitRigidMeshTransform> =
      fitRigidMeshTransform({
        reference: reference.flatMap((p: IAutoMovieVector3): number[] => [
          p.x,
          p.y,
          p.z,
        ]),
        target: target.flatMap((p: IAutoMovieVector3): number[] => [
          p.x,
          p.y,
          p.z,
        ]),
        vertices: reference.map((_: IAutoMovieVector3, i: number): number => i),
      });
    const placed: IHumanPosture = {
      ...keyed,
      root: Vector3.subtract(fit.targetCenter, fit.referenceCenter),
    };
    const back: IAutoMovieQuaternion = Quaternion.inverse(fit.rotation);
    const unturn = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(
        fit.targetCenter,
        Quaternion.rotateVector(
          back,
          Vector3.subtract(point, fit.targetCenter),
        ),
      );
    const limbs: IHumanPosture["limbs"] = {};
    for (const contact of coupling.contacts)
      if (contact.kind === "grip") {
        const side: "left" | "right" =
          contact.part === "leftHand" ? "left" : "right";
        limbs[`${side}Arm`] = {
          point: unturn(region(bearer, theirs, contact.on.region)),
          bend: AutoMovieMotionHumanBend.hang(body, placed, side),
        };
      }
    return {
      ...placed,
      limbs,
      rotation: { about: fit.targetCenter, turn: fit.rotation },
    };
  }

  /**
   * Where each bearer hand holds, in the bearer's hips frame: the borne
   * region it holds on the coupling's key pose, left then right; null for a
   * hand that does not hold.
   *
   * @param borne The borne body.
   * @param coupling The coupling.
   * @param row The carry's row.
   * @returns The two places, metres in the bearer's hips frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the order and the null.
   * @evidence contracts/development/implementation.md#principled-implementation The hold is read off the same key relation the borne body is registered by, so the bearer reaches where the borne body will lie without reading it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One trunk resolution and one frame change per holding hand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bearer never reads the borne body's displayed bones, which read the bearer's, so the two cannot chase each other.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution per call; a law calls it once at plan time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The coupling's key frame and the engine's region places.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function holds(
    borne: IHumanBody,
    coupling: AutoMovieMotionMeeting.ICoupling,
    row: HumanCarried.IRow,
  ): readonly [IAutoMovieVector3 | null, IAutoMovieVector3 | null] {
    const mine: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(borne, key(row));
    const at = (palm: AutoMovieHumanoidRegion): IAutoMovieVector3 | null => {
      const contact: AutoMovieMotionMeeting.ICoupledContact | undefined =
        coupling.contacts.find(
          (c: AutoMovieMotionMeeting.ICoupledContact): boolean =>
            c.kind === "bear" && c.on.region === palm,
        );
      if (contact === undefined) return null;
      const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(
        key(row),
      );
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(heading),
        region(borne, mine, contact.region),
      );
      return Vector3.add(
        coupling.key.position,
        Quaternion.rotateVector(coupling.key.rotation, local),
      );
    };
    return [at("palmLeft"), at("palmRight")];
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
  }}

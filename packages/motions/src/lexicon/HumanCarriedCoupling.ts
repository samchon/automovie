import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  fitRigidMeshTransform,
  resolveAutoMovieCenterOfMass,
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
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanLoad } from "../perform/HumanLoad";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { HumanCarried } from "./HumanCarried";

/**
 * The coupling of a named carry (#3437): the meeting kind whose borne role
 * rests on the bearer by several contacts with load shares, whose borne mass
 * and centre enter the bearer's balance, and the per-instant solve that puts
 * the borne body on the bearer's displayed regions.
 *
 * - **Key pose.** The carry's posture of the borne body (its heading, tip and
 *   leg angles, `HumanCarried.CARRIES`) placed with its resting region on
 *   the bearer's region of a standing bearer, the same placement the carry
 *   always used; it is a pure function of the two bodies and the carry, so
 *   the record is the same whichever role plans first and wherever the pair
 *   stands.
 * - **Contacts.** The resting region on the bearer's region, each bearer
 *   hand's palm under the borne region it holds (`HOLDS`), both bearing, and
 *   each clinging hand on the bearer's region it clings to, a grip.
 * - **Load shares.** The bearing contacts' shares of the borne weight are
 *   the least-norm shares whose weighted centre lies under the borne centre
 *   of mass, the vertical reactions of a body at rest on point supports
 *   (static equilibrium of forces and of the moments about the vertical's
 *   two horizontal axes).
 * - **Borne body per instant.** The borne key pose is registered rigidly on
 *   the bearer's displayed regions at that instant by Horn's closed-form
 *   absolute orientation (1987, `fitRigidMeshTransform`), every bearing
 *   contact a correspondence; with fewer than three, the key frame carried
 *   by the bearer's hips completes the correspondences, so a carry on one
 *   region keeps its heading on the bearer. The solve is per instant, with
 *   no state, so it cannot lag a turning bearer; a contact it cannot meet is
 *   a residual the slip check reads.
 * - **Capacity.** The borne mass is refused above the mass whose moment
 *   about the bearer's base exceeds the bearer's own at a right angle,
 *   `m d <= M h`, the bound beyond which no lean balances the pair
 *   (`HumanLoad.lean`). No study of person-carrying capacity was found
 *   (a search on casualty-carry capacity relative to the rescuer's mass
 *   returned none), so no tighter per-carry bound is set.
 *
 * First pass: the key pose is the carry's table posture, not a whole-body
 * fit of both bodies (`HumanBodyFit`); the borne centre is read with the
 * arms at their clinical zero; the bearer's sideways moment (a supported
 * walk) is not balanced, as `HumanLoad.lean` leans only along the facing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the key pose, the contacts, the load shares with their law, the per-instant solve with its source, the capacity bound with its derivation and search record, and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A meeting kind with a coupling of plain data in the bearer's hips frame, the shared record of a coupled pair; the borne body's place is a rigid registration of its key pose on the bearer's contacts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The roles, the hold table, the kind, the coupling, the bearer's load and the borne posture; the carries' rows stay `HumanCarried`'s and the lean `HumanLoad`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The borne body is placed on every bearing contact at once, never on one bone, and a mass no lean balances is refused, never clamped.
 */
export namespace HumanCarriedCoupling {
  /** The bearing role's name. */
  export const BEARER: string = "bearer";

  /** The borne role's name. */
  export const BORNE: string = "borne";

  /**
   * The borne region each bearer hand holds, left hand then right, from the
   * carries' common descriptions: piggyback, under the thighs; cradle, under
   * the back and the knees; over the shoulder, the back of the thighs;
   * supported, the far hip; the armpit drag, under the arms; the collar
   * drag, the collar; the ankle drag, the ankles. Null where the carry's own
   * row has no hold on that side.
   */
  export const HOLDS: Readonly<
    Record<
      HumanCarried.Carry,
      readonly [AutoMovieHumanoidRegion | null, AutoMovieHumanoidRegion | null]
    >
  > = {
    piggyback: ["thighOuterLeft", "thighOuterRight"],
    cradle: ["upperBack", "kneeRight"],
    overShoulder: [null, "thighOuterRight"],
    supported: [null, "hipRight"],
    supportedLeft: ["hipLeft", null],
    armpitDrag: ["ribsLeft", "ribsRight"],
    collarDrag: ["nape", "nape"],
    ankleDrag: ["calfLeft", "calfRight"],
  };

  /**
   * The meeting kind of a carry: roles `bearer` and `borne`, no shared
   * default place, the contact made at the start and held for as long as the
   * carry's window says, and the coupling.
   *
   * @param carry The carry.
   * @param rows The carries' rows (`HumanCarried.CARRIES`), passed by the caller so this file does not import its consumer.
   * @param extra Kilograms the borne person carries besides their body; none when absent.
   * @returns The kind.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the roles, the timing and what the coupling is computed from.
   * @evidence contracts/development/implementation.md#principled-implementation A carry's contact exists from the moment it is taken, so every instant is the start; `couple` reads the two roles' bodies by name, so the meeting's own ordering decides nothing.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record with two functions.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A role list without both roles never reaches `couple`, as the meeting calls it only when solid.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work to build; `couple` costs `couple`'s.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The coupling is `couple`, the one owner.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains only the carry, the rows and the extra mass.
   */
  export function kind(
    carry: HumanCarried.Carry,
    rows: Readonly<Record<HumanCarried.Carry, HumanCarried.IRow>>,
    extra: number = 0,
  ): AutoMovieMotionMeeting.IKind {
    return {
      name: `carried:${carry}`,
      roles: [BEARER, BORNE],
      contacts: {},
      timing: (): AutoMovieMotionMeeting.ITiming => ({
        ready: 0,
        stroke: 0,
        relax: 0,
      }),
      couple: (
        roles: readonly AutoMovieMotionMeeting.IRole[],
      ): AutoMovieMotionMeeting.ICoupling => {
        const bearer: AutoMovieMotionMeeting.IRole = roles.find(
          (r: AutoMovieMotionMeeting.IRole): boolean => r.name === BEARER,
        )!;
        const borne: AutoMovieMotionMeeting.IRole = roles.find(
          (r: AutoMovieMotionMeeting.IRole): boolean => r.name === BORNE,
        )!;
        return couple(bearer.body, borne.body, rows[carry], carry, extra);
      },
    };
  }

  /**
   * The coupling of a carry between two bodies, refused when the bearer
   * cannot balance the borne mass.
   *
   * @param bearer The bearer's body.
   * @param borne The borne body.
   * @param row The carry's row.
   * @param carry The carry, for its holds.
   * @param extra Kilograms the borne person carries besides their body.
   * @returns The coupling, in the bearer's hips frame.
   * @throws {HumanRefusal} A `participant` refusal on `mass` with the feasible borne mass, when no lean of the bearer balances it; a `parameter` refusal on `mass` for a negative extra mass.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the frame of the result and both refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The key pose places the borne resting region on the bearer's at a standing bearer; each contact is read on both key bodies; the bearing shares are the least-norm solution of the three equilibrium equations (the shares sum to one and their centre lies under the borne centre); the capacity is the moment-balance bound of `HumanLoad.lean`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Key pose, contacts, centre, shares, capacity, record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A share the least-norm solution makes negative would pull the borne body down, which a resting contact cannot, so it is set to none and the rest renormalized; collinear bearing contacts, whose equations are singular, share equally. Both are stated here rather than hidden.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two trunk resolutions, one mass model and a three-by-three solve, once per meeting.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The region places are the engine's surface resolution, the centre the engine's mass model and the capacity `HumanLoad.lean`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function; the record keeps no body or bone.
   */
  export function couple(
    bearer: IHumanBody,
    borne: IHumanBody,
    row: HumanCarried.IRow,
    carry: HumanCarried.Carry,
    extra: number = 0,
  ): AutoMovieMotionMeeting.ICoupling {
    if (!(extra >= 0))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "mass",
        value: extra,
        feasible: { kind: "range", minimum: 0, maximum: null, unit: "kg" },
        reason: "a borne person carries no negative mass",
        fix: "give the mass they carry, or none",
      });
    const stand: IHumanPosture = still();
    const theirs: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(bearer, stand);
    const hips: IAutoMovieResolvedBone = theirs.get("hips")!;
    const keyed: IHumanPosture = pose(row);
    const root: IAutoMovieVector3 = Vector3.subtract(
      region(bearer, theirs, row.theirs),
      region(borne, HumanTrunk.resolve(borne, keyed), row.mine),
    );
    const key: IHumanPosture = { ...keyed, root };
    const mine: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(borne, key);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      hips.worldRotation,
    );
    const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(point, hips.worldPosition),
      );

    // The contacts: the resting region, the bearer's palms under the held
    // regions, and the clinging hands.
    const bearing: {
      region: AutoMovieHumanoidRegion;
      on: AutoMovieHumanoidRegion;
    }[] = [{ region: row.mine, on: row.theirs }];
    (["left", "right"] as const).forEach(
      (side: "left" | "right", index: number): void => {
        const held: AutoMovieHumanoidRegion | null =
          row.holds[index] === null ? null : (HOLDS[carry][index] ?? null);
        if (held !== null)
          bearing.push({
            region: held,
            on: side === "left" ? "palmLeft" : "palmRight",
          });
      },
    );
    const model: resolveAutoMovieCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(borne.skeleton, borne.profile);
    const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      model,
      mine,
    );
    const loads: number[] = shares(
      bearing.map(
        (b: {
          region: AutoMovieHumanoidRegion;
          on: AutoMovieHumanoidRegion;
        }): IAutoMovieVector3 => region(borne, mine, b.region),
      ),
      centre,
    );
    const contacts: AutoMovieMotionMeeting.ICoupledContact[] = bearing.map(
      (
        b: { region: AutoMovieHumanoidRegion; on: AutoMovieHumanoidRegion },
        index: number,
      ): AutoMovieMotionMeeting.ICoupledContact => ({
        part: part(borne, b.region),
        region: b.region,
        on: { role: BEARER, region: b.on },
        kind: "bear",
        load: loads[index]!,
      }),
    );
    (["left", "right"] as const).forEach(
      (side: "left" | "right", index: number): void => {
        const cling: AutoMovieHumanoidRegion | null = row.clings[index] ?? null;
        if (cling !== null)
          contacts.push({
            part: side === "left" ? "leftHand" : "rightHand",
            region: side === "left" ? "palmLeft" : "palmRight",
            on: { role: BEARER, region: cling },
            kind: "grip",
            load: 0,
          });
      },
    );
    const coupling: AutoMovieMotionMeeting.ICoupling = {
      bearer: BEARER,
      borne: BORNE,
      contacts,
      mass: model.mass + extra,
      centre: local(centre),
      key: {
        position: local(root),
        rotation: Quaternion.normalize(
          Quaternion.multiply(
            inverse,
            resolveHumanPosture.heading(pose(row)),
          ),
        ),
      },
    };
    bearable(bearer, coupling);
    return coupling;
  }

  /**
   * The bearer's load for its lean (`HumanCarriedLean.layer`,
   * `HumanLoad.lean`): its own mass and centre height, and the borne mass
   * with its distance ahead of the bearer's centre along the facing.
   *
   * @param bearer The bearer's body.
   * @param coupling The coupling.
   * @returns The load.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read and the frame of the distance.
   * @evidence contracts/development/implementation.md#principled-implementation The combined centre of the pair moves `m d / (M + m)` ahead of the bearer's own; the lean that balances it is #3431's moment balance, so this returns exactly its inputs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One mass model, one centre, one difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The distance is the borne centre's in the bearer's own standing frame, not a constant of the carry.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution and one mass model.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The engine's mass model and the coupling's centre.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function load(
    bearer: IHumanBody,
    coupling: AutoMovieMotionMeeting.ICoupling,
  ): Parameters<typeof HumanLoad.lean>[0] {
    const model: resolveAutoMovieCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(bearer.skeleton, bearer.profile);
    const theirs: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(bearer, still());
    const hips: IAutoMovieResolvedBone = theirs.get("hips")!;
    const own: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      model,
      theirs,
    );
    const borne: IAutoMovieVector3 = Vector3.add(
      hips.worldPosition,
      Quaternion.rotateVector(hips.worldRotation, coupling.centre),
    );
    return {
      mass: model.mass,
      height: own.y,
      load: coupling.mass,
      ahead: borne.z - own.z,
    };
  }

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
    const key: IHumanPosture = pose(row);
    const mine: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(body, key);
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
      const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(key);
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
      ...key,
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
      HumanTrunk.resolve(borne, pose(row));
    const at = (palm: AutoMovieHumanoidRegion): IAutoMovieVector3 | null => {
      const contact: AutoMovieMotionMeeting.ICoupledContact | undefined =
        coupling.contacts.find(
          (c: AutoMovieMotionMeeting.ICoupledContact): boolean =>
            c.kind === "bear" && c.on.region === palm,
        );
      if (contact === undefined) return null;
      const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(
        pose(row),
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
   * Refuse a coupling whose borne mass no lean of the bearer balances.
   *
   * @param bearer The bearer's body.
   * @param coupling The coupling.
   * @throws {HumanRefusal} A `participant` refusal on `mass` with the feasible mass.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bound and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation `HumanLoad.lean` is null exactly when `m d > M h`; the feasible mass is `M h / |d|`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One load, one test.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The mass is refused, never clamped to the bound.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work after `load`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `load` and `HumanLoad.lean`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure check.
   */
  export function bearable(
    bearer: IHumanBody,
    coupling: AutoMovieMotionMeeting.ICoupling,
  ): void {
    const props: Parameters<typeof HumanLoad.lean>[0] = load(bearer, coupling);
    if (HumanLoad.lean(props) !== null) return;
    const feasible: number = (props.mass * props.height) / Math.abs(props.ahead);
    throw new HumanRefusal({
      kind: "participant",
      axis: "mass",
      value: coupling.mass,
      feasible: { kind: "range", minimum: 0, maximum: feasible, unit: "kg" },
      reason: `a borne mass of ${coupling.mass.toFixed(1)} kg ${Math.abs(props.ahead).toFixed(2)} m from a bearer of ${props.mass.toFixed(1)} kg with its centre ${props.height.toFixed(2)} m high has a moment no lean balances`,
      fix: `carry at most ${feasible.toFixed(1)} kg in this carry, or choose a carry that holds the body closer`,
    });
  }

  /** The posture of a body standing still at the origin. */
  const still = (): IHumanPosture => ({
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  });

  /** The carry's key posture of the borne body at the origin. */
  const pose = (row: HumanCarried.IRow): IHumanPosture => {
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
  };

  /** A region's world point on resolved bones. */
  const region = (
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    name: AutoMovieHumanoidRegion,
  ): IAutoMovieVector3 => {
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
  };

  /** The contact window part a region's bone belongs to. */
  const part = (
    body: IHumanBody,
    name: AutoMovieHumanoidRegion,
  ): IHumanContactWindow["part"] => {
    const bone: AutoMovieHumanoidBone = body.surfaces.regions[name].bone;
    const limb: IHumanContactWindow["part"] | undefined = (
      {
        leftHand: "leftHand",
        rightHand: "rightHand",
        leftFoot: "leftFoot",
        rightFoot: "rightFoot",
        leftUpperArm: "leftUpperArm",
        rightUpperArm: "rightUpperArm",
        leftLowerArm: "leftLowerArm",
        rightLowerArm: "rightLowerArm",
        leftUpperLeg: "leftUpperLeg",
        rightUpperLeg: "rightUpperLeg",
        leftLowerLeg: "leftLowerLeg",
        rightLowerLeg: "rightLowerLeg",
      } as Partial<Record<AutoMovieHumanoidBone, IHumanContactWindow["part"]>>
    )[bone];
    return limb ?? (bone === "hips" ? "seat" : "back");
  };

  /**
   * The least-norm load shares of points whose weighted centre lies under a
   * centre: `w = A^T (A A^T)^-1 b` for the rows (1, x, z); equal shares when
   * the points are collinear in plan; a negative share set to none and the
   * rest renormalized.
   */
  const shares = (
    points: readonly IAutoMovieVector3[],
    centre: IAutoMovieVector3,
  ): number[] => {
    const n: number = points.length;
    const equal: number[] = points.map((): number => 1 / n);
    if (n === 1) return [1];
    const rows: number[][] = [
      points.map((): number => 1),
      points.map((p: IAutoMovieVector3): number => p.x),
      points.map((p: IAutoMovieVector3): number => p.z),
    ];
    const g: number[][] = rows.map((a: number[]): number[] =>
      rows.map((b: number[]): number =>
        a.reduce((s: number, v: number, i: number): number => s + v * b[i]!, 0),
      ),
    );
    const det = (m: number[][]): number =>
      m[0]![0]! * (m[1]![1]! * m[2]![2]! - m[1]![2]! * m[2]![1]!) -
      m[0]![1]! * (m[1]![0]! * m[2]![2]! - m[1]![2]! * m[2]![0]!) +
      m[0]![2]! * (m[1]![0]! * m[2]![1]! - m[1]![1]! * m[2]![0]!);
    const d: number = det(g);

    // Collinear points in plan: the three equations are singular.
    const scale: number = Math.max(...g.flat().map(Math.abs));
    if (!(Math.abs(d) > Number.EPSILON * scale * scale * scale)) return equal;
    const b: number[] = [1, centre.x, centre.z];
    const lambda: number[] = [0, 1, 2].map((column: number): number =>
      det(
        g.map((r: number[], i: number): number[] =>
          r.map((v: number, j: number): number => (j === column ? b[i]! : v)),
        ),
      ) / d,
    );
    const raw: number[] = points.map(
      (_: IAutoMovieVector3, i: number): number =>
        lambda[0]! * rows[0]![i]! +
        lambda[1]! * rows[1]![i]! +
        lambda[2]! * rows[2]![i]!,
    );
    const kept: number[] = raw.map((w: number): number => Math.max(0, w));
    const sum: number = kept.reduce((s: number, w: number): number => s + w, 0);
    return sum > 0 ? kept.map((w: number): number => w / sum) : equal;
  };
}

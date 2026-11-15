import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { HumanCarried } from "./HumanCarried";
import { HumanCarriedCouplingLoad } from "./HumanCarriedCouplingLoad";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";

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
 * - **Two helpers.** A carry with another side (`PAIRED`: a supported
 *   walk) takes a second helper as the role `second`, standing where its
 *   side's region meets the borne body's on that side; the borne body rests
 *   on both, each helper bearing its contacts' share.
 *
 * First pass: the key pose is the carry's table posture, not a whole-body
 * fit of both bodies (`HumanBodyFit`); the borne centre is read with the
 * arms at their clinical zero; the bearer's sideways moment (a supported
 * walk) is not balanced, as `HumanLoad.lean` leans only along the facing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the key pose, the contacts, the load shares with their law, the per-instant solve with its source, the capacity bound with its derivation and search record, and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A meeting kind with a coupling of plain data in the bearer's hips frame, the shared record of a coupled pair; the borne body's place is a rigid registration of its key pose on the bearer's contacts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The roles, the second side's table, the hold table, the kind and the coupling; the shares, the load and the capacity are `HumanCarriedCouplingLoad`'s, the borne posture and the holds `HumanCarriedCouplingPose`'s, the carries' rows stay `HumanCarried`'s and the lean `HumanLoad`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The borne body is placed on every bearing contact at once, never on one bone, and a mass no lean balances is refused, never clamped.
 */
export namespace HumanCarriedCoupling {
  /** The bearing role's name. */
  export const BEARER: string = "bearer";

  /** The borne role's name. */
  export const BORNE: string = "borne";

  /** The second bearer's role name, when a borne body walks between two helpers. */
  export const SECOND: string = "second";

  /** The carry the second helper takes beside each carry that has one: a supported walk's other side. */
  export const PAIRED: Readonly<
    Partial<Record<HumanCarried.Carry, HumanCarried.Carry>>
  > = {
    supported: "supportedLeft",
  };

  /**
   * The borne region each bearer hand holds, left hand then right, from the
   * carries' common descriptions: piggyback, under the thighs; cradle, under
   * the back and the knees; over the shoulder, the back of the thighs;
   * supported, the far hip; a waist lift face to face, the facing hips; an overhead lift, the hips from below; the armpit drag, under the arms; the collar
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
    waistLift: ["hipRight", "hipLeft"],
    overheadLift: ["hipLeft", "hipRight"],
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
   * @param paired Whether a second helper takes the carry's other side (`PAIRED`), as the role `second`.
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
    paired: boolean = false,
  ): AutoMovieMotionMeeting.IKind {
    const other: HumanCarried.Carry | undefined = paired
      ? PAIRED[carry]
      : undefined;
    return {
      name: `carried:${carry}${other === undefined ? "" : `+${other}`}`,
      roles: other === undefined ? [BEARER, BORNE] : [BEARER, BORNE, SECOND],
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
        const second: AutoMovieMotionMeeting.IRole | undefined = roles.find(
          (r: AutoMovieMotionMeeting.IRole): boolean => r.name === SECOND,
        );
        return couple(
          bearer.body,
          borne.body,
          rows[carry],
          carry,
          extra,
          other === undefined || second === undefined
            ? undefined
            : { body: second.body, row: rows[other], carry: other },
        );
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
   * @param second A second helper on the carry's other side: its body, its side's row and carry; none when absent.
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
    second?: {
      body: IHumanBody;
      row: HumanCarried.IRow;
      carry: HumanCarried.Carry;
    },
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
    const stand: IHumanPosture = HumanCarriedCouplingPose.still();
    const theirs: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(bearer, stand);
    const hips: IAutoMovieResolvedBone = theirs.get("hips")!;
    const keyed: IHumanPosture = HumanCarriedCouplingPose.key(row);
    // A lift held at the arms' reach rests its region that far above.
    const root: IAutoMovieVector3 = Vector3.subtract(
      Vector3.add(HumanCarriedCouplingPose.region(bearer, theirs, row.theirs), {
        x: 0,
        y: (row.rise ?? 0) * (bearer.measure.upperArm + bearer.measure.forearm),
        z: 0,
      }),
      HumanCarriedCouplingPose.region(borne, HumanTrunk.resolve(borne, keyed), row.mine),
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

    // A second helper stands where its side's region meets the borne
    // body's region on that side, facing as the first does.
    const besides: {
      role: string;
      row: HumanCarried.IRow;
      carry: HumanCarried.Carry;
    }[] = [{ role: BEARER, row, carry }];
    const bearers: Record<
      string,
      { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion }
    > = {};
    if (second !== undefined) {
      const still: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        HumanTrunk.resolve(second.body, stand);
      const shift: IAutoMovieVector3 = Vector3.subtract(
        HumanCarriedCouplingPose.region(borne, mine, second.row.mine),
        HumanCarriedCouplingPose.region(second.body, still, second.row.theirs),
      );
      const theirsHips: IAutoMovieResolvedBone = still.get("hips")!;
      bearers[SECOND] = {
        position: local(Vector3.add(theirsHips.worldPosition, shift)),
        rotation: Quaternion.normalize(
          Quaternion.multiply(inverse, theirsHips.worldRotation),
        ),
      };
      besides.push({ role: SECOND, row: second.row, carry: second.carry });
    }

    // The contacts: each bearer's resting region, its palms under the held
    // regions, and the clinging hands.
    const bearing: {
      role: string;
      region: AutoMovieHumanoidRegion;
      on: AutoMovieHumanoidRegion;
    }[] = [];
    for (const side of besides) {
      bearing.push({
        role: side.role,
        region: side.row.mine,
        on: side.row.theirs,
      });
      (["left", "right"] as const).forEach(
        (hand: "left" | "right", index: number): void => {
          const held: AutoMovieHumanoidRegion | null =
            side.row.holds[index] === null
              ? null
              : (HOLDS[side.carry][index] ?? null);
          if (held !== null)
            bearing.push({
              role: side.role,
              region: held,
              on: hand === "left" ? "palmLeft" : "palmRight",
            });
        },
      );
    }
    const model: resolveAutoMovieCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(borne.skeleton, borne.profile);
    const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      model,
      mine,
    );
    const loads: number[] = HumanCarriedCouplingLoad.shares(
      bearing.map(
        (b: {
          region: AutoMovieHumanoidRegion;
          on: AutoMovieHumanoidRegion;
        }): IAutoMovieVector3 => HumanCarriedCouplingPose.region(borne, mine, b.region),
      ),
      centre,
    );
    const contacts: AutoMovieMotionMeeting.ICoupledContact[] = bearing.map(
      (
        b: {
          role: string;
          region: AutoMovieHumanoidRegion;
          on: AutoMovieHumanoidRegion;
        },
        index: number,
      ): AutoMovieMotionMeeting.ICoupledContact => ({
        part: part(borne, b.region),
        region: b.region,
        on: { role: b.role, region: b.on },
        kind: "bear",
        load: loads[index]!,
      }),
    );
    for (const side of besides)
      (["left", "right"] as const).forEach(
        (hand: "left" | "right", index: number): void => {
          const cling: AutoMovieHumanoidRegion | null =
            side.row.clings[index] ?? null;
          if (cling !== null)
            contacts.push({
              part: hand === "left" ? "leftHand" : "rightHand",
              region: hand === "left" ? "palmLeft" : "palmRight",
              on: { role: side.role, region: cling },
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
            resolveHumanPosture.heading(HumanCarriedCouplingPose.key(row)),
          ),
        ),
      },
      ...(second === undefined ? {} : { bearers }),
    };
    HumanCarriedCouplingLoad.bearable(bearer, coupling);
    if (second !== undefined)
      HumanCarriedCouplingLoad.bearable(second.body, coupling, SECOND);
    return coupling;
  }

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
}

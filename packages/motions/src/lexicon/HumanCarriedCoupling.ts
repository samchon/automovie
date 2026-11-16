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
import { HumanCarriedCouplingFit } from "./HumanCarriedCouplingFit";
import { HumanCarriedCouplingLoad } from "./HumanCarriedCouplingLoad";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";
import { HumanCarriedDrag } from "./HumanCarriedDrag";

/**
 * The coupling of a named carry (#3437): the meeting kind whose borne role
 * rests on the bearer by several contacts with load shares, whose borne mass
 * and centre enter the bearer's balance, and the per-instant solve that puts
 * the borne body on the bearer's displayed regions.
 *
 * - **Key pose.** The carry's posture of the borne body (its heading, tip and
 *   leg angles, `HumanCarried.CARRIES`) placed with its resting region on
 *   the bearer's region, and turned about that point so its held regions
 *   come nearest the places the row's holds put the bearer's hands; the
 *   borne legs and a lone bearer's stance (trunk inclination and knee
 *   lowering) are the carry's own and upright changed least so every hold
 *   lies within its arm, a hold beyond it refused
 *   (`HumanCarriedCouplingFit.fit`); it is a pure function
 *   of the two bodies and the carry, so the record is the same whichever
 *   role plans first and wherever the pair stands.
 * - **Floor.** A drag (`HumanCarriedDrag`) also rests the dragged body's
 *   lowest region on the floor (role `ground`), which takes its share of the
 *   weight, so a dragger carries only what its contacts bear.
 * - **Contacts.** The resting region on the bearer's region, unless a lift
 *   holds it at the arms' reach above (`IRow.rise`), where it touches
 *   nothing; each bearer hand's palm under the borne region it holds
 *   (`HOLDS`), both bearing; and each clinging hand on the bearer's region
 *   it clings to, a grip.
 * - **Load shares.** The bearing contacts' shares of the borne weight are
 *   the least-norm shares whose weighted centre lies under the borne centre
 *   of mass, the vertical reactions of a body at rest on point supports
 *   (static equilibrium of forces and of the moments about the vertical's
 *   two horizontal axes).
 * - **Borne body per instant.** The borne key pose rides the bone its
 *   resting region lies on (the anchor), a parent constraint at the key
 *   offset, as a held object keeps its offset in the hand: the resting
 *   region stays on its region however the bearer's trunk turns and bends.
 *   The bearer's hands reach the held regions in the same anchor frame
 *   (`HumanCarriedCouplingPose.holds`). It is per instant, with no state,
 *   so it cannot lag a turning bearer.
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
 * First pass: the key pose is the carry's table posture with its legs and
 * the bearer's stance fitted, not a whole-body fit of both bodies
 * (`HumanBodyFit`); the borne centre is read with the
 * arms at their clinical zero. The bearer tips by the pair's balance
 * forward and sideways (`HumanCarriedCouplingLoad.lean`); the capacity
 * reads the moment along the facing alone (`HumanLoad.lean`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the key pose, the contacts, the load shares with their law, the per-instant solve with its source, the capacity bound with its derivation and search record, and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A meeting kind with a coupling of plain data in the frame of the bearer's bone the borne body rides, the shared record of a coupled pair; the borne body's place is a rigid registration of its key pose on the bearer's contacts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The roles, the second side's table, the hold table, the kind and the coupling; the shares, the load and the capacity are `HumanCarriedCouplingLoad`'s, the borne posture and the holds `HumanCarriedCouplingPose`'s, the carries' rows stay `HumanCarried`'s and the lean `HumanLoad`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The borne body is placed on every bearing contact at once, never on one bone, and a mass no lean balances is refused, never clamped.
 */
export namespace HumanCarriedCoupling {
  /** The bearing role's name. */
  export const BEARER: string = "bearer";

  /** The borne role's name. */
  export const BORNE: string = "borne";

  /** The floor as the role of a borne body's contact on it: a drag's trailing region. */
  export const GROUND: string = "ground";

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
   * @returns The coupling, its key, holds and centre in the frame of the bearer's bone the resting region rides on.
   * @throws {HumanRefusal} A `participant` refusal on `mass` with the feasible borne mass, when no lean of the bearer balances it; a `reach` refusal on `carry` when no bearer's stance and borne legs within their ranges bring a held region within the bearer's arm (`HumanCarriedCouplingFit.fit`); a `parameter` refusal on `mass` for a negative extra mass.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the frame of the result and both refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The key pose places the borne resting region on the bearer's at the bearer's fitted stance and turns it about that point to the row's hold places, a lone bearer's stance and the borne legs changed least so the arms reach (`HumanCarriedCouplingFit.fit`), and the record keeps both so the bearer takes that stance and the borne body those legs; each contact is read on both key bodies; the bearing shares are the least-norm solution of the three equilibrium equations (the shares sum to one and their centre lies under the borne centre); the capacity is the moment-balance bound of `HumanLoad.lean`.
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
    // A lone bearer's stance and the borne legs are fitted so its arms
    // reach the holds; a second helper keeps both bearers upright.
    const fit: HumanCarriedCouplingFit.IFit = HumanCarriedCouplingFit.fit(
      bearer,
      borne,
      row,
      HOLDS[carry],
      second === undefined,
    );
    const theirs: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanCarriedCouplingPose.stood(bearer, fit.stance);
    // The key frame is the bone the resting region rides on, so the borne
    // body goes with that bone wherever the bearer's action takes it.
    const anchor: AutoMovieHumanoidBone = HumanCarriedCouplingPose.anchor(
      bearer,
      row.theirs,
    );
    const anchored: IAutoMovieResolvedBone = theirs.get(anchor)!;
    const keyed: IHumanPosture = HumanCarriedCouplingPose.key(row, fit.legs);
    const root: IAutoMovieVector3 = fit.place({ x: 0, y: 0, z: 0 });
    const mine: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(borne, keyed);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      anchored.worldRotation,
    );
    const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(point, anchored.worldPosition),
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
      {
        position: IAutoMovieVector3;
        rotation: IAutoMovieQuaternion;
        anchor: AutoMovieHumanoidBone;
      }
    > = {};
    if (second !== undefined) {
      const still: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        HumanCarriedCouplingPose.stood(second.body, { incline: 0, depth: 0 });
      const shift: IAutoMovieVector3 = Vector3.subtract(
        fit.place(
          HumanCarriedCouplingPose.region(borne, mine, second.row.mine),
        ),
        HumanCarriedCouplingPose.region(second.body, still, second.row.theirs),
      );
      const own: AutoMovieHumanoidBone = HumanCarriedCouplingPose.anchor(
        second.body,
        second.row.theirs,
      );
      const bone: IAutoMovieResolvedBone = still.get(own)!;
      bearers[SECOND] = {
        position: local(Vector3.add(bone.worldPosition, shift)),
        rotation: Quaternion.normalize(
          Quaternion.multiply(inverse, bone.worldRotation),
        ),
        anchor: own,
      };
      besides.push({ role: SECOND, row: second.row, carry: second.carry });
    }

    // The contacts: each bearer's resting region, which a lift held at the
    // arms' reach leaves in the air (`IRow.rise`), its palms under the held
    // regions, and the clinging hands.
    const bearing: {
      role: string;
      region: AutoMovieHumanoidRegion;
      on: AutoMovieHumanoidRegion;
    }[] = [];
    for (const side of besides) {
      if (!((side.row.rise ?? 0) > 0))
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
    const centre: IAutoMovieVector3 = fit.place(
      resolveAutoMovieCenterOfMass.place(model, mine),
    );

    // A drag leaves the dragged body's lowest region on the floor, which
    // bears its share of the weight with the dragger's contacts.
    if (carry in HumanCarriedDrag.CARRIES) {
      let lowest: AutoMovieHumanoidRegion | null = null;
      let height: number = Number.POSITIVE_INFINITY;
      for (const name of Object.keys(
        borne.surfaces.regions,
      ) as AutoMovieHumanoidRegion[]) {
        const y: number = fit.place(
          HumanCarriedCouplingPose.region(borne, mine, name),
        ).y;
        if (y < height) {
          height = y;
          lowest = name;
        }
      }
      if (lowest !== null)
        bearing.push({ role: GROUND, region: lowest, on: lowest });
    }
    const loads: number[] = HumanCarriedCouplingLoad.shares(
      bearing.map(
        (b: {
          region: AutoMovieHumanoidRegion;
          on: AutoMovieHumanoidRegion;
        }): IAutoMovieVector3 =>
          fit.place(HumanCarriedCouplingPose.region(borne, mine, b.region)),
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
      anchor,
      key: {
        position: local(root),
        rotation: Quaternion.normalize(
          Quaternion.multiply(
            inverse,
            Quaternion.multiply(fit.turn, resolveHumanPosture.heading(keyed)),
          ),
        ),
        legs: fit.legs,
        stance: fit.stance,
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

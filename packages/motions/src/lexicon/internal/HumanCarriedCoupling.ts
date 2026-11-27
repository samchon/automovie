import type {
  IAutoMovieMotionCoupling,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanCarriedCoupling,
  IAutoMovieMotionMeetingKind,
  IAutoMovieMotionMeetingRole,
  IAutoMovieMotionMeetingTiming,
} from "@automovie/interface";

import { HumanCarriedCouplingCouple } from "./HumanCarriedCouplingCouple";

/*
 * The coupling of a named carry: the meeting kind whose borne role rests on the
 * bearer by several contacts with load shares, whose borne mass and centre
 * enter the bearer's balance, and the per-instant solve that puts the borne
 * body on the bearer's displayed regions.
 *
 * - **Key pose.** The carry's posture of the borne body (its heading, tip and leg
 *   angles, `HumanCarried.CARRIES`) placed with its resting region on the
 *   bearer's region, and turned about that point so its held regions come
 *   nearest the places the row's holds put the bearer's hands; the borne legs
 *   and a lone bearer's stance (trunk inclination and knee lowering) are the
 *   carry's own and upright changed least so every hold lies within its arm, a
 *   hold beyond it refused (`HumanCarriedCouplingFit.fit`); it is a pure
 *   function of the two bodies and the carry, so the record is the same
 *   whichever role plans first and wherever the pair stands.
 * - **Floor.** A drag (`HumanCarriedDrag`) also rests the dragged body's lowest
 *   region on the floor (role `ground`), which takes its share of the weight,
 *   so a dragger carries only what its contacts bear.
 * - **Contacts.** The resting region on the bearer's region, unless a lift holds
 *   it at the arms' reach above (`IRow.rise`), where it touches nothing; each
 *   bearer hand's palm under the borne region it holds (`HOLDS`), both bearing;
 *   and each clinging hand on the bearer's region it clings to, a grip.
 * - **Load shares.** The bearing contacts' and the clinging hands' shares of the
 *   borne weight, each a point support at its region (a clinging hand at its
 *   palm), are the least-norm shares whose weighted centre lies under the borne
 *   centre of mass, the vertical reactions of a body at rest on point supports
 *   (static equilibrium of forces and of the moments about the vertical's two
 *   horizontal axes), none of them a pull.
 * - **Borne body per instant.** The borne key pose rides the bone its resting
 *   region lies on (the anchor), a parent constraint at the key offset, as a
 *   held object keeps its offset in the hand: the resting region stays on its
 *   region however the bearer's trunk turns and bends. The bearer's hands reach
 *   the held regions in the same anchor frame
 *   (`HumanCarriedCouplingPose.holds`). It is per instant, with no state, so it
 *   cannot lag a turning bearer.
 * - **Capacity.** The borne mass is refused above the mass whose moment about the
 *   bearer's base exceeds the bearer's own at a right angle, `m d <= M h`, the
 *   bound beyond which no lean balances the pair (`HumanLoad.lean`). No study
 *   of person-carrying capacity was found (a search on casualty-carry capacity
 *   relative to the rescuer's mass returned none), so no tighter per-carry
 *   bound is set.
 * - **Two helpers.** A carry with another side (`PAIRED`: a supported walk) takes
 *   a second helper as the role `second`, standing where its side's region
 *   meets the borne body's on that side; the borne body rests on both, each
 *   helper bearing its contacts' share.
 *
 * First pass: the key pose is the carry's table posture with its legs and the
 * bearer's stance fitted, not a whole-body fit of both bodies (`HumanBodyFit`);
 * the borne centre is read with the arms at their clinical zero. The bearer
 * tips by the pair's balance forward and sideways
 * (`HumanCarriedCouplingLoad.lean`); the capacity reads the moment along the
 * facing alone (`HumanLoad.lean`).
 */
export namespace HumanCarriedCoupling {
  /*
   * The bearing role's name.
   */
  export const BEARER: string = "bearer";

  /*
   * The borne role's name.
   */
  export const BORNE: string = "borne";

  /*
   * The floor as the role of a borne body's contact on it: a drag's trailing
   * region.
   */
  export const GROUND: string = "ground";

  /*
   * The second bearer's role name, when a borne body walks between two helpers.
   */
  export const SECOND: string = "second";

  /*
   * The carry the second helper takes beside each carry that has one: a
   * supported walk's other side.
   */
  export const PAIRED: Readonly<
    Partial<
      Record<
        IAutoMovieMotionHumanCarried.Carry,
        IAutoMovieMotionHumanCarried.Carry
      >
    >
  > = {
    supported: "supportedLeft",
  };

  /*
   * The borne region each bearer hand holds, left hand then right, from the
   * carries' common descriptions: piggyback, under the thighs; cradle, under
   * the back and the knees; over the shoulder, the back of the thighs;
   * supported, the far hip; a waist lift face to face, the facing hips; an
   * overhead lift, the hips from below; a shoulder ride, the shins; the armpit
   * drag, under the arms; the collar drag, the collar; the ankle drag, the
   * ankles. A carry whose row turns the borne body to face the bearer (the
   * waist lift, the ankle drag) puts the borne body's right on the bearer's
   * left, so each hand holds the borne region of the other side. Null where the
   * carry's own row has no hold on that side.
   */
  export const HOLDS: HumanCarriedCouplingCouple.IContacts["HOLDS"] = {
    piggyback: ["thighOuterLeft", "thighOuterRight"],
    cradle: ["upperBack", "kneeRight"],
    overShoulder: [null, "thighOuterRight"],
    supported: [null, "hipRight"],
    supportedLeft: ["hipLeft", null],
    waistLift: ["hipRight", "hipLeft"],
    overheadLift: ["hipLeft", "hipRight"],
    shoulders: ["shinLeft", "shinRight"],
    armpitDrag: ["ribsLeft", "ribsRight"],
    collarDrag: ["nape", "nape"],
    ankleDrag: ["calfRight", "calfLeft"],
  };

  /*
   * The nearer grips a bearer takes, in order, where every described hold of
   * `HOLDS` lies beyond its arm: a supporting helper too short to reach the far
   * hip puts the arm round the back of the waist instead, the two-person
   * assist's arm about the waist (St John Ambulance, St Andrew's First Aid and
   * British Red Cross, First Aid Manual, 10th ed., Dorling Kindersley 2014,
   * "Moving a casualty"). A carry absent here has no nearer grip.
   */
  export const NEARER: HumanCarriedCouplingCouple.IContacts["NEARER"] = {
    supported: [[null, "lowerBack"]],
    supportedLeft: [["lowerBack", null]],
  };

  /*
   * The meeting kind of a carry: roles `bearer` and `borne`, no shared default
   * place, the contact made at the start and held for as long as the carry's
   * window says, and the coupling.
   * Parameter carry: The carry.
   * Parameter rows: The carries' rows (`HumanCarried.CARRIES`), passed by the
   * caller so this file does not import its consumer.
   * Parameter extra: Kilograms the borne person carries besides their body; none
   * when absent.
   * Parameter paired: Whether a second helper takes the carry's other side
   * (`PAIRED`), as the role `second`.
   * Returns: The kind.
   */
  export function kind(
    carry: IAutoMovieMotionHumanCarried.Carry,
    rows: Readonly<
      Record<
        IAutoMovieMotionHumanCarried.Carry,
        IAutoMovieMotionHumanCarried.IRow
      >
    >,
    extra: number = 0,
    paired: boolean = false,
  ): IAutoMovieMotionMeetingKind {
    const other: IAutoMovieMotionHumanCarried.Carry | undefined = paired
      ? PAIRED[carry]
      : undefined;
    return {
      name: `carried:${carry}${other === undefined ? "" : `+${other}`}`,
      roles: other === undefined ? [BEARER, BORNE] : [BEARER, BORNE, SECOND],
      contacts: {},
      timing: (): IAutoMovieMotionMeetingTiming => ({
        ready: 0,
        stroke: 0,
        relax: 0,
      }),
      couple: (
        roles: readonly IAutoMovieMotionMeetingRole[],
      ): IAutoMovieMotionCoupling => {
        const bearer: IAutoMovieMotionMeetingRole = roles.find(
          (r: IAutoMovieMotionMeetingRole): boolean => r.name === BEARER,
        )!;
        const borne: IAutoMovieMotionMeetingRole = roles.find(
          (r: IAutoMovieMotionMeetingRole): boolean => r.name === BORNE,
        )!;
        const second: IAutoMovieMotionMeetingRole | undefined = roles.find(
          (r: IAutoMovieMotionMeetingRole): boolean => r.name === SECOND,
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

  /*
   * The coupling of a carry between two bodies, refused when the bearer cannot
   * balance the borne mass: the solve of `HumanCarriedCouplingCouple`.
   * Parameter bearer: The bearer's body.
   * Parameter borne: The borne body.
   * Parameter row: The carry's row.
   * Parameter carry: The carry, for its holds.
   * Parameter extra: Kilograms the borne person carries besides their body.
   * Parameter second: A second helper on the carry's other side: its body, its
   * side's row and carry; none when absent.
   * Returns: The coupling, its key, holds and centre in the frame of the
   * bearer's bone the resting region rides on.
   * As `HumanCarriedCouplingCouple.couple` refuses.
   */
  export function couple(
    bearer: IAutoMovieMotionHumanBody,
    borne: IAutoMovieMotionHumanBody,
    row: IAutoMovieMotionHumanCarried.IRow,
    carry: IAutoMovieMotionHumanCarried.Carry,
    extra: number = 0,
    second?: IAutoMovieMotionHumanCarriedCoupling.ICoupleSecond,
  ): IAutoMovieMotionCoupling {
    return HumanCarriedCouplingCouple.couple(
      HumanCarriedCoupling,
      bearer,
      borne,
      row,
      carry,
      extra,
      second,
    );
  }
}

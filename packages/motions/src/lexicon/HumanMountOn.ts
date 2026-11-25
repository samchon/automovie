import { HumanMountOnPlan } from "./HumanMountOnPlan";

/**
 * Getting onto a high seat, or a seat sat astride, from standing beside or in
 * front of it: what `sit` plans where the feet cannot stay on the floor.
 *
 * The goal is the seat socket on its point on the seat (`seated.point`) and
 * each foot on its rest: the ball of the foot on the tread the seat names for
 * that side, the foot level. A foot whose seat names no rest, or whose rest the
 * seated leg cannot reach, hangs under a thigh in the direction
 * `HumanMount.HANG` gives, or stands on the floor where that would pass it. The
 * root follows from the socket and the trunk's pitch, and the legs are solved
 * by inverse kinematics; a swinging leg is keyed in joint space where its
 * course leaves the leg's range (`HumanSwungLeg`), so a course over a saddle
 * past the hip's range never flips its knee. The hands go from hanging to the
 * thighs over the climb as planned courses (`HumanMountOnCourses`), clear of
 * the trunk as it rises, swings and turns onto the seat.
 *
 * The socket travels up from 10 % of the climb, passes `HumanMount.HOP` above
 * the seat and sets down on it at 80 %, the `seatContact`. It crosses to a seat
 * sat on with the legs ahead over the first 70 %, and to one sat astride from
 * 30 to 80 %, after the far leg has left the floor. The leading foot goes to
 * its place from 10 to 45 %: the left one, or astride the one on the side the
 * performer stands. The other foot pushes off the floor, its heel rolling up
 * over the ball, until the extended leg's toes leave, at the latest at the
 * contact, or astride at 35 %, then follows over 30 % of the climb; astride it
 * crosses as the pelvis crosses, arriving at the contact, its ankle passing
 * above and behind the seat (`HumanMount.OVER`). Astride, the leading foot
 * bears on its rest from its arrival, so the body rises standing in the near
 * stirrup while the far leg swings over, as a rider mounts from the ground
 * (Geutjens, Clayton and Kuhnke 2008, Vet J 175:332); any other foot bears on
 * its rest once the seat has taken the body and the foot has arrived, since
 * nothing else holds its rest under a pelvis that still travels. A seat with no
 * rest for the leading foot leaves the body off the floor between the push-off
 * and the contact, as in a hop onto a stool. A seat on a carrier
 * (`IAutoMovieMotionHumanSeated.ISeat.carrier`) bears, with its rests, on that
 * carrier, while the floor plants stay on the floor the feet leave.
 *
 * It continues from the entry: a foot the entry holds off the floor, on a rest,
 * hanging or in flight, goes on from where it is, and a body already on the
 * seat, as when getting off was broken off, settles over `HumanMount.SETTLE`
 * seconds with no climb. `commit` is the instant the first foot leaves the
 * floor, the last at which the sitting can be abandoned for standing.
 *
 * The climb lasts `2 (1 + 0.6 (r - 1))` seconds for a seat at `r` of the
 * popliteal height, at most 4 (provisional, continuing the sit's time), and the
 * trunk leans forward `HumanMount.LEAN` degrees at 40 % of it. First pass: the
 * pelvis does not turn toward the seat while a leg swings over, and the hands
 * do not hold the seat, a pommel or a bar.
 */
export namespace HumanMountOn {
  /** {@link HumanMountOnPlan}, read through this namespace. */
  export const plan: typeof HumanMountOnPlan = HumanMountOnPlan;
}

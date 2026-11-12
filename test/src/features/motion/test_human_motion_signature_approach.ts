import {
  type IAutoMovieResolvedBone,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { IHumanBody } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * Walking up to a person looks like it: the walk's signature on the way and
 * a stop at the asked interpersonal distance, facing the person, on the four
 * extreme bodies with the average man 3 m ahead.
 *
 * Bounds and sources:
 * - Distance: Hall's proxemic zones (Hall 1966, The Hidden Dimension):
 *   intimate up to 0.46 m, personal 0.46 to 1.22 m, social 1.22 to 3.66 m,
 *   measured here between the two people's sternum regions over the floor
 *   when the approach ends.
 * - Facing: the approach ends facing the person (the law's own goal): the
 *   heading of the performer's hips points at the partner's sternum within
 *   15 degrees (provisional; a person facing someone squares up).
 * - Trunk: the walk carries the trunk forward a few degrees (Thorstensson et
 *   al. 1984, Acta Physiol Scand 121:9). Bound: mean inclination over the
 *   travel in [0, 10] degrees, the upper limit provisional.
 * - Duty factor: a walk keeps a foot down more than half the time
 *   (Alexander 1984, Int J Robot Res 3:49). Bound: above 0.55 over the
 *   travel.
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, the trunk segment of the cited studies, and
 * the quiet stance must read within 3 degrees of vertical under it
 * (Kendall et al. 2005, ideal alignment; `motionHumanSignature.calibrate`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real approach on real bodies and reads displayed bones of both people; a stop in the wrong zone, a body not facing the person, a trunk tipped back or a gait with flight fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations The zones are Hall's; the facing is the law's stated goal; the gait bounds are cited.
 * @evidence contracts/development/testing.md#distinguishing-cases Three of Hall's zones, the default and the four sides on four bodies.
 * @evidence contracts/development/testing.md#execution-ownership In memory; named `test_human_` because a film of fitted poses is costly, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status.
 */
export function test_human_motion_signature_approach(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const zones: Record<string, [number, number]> = {
    "at=intimate": [0, 0.46],
    "at=personal": [0.46, 1.22],
    "at=social": [1.22, 3.66],
    default: [0.46, 1.22],
  };
  const sternum = (
    body: IHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieVector3 => {
    const frame = body.surfaces.regions.sternum;
    return resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!)
      .point;
  };
  for (const name of motionHumanBody.EXTREMES)
    for (const row of [
      ...Object.keys(zones),
      "side=front",
      "side=left",
      "side=right",
      "side=behind",
    ]) {
      const cell: string = `approach ${row} ${name}`;
      const s: M.IStaged = M.stage("approach", row, name);
      const partner: IHumanBody = motionHumanBody("m-average");
      const end: number = M.event(s, "arrive") ?? s.film.duration;
      const mine: IAutoMovieVector3 = sternum(s.body, M.bones(s, end));
      const theirs: IAutoMovieVector3 = sternum(
        partner,
        s.film.bones("b", end),
      );
      const gap: number = Math.hypot(mine.x - theirs.x, mine.z - theirs.z);
      const zone: [number, number] | undefined = zones[row];
      if (zone !== undefined)
        complaints.check(
          `${cell}: the sternums end ${gap.toFixed(3)} m apart, outside Hall's [${zone[0]}, ${zone[1]}] m (Hall 1966)`,
          gap >= zone[0] && gap <= zone[1],
        );
      const l = M.joint(s, end, "leftUpperLeg");
      const r = M.joint(s, end, "rightUpperLeg");
      // The hips' forward: perpendicular to the line from the right hip to
      // the left, turned to the front.
      const across = { x: l.x - r.x, z: l.z - r.z };
      const ahead = { x: -across.z, z: across.x };
      const to = {
        x: theirs.x - (l.x + r.x) / 2,
        z: theirs.z - (l.z + r.z) / 2,
      };
      const off: number =
        (Math.acos(
          Math.max(
            -1,
            Math.min(
              1,
              (ahead.x * to.x + ahead.z * to.z) /
                (Math.hypot(ahead.x, ahead.z) * Math.hypot(to.x, to.z)),
            ),
          ),
        ) *
          180) /
        Math.PI;
      complaints.check(
        `${cell}: the hips end ${off.toFixed(1)} deg off facing the partner, within 15 expected (provisional)`,
        off <= 15,
      );
      const last: number = M.event(s, "lastFootfall") ?? end;
      const from: number = 0.2 * last;
      const until: number = 0.8 * last;
      if (until - from > 0.6) {
        const lean: number = M.mean(M.times(from, until, 30), (t) =>
          M.trunk(s, t),
        );
        complaints.check(
          `${cell}: mean trunk inclination ${lean.toFixed(2)} deg over the travel outside [0, 10] (Thorstensson et al. 1984)`,
          lean >= 0 && lean <= 10,
        );
        const g: M.IGait = M.gait(s, from, until);
        complaints.check(
          `${cell}: duty factor ${g.duty.toFixed(3)} over the travel not above 0.55 (Alexander 1984)`,
          g.duty > 0.55,
        );
      }
    }
  for (const name of motionHumanBody.EXTREMES)
    for (const c of M.calibrate(name)) complaints.check(c, false);
  complaints.assert("the approach has the signature of walking up to someone");
}

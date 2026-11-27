import type {
  IAutoMovieJointPose,
  IAutoMovieMotionHumanAuditDifference,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionTarget,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditDifference
} from "../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditDifference";

import { motionHumanJointText } from "./motionHumanJointText";
import { motionHumanLaw } from "./motionHumanLaw";

/**
 * A touch row's mirror expectation: a one-hand row performed by the left hand
 * on the mirrored region is the mirror image of the right hand's film within 5
 * mm on every bone of `a`, in the world, read 4 times a second, and of the same
 * duration. Both films are performed with any partner standing exactly still,
 * since a partner's seeded sway is a draw no seed mirrors.
 *
 * @param label The row's name, the complaint's prefix.
 * @param params The row.
 * @param right The right-hand film when the row's film is already its mirror's
 *   right-hand side (no partner to still); absent to perform it with the
 *   partner stilled.
 * @param perform Performs a row, its partner stilled when `still` is true.
 * @returns The complaint when the mirror does not hold, with each film's acting
 *   arm and trunk at the worst second; none for a two-hand row.
 * @evidence contracts/development/common.md#meaningful-documentation States the relation, its bound, rate and duration condition, the stilled partner, the reused right-hand film and the two-hand exclusion.
 * @evidence contracts/development/implementation.md#principled-implementation Mirrors the region name's side and the acting hand, performs the left row and compares displayed bones with AutoMovieMotionHumanAuditDifference's reflection in x = 0, the body's median plane.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Flip the target, take or perform the right film, perform the left, measure once and report.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 5 mm and duration bounds are the relation's; the joint dumps are resolved only when it fails and change nothing measured.
 * @evidence contracts/development/implementation.md#efficient-algorithms One or two performances and a 4 Hz comparison; two poses are resolved only on failure.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A self-directed row's film has the same input as its right-hand mirror film, since stilling applies only to a partner, so the caller passes it instead of performing it again.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The films are local and released on return.
 */
export function motionHumanLawTouchMirror(
  label: string,
  params: IAutoMovieMotionHumanTouch.IParams,
  right: motionHumanLaw.IFilm | undefined,
  perform: (
    row: IAutoMovieMotionHumanTouch.IParams,
    still: boolean,
  ) => motionHumanLaw.IFilm,
): string[] {
  if (params.other !== undefined) return [];
  const flip = (target: IAutoMovieMotionTarget): IAutoMovieMotionTarget =>
    ({
      ...target,
      region: (target as { region: string }).region.replace(
        /Left|Right/,
        (found: string): string => (found === "Left" ? "Right" : "Left"),
      ),
    }) as IAutoMovieMotionTarget;
  const film: motionHumanLaw.IFilm = right ?? perform(params, true);
  const left: motionHumanLaw.IFilm = perform(
    {
      ...params,
      target: flip(params.target),
      hand: "left",
    },
    true,
  );
  const mirrored: IAutoMovieMotionHumanAuditDifference.IResult =
    AutoMovieMotionHumanAuditDifference.measure(film, left, "a", {
      mirror: 0,
      rate: 4,
    });

  // Each film's acting arm and trunk at the second, as clinical triples
  // that a mirror keeps equal, so a miss says which joint differs.
  const acting = (shown: motionHumanLaw.IFilm, side: string): string =>
    motionHumanJointText(
      shown,
      mirrored.distance.seconds,
      [
        "hips",
        "spine",
        "chest",
        `${side}UpperArm`,
        `${side}LowerArm`,
        `${side}Hand`,
      ],
      (joint: IAutoMovieJointPose): string =>
        `${joint.bone.replace(side, "")} ${(joint.flexion ?? 0).toFixed(1)}/${(joint.abduction ?? 0).toFixed(1)}/${(joint.twist ?? 0).toFixed(1)}`,
      ", ",
    );
  return motionHumanLaw.expect(
    (): string =>
      `${label}: the left-hand touch is ${(mirrored.distance.value * 1000).toFixed(1)} mm off the right-hand touch's mirror at ${mirrored.distance.seconds.toFixed(2)} s on ${mirrored.distance.where} (limit 5.0; right ${acting(film, "right")}; left ${acting(left, "left")})`,
    mirrored.distance.value <= 0.005 && mirrored.duration <= 1e-9,
  );
}

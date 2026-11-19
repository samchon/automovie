import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBallSport,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionPropLaunch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { throwObjectLaunch } from "../throwing/throwObjectLaunch";

/**
 * Publish the prop held in both hands until a football throw-in releases it.
 * An implied ball needs neither grips nor a launch.
 *
 * @param params The optional ball subject and world aim point.
 * @param clock The action clock whose stroke is the release.
 * @param point The release point in world metres.
 * @param degrees The rise of the path's release velocity, in degrees.
 * @returns Both grip windows and the release when a real ball is named.
 * @throws {HumanRefusal} If the named ball has no aim point or the point is unreachable at the given angle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the optional ball, two hands, release clock, aim and refusals.
 * @evidence contracts/development/implementation.md#principled-implementation Publishes the two grips until the stroke and the aimed physical launch at that same stroke.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admits the target before constructing custody and flight records.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the authored aim for a real ball and does not invent a target for an implied one.
 * @evidence contracts/development/implementation.md#efficient-algorithms One directed launch solve and two grip records, only for a named ball.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared throw owner solves the velocity and supplies the publication.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns only the two contacts and launch without retaining the clock or parameters.
 */
export function throwInRelease(
  params: IAutoMovieMotionHumanBallSport.IParams,
  clock: IAutoMovieMotionClock,
  point: IAutoMovieVector3,
  degrees: number,
):
  | {
      contacts: IAutoMovieMotionHumanContactWindow[];
      launches: IAutoMovieMotionPropLaunch[];
    }
  | undefined {
  const { prop, at }: IAutoMovieMotionHumanBallSport.IParams = params;
  if (prop === undefined) return undefined;
  if (at === undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "at",
      value: null,
      feasible: { kind: "alternatives", values: [] },
      reason: `a throw-in of ${prop} needs the point its path passes through`,
      fix: "give `at`, or leave out `prop` for an implied ball",
    });
  const velocity: IAutoMovieVector3 | undefined = throwObjectLaunch.aimed(
    point,
    at,
    degrees,
  );
  if (velocity === undefined)
    throw new HumanRefusal({
      kind: "reach",
      axis: "at",
      value: at,
      reason: `a throw-in rising at ${degrees} degrees cannot reach a point above that line or straight above the release`,
      fix: "aim at a point farther ahead or lower",
    });
  const seconds: number = clock.at("stroke");
  const share: number = seconds / clock.duration;
  return {
    contacts: (["left", "right"] as const).map(
      (side: "left" | "right"): IAutoMovieMotionHumanContactWindow => ({
        part: `${side}Hand`,
        kind: "grip",
        from: 0,
        to: share,
        support: { kind: "prop", subject: prop },
      }),
    ),
    launches: throwObjectLaunch.launches(prop, undefined, {
      point,
      velocity,
      seconds,
      target: at,
    }),
  };
}

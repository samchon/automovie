import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBallSport,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionPropLaunch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { throwObjectLaunch } from "../../throwing/internal/throwObjectLaunch";

/** The record of `IThrowInReleaseResult`'s site. */
type IThrowInReleaseResult = {
  contacts: IAutoMovieMotionHumanContactWindow[];
  launches: IAutoMovieMotionPropLaunch[];
};

/**
 * Publish the prop held in both hands until a football throw-in releases it. An
 * implied ball needs neither grips nor a launch.
 *
 * @param params The optional ball subject and world aim point.
 * @param clock The action clock whose stroke is the release.
 * @param point The release point in world metres.
 * @param degrees The rise of the path's release velocity, in degrees.
 * @returns Both grip windows and the release when a real ball is named.
 * @throws {HumanRefusal} If the named ball has no aim point or the point is
 *   unreachable at the given angle.
 */
export function throwInRelease(
  params: IAutoMovieMotionHumanBallSport.IParams,
  clock: IAutoMovieMotionClock,
  point: IAutoMovieVector3,
  degrees: number,
): IThrowInReleaseResult | undefined {
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
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
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

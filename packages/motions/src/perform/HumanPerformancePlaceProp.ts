import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionPropLaunch,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { HumanPerformanceHold } from "./HumanPerformanceHold";
import { HumanPerformanceObject } from "./HumanPerformanceObject";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPropFlight } from "./HumanPropFlight";
import { HumanSegmentShown } from "./HumanSegmentShown";

/** The alternatives of `PlaceDraftedResult`'s site. */
type PlaceDraftedResult = "prop" | "point";

/**
 * The reader of a prop a placed action's context gives
 * (`IAutoMovieMotionHumanActionContext.prop`): the prop, its displayed frame at
 * a film second (over a carrier, a prop this performer carries is read on the
 * pose the action is laid on, never through its own posture), its launch,
 * flight approach, mount, holder and articulation state.
 *
 * @param self The resolving performance.
 * @param own The placed action's performer.
 * @param over Whether the action is laid over a carrier.
 * @param person The performer's placed record.
 * @param laid The overlays the action is laid on.
 * @param named The parameter an id was named through, for a refusal.
 * @returns The reader by prop.
 * @throws {HumanRefusal} When no prop has the subject.
 */
export function HumanPerformancePlaceProp(
  self: IAutoMovieMotionHumanPerformanceState,
  own: string,
  over: boolean,
  person: IAutoMovieMotionHumanSegment.IPerson,
  laid: number,
  named: (id: string, otherwise: string) => string,
): (subject: string) => IAutoMovieMotionHumanPropReader {
  return (subject: string): IAutoMovieMotionHumanPropReader => {
    const prop: IAutoMovieMotionHumanProp | undefined = self.props.get(subject);
    if (prop === undefined)
      throw HumanPerformanceRead.missing(
        "prop",
        subject,
        [...self.props.keys()],
        named(subject, "prop"),
      );
    return {
      prop,
      // Over a carrier, a prop this performer carries is read on the
      // pose this action is laid on, never through its own posture.
      frame: (seconds: number): IAutoMovieRigidTransform =>
        HumanPerformanceRead.prop(
          self,
          subject,
          seconds,
          over
            ? {
                subject: own,
                bones: (
                  requested?: ReadonlySet<AutoMovieHumanoidBone>,
                ): ReturnType<typeof poseBones> =>
                  HumanSegmentShown.laid(
                    person,
                    laid,
                    (): ReturnType<typeof poseBones> =>
                      HumanSegmentShown.bones(person, seconds, requested),
                  ),
              }
            : undefined,
        ),
      launchAt: (seconds: number): IAutoMovieMotionPropLaunch | undefined =>
        HumanPropFlight.active(self, subject, seconds)?.published,
      flightApproach: (
        seconds: number,
        before: number,
      ): IAutoMovieMotionHumanPropReader.IFlightApproach | undefined =>
        HumanPropFlight.approach(self, subject, seconds, before),
      mountAt: (
        seconds: number,
      ):
        | Pick<IAutoMovieMotionHumanProp.IMounted, PlaceDraftedResult>
        | undefined => HumanPerformanceHold.mount(self, subject, seconds),
      holderAt: (
        seconds: number,
      ): IAutoMovieMotionHumanPropReader.IHolder | undefined =>
        HumanPerformanceHold.holder(self, subject, seconds),
      state: (seconds: number): Readonly<Record<string, number>> =>
        HumanPerformanceObject.state(self, prop, seconds),
    };
  };
}

import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { poseBones } from "../../posture/internal/poseBones";
import { HumanPerformanceRead } from "./HumanPerformanceRead";

/*
 * The reader of another performer a placed action's context gives
 * (`IAutoMovieMotionHumanActionContext.performer`): the performer's body, and
 * its bones, root and posture at a film second as the performance shows them, a
 * partner of the action's own group read no later than the end of its placed
 * actions (`meetings`); the action's own performer is read as it entered the
 * action (`ownBones`), since its displayed bones there are the posture still
 * being solved.
 * Parameter self: The resolving performance.
 * Parameter own: The placed action's performer.
 * Parameter ownBones: The performer's own entry bones.
 * Parameter meetings: The partners read no later than their placed actions' end.
 * Parameter named: The parameter an id was named through, for a refusal.
 * Returns: The reader by performer.
 * When no performer has the subject.
 */
export function HumanPerformancePlacePerformer(
  self: IAutoMovieMotionHumanPerformanceState,
  own: string,
  ownBones: (
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ) => ReturnType<typeof poseBones>,
  meetings: ReadonlyMap<string, number>,
  named: (id: string, otherwise: string) => string,
): (subject: string) => IAutoMovieMotionHumanPerformerReader {
  return (subject: string): IAutoMovieMotionHumanPerformerReader => {
    if (!self.people.has(subject))
      throw HumanPerformanceRead.missing(
        "performer",
        subject,
        [...self.people.keys()],
        named(subject, "performer"),
      );
    const axis: () => string = (): string => named(subject, "performer");
    const reader: IAutoMovieMotionHumanPerformerReader = {
      body: HumanPerformanceRead.person(self, subject).performer.body,
      // The performer's own body is read as it entered the action, as
      // a `self` target is: its displayed bones at an instant of this
      // action are the posture still being solved.
      bones: (
        seconds: number,
        requested?: ReadonlySet<AutoMovieHumanoidBone>,
      ): ReturnType<typeof poseBones> =>
        subject === own
          ? ownBones(requested)
          : HumanPerformanceRead.bones(
              self,
              subject,
              seconds,
              requested,
              axis,
              meetings.get(subject),
            ),
      root: (seconds: number): IAutoMovieMotionHumanActionContext.IRoot =>
        HumanPerformanceRead.root(
          self,
          subject,
          seconds,
          axis,
          meetings.get(subject),
        ),
      posture: (seconds: number): IAutoMovieMotionHumanPosture =>
        HumanPerformanceRead.posture(
          self,
          subject,
          seconds,
          undefined,
          axis,
          meetings.get(subject),
        ),
    };
    return { ...reader };
  };
}

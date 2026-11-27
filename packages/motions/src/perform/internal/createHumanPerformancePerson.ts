import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSkill,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanSkill } from "../../skill/internal/HumanSkill";
import { HumanPerformanceAim } from "./HumanPerformanceAim";
import { HumanPerformanceRead } from "./HumanPerformanceRead";

/** The alternatives of `HumanPerformanceStateLayer`'s site. */
type HumanPerformanceStateLayer =
  | IAutoMovieMotionHumanLayer
  | IAutoMovieMotionHumanLayer.IScheduled;

/**
 * A performer's person as a performance starts resolving it
 * (`HumanPerformanceState`): standing where the performer is placed, its skill
 * resolved from the chain seed, no action placed, its always-on layers in place
 * (a windowed layer waits until the schedule gives its instants), and the
 * reader its layers are written by.
 *
 * @param self The performance's state the person's layer reader reads.
 * @param performer The performer.
 * @param input The performance's input, whose seed and layers the person takes.
 * @returns The person.
 */
export function createHumanPerformancePerson(
  self: IAutoMovieMotionHumanPerformanceState,
  performer: IAutoMovieMotionHumanPerformer,
  input: IAutoMovieMotionHumanPerformance.IInput,
): IAutoMovieMotionHumanSegment.IPerson {
  const initial: IAutoMovieMotionHumanPosture = stand.posture(
    performer.body,
    performer.at,
    performer.yaw,
  );
  const skill: IAutoMovieMotionHumanSkill = HumanSkill.resolve(
    performer.proficiency,
    input.seed,
  );
  const body = performer.body;
  return {
    performer,
    skill,
    segments: [],
    overlays: [],
    initial,
    holds: [],
    stops: new Map(),
    // A windowed layer waits until the schedule gives its instants.
    layers: (input.layers?.[performer.subject] ?? []).flatMap(
      (
        layer: HumanPerformanceStateLayer,
      ): IAutoMovieMotionHumanSegment.ILayered[] =>
        "apply" in layer
          ? [{ layer, from: -Infinity, to: Infinity, fade: 0 }]
          : [],
    ),
    layer: {
      subject: performer.subject,
      body,
      skill,
      ...(performer.attributes === undefined
        ? {}
        : { attributes: performer.attributes }),
      action: () => undefined,
      aim: (target: IAutoMovieMotionTarget, seconds: number) => {
        // Only a self target, the aiming performer named as a person, or
        // a prop they may carry reads their bones, resolved from the
        // whole posture; every other target reads at most the root and
        // heading, so only the root channel is evaluated for it.
        const posture: IAutoMovieMotionHumanPosture =
          HumanPerformanceRead.posture(
            self,
            performer.subject,
            seconds,
            target.kind === "point" ||
              target.kind === "none" ||
              (target.kind === "person" && target.subject !== performer.subject)
              ? ["root"]
              : undefined,
          );
        return HumanPerformanceAim.aim(
          self,
          target,
          seconds,
          HumanPerformanceAim.frame(
            body,
            posture,
            (
              requested?: ReadonlySet<AutoMovieHumanoidBone>,
            ): ReturnType<typeof poseBones> =>
              poseBones(
                body,
                resolveHumanPosture.seeded(
                  body,
                  posture,
                  undefined,
                  undefined,
                  undefined,
                  requested,
                ).pose,
                undefined,
                requested,
              ),
            performer.subject,
          ),
        );
      },
      random: (channel: string) =>
        HumanSkill.stream(skill, performer.subject, "layer", 0, channel),
    },
  };
}

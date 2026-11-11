import { AutoMovieMotionHumanVariation, HumanSkill } from "@automovie/motions";

/**
 * Build the variation source of one action instance from real seeded streams,
 * as a performance builds it: the skill resolved from one overall value and
 * each slot's series keyed by the seed, the subject and the action's id, with
 * the instance as the index. Every member has a default, so a test states only
 * the key it changes. The variation must be positive; the result is fresh and
 * nothing persists between calls.
 */
export const motionVariationSource: (props?: {
  seed?: string;
  subject?: string;
  action?: string;
  index?: number;
  skill?: number;
  variation?: number;
}) => AutoMovieMotionHumanVariation.ISource = (
  props: {
    seed?: string;
    subject?: string;
    action?: string;
    index?: number;
    skill?: number;
    variation?: number;
  } = {},
): AutoMovieMotionHumanVariation.ISource => {
  const skill: HumanSkill.ISkill = HumanSkill.resolve(
    { p: props.skill ?? 0 },
    props.seed ?? "film",
  );
  return AutoMovieMotionHumanVariation.of(
    {
      skill,
      series: (channel: string) => ({
        random: HumanSkill.series(
          skill,
          props.subject ?? "a",
          props.action ?? "wave",
          channel,
        ),
        index: props.index ?? 0,
      }),
    },
    { variation: props.variation ?? 1 },
  )!;
};

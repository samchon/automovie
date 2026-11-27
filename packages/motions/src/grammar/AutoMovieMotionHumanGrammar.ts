import type { IAutoMovieMotionHumanGrammar } from "@automovie/interface";

/**
 * The composition grammar as data: the axes an action is decided on and the
 * operators that join actions, each with the surface that carries it. A page, a
 * test generator and documentation read this, so they name the grammar as the
 * package does.
 */
export const AutoMovieMotionHumanGrammar = {
  axes: [
    {
      name: "base",
      carriedBy: "IAutoMovieMotionHumanEntryState.supports, AutoMovieMotionHumanObject.seat",
      says: "what carries the body",
    },
    {
      name: "travel",
      carriedBy: "walk, run, approach, AutoMovieMotionHumanGait, intercept and flee",
      says: "whether and how the body goes somewhere",
    },
    {
      name: "action",
      carriedBy:
        "AutoMovieMotionHumanActionName, AutoMovieMotionHumanActions, AutoMovieMotionHumanActionRow.of",
      says: "which action, and which entry of its table",
    },
    {
      name: "effector",
      carriedBy: "IAutoMovieMotionHumanTouchEffectors.With, hand and side parameters",
      says: "which part of the body performs it",
    },
    {
      name: "target",
      carriedBy: "IAutoMovieMotionTarget",
      says: "a region of a person, a place on an object, a point or none",
    },
    {
      name: "object",
      carriedBy: "AutoMovieMotionHumanObject, IAutoMovieMotionHumanProp",
      says: "the object involved and the contact on it",
    },
    {
      name: "partner",
      carriedBy: "IAutoMovieMotionHumanMutual roles",
      says: "the role in an action done together",
    },
    {
      name: "manner",
      carriedBy: "IAutoMovieMotionManner",
      says: "effort, pace, count and hold",
    },
    {
      name: "layer",
      carriedBy: "IAutoMovieMotionHumanLayer, IAutoMovieMotionHumanLayer.IScheduled",
      says: "what runs under everything the person does",
    },
    {
      name: "timing",
      carriedBy: "AutoMovieMotionHumanChain.sync, until, AutoMovieMotionHumanCue",
      says: "when, against other actions, speech and music",
    },
    {
      name: "seed",
      carriedBy: "IAutoMovieMotionHumanPerformance.IInput.seed, IAutoMovieMotionManner.variation",
      says: "which take of the same composition",
    },
  ],
  operators: [
    {
      name: "sequence",
      carriedBy: "AutoMovieMotionHumanChain methods in order",
      says: "one action, then the next",
    },
    {
      name: "cut",
      carriedBy: "AutoMovieMotionHumanChain.until",
      says: "an action ended early inside a window it declares",
    },
    {
      name: "overlay",
      carriedBy: "AutoMovieMotionHumanChain.over",
      says: "two things at once with one body",
    },
    {
      name: "layer",
      carriedBy: "IAutoMovieMotionHumanPerformance.IInput.layers",
      says: "something added under every action",
    },
    {
      name: "parallel",
      carriedBy: "AutoMovieMotionHumanChain.with",
      says: "several people at once",
    },
    {
      name: "mutual",
      carriedBy: "AutoMovieMotionHumanChain.mutual, AutoMovieMotionHumanChain.pair",
      says: "one action several people do together",
    },
    {
      name: "attach",
      carriedBy: "AutoMovieMotionHumanObject.seat, AutoMovieMotionHumanObject.prop",
      says: "an action on an object's affordance",
    },
    {
      name: "sync",
      carriedBy: "AutoMovieMotionHumanChain.sync",
      says: "an action timed to another instant",
    },
  ],
} as const satisfies IAutoMovieMotionHumanGrammar;

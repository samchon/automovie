/**
 * The composition grammar as data: the axes an action is decided on and the
 * operators that join actions, each with the surface that carries it. A
 * page, a test generator and documentation read this, so they name the
 * grammar as the package does.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table is and who reads it.
 * @evidence contracts/development/design.md#principled-representation Two closed lists of named entries, each pointing at the export that carries it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The axes and the operators; the exports named own their behaviour.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Literal data with `as const`, so the names are types too.
 */
export const HUMAN_GRAMMAR = {
  axes: [
    {
      name: "base",
      carriedBy: "IHumanEntryState.supports, HumanObject.seat",
      says: "what carries the body",
    },
    {
      name: "travel",
      carriedBy: "walk, run, approach, HumanGait, HumanPursuit",
      says: "whether and how the body goes somewhere",
    },
    {
      name: "action",
      carriedBy: "HumanActionName, HUMAN_LEXICON, HumanActionRow",
      says: "which action, and which entry of its table",
    },
    {
      name: "effector",
      carriedBy: "touch.With, hand and side parameters",
      says: "which part of the body performs it",
    },
    {
      name: "target",
      carriedBy: "AutoMovieMotionTarget",
      says: "a region of a person, a place on an object, a point or none",
    },
    {
      name: "object",
      carriedBy: "HumanObject, IHumanProp",
      says: "the object involved and the contact on it",
    },
    {
      name: "partner",
      carriedBy: "IHumanMutual roles",
      says: "the role in an action done together",
    },
    {
      name: "manner",
      carriedBy: "AutoMovieMotionManner.IManner",
      says: "effort, pace, count and hold",
    },
    {
      name: "layer",
      carriedBy: "IHumanLayer, IHumanLayer.IScheduled",
      says: "what runs under everything the person does",
    },
    {
      name: "timing",
      carriedBy: "HumanChain.sync, until, HumanCue",
      says: "when, against other actions, speech and music",
    },
    {
      name: "seed",
      carriedBy: "HumanPerformance.IInput.seed, HumanVariation",
      says: "which take of the same composition",
    },
  ],
  operators: [
    {
      name: "sequence",
      carriedBy: "HumanChain methods in order",
      says: "one action, then the next",
    },
    {
      name: "cut",
      carriedBy: "HumanChain.until",
      says: "an action ended early inside a window it declares",
    },
    {
      name: "overlay",
      carriedBy: "HumanChain.over",
      says: "two things at once with one body",
    },
    {
      name: "layer",
      carriedBy: "HumanPerformance.IInput.layers",
      says: "something added under every action",
    },
    {
      name: "parallel",
      carriedBy: "HumanChain.with",
      says: "several people at once",
    },
    {
      name: "mutual",
      carriedBy: "HumanChain.mutual, HumanChain.pair",
      says: "one action several people do together",
    },
    {
      name: "attach",
      carriedBy: "HumanObject.seat, HumanObject.prop",
      says: "an action on an object's affordance",
    },
    {
      name: "sync",
      carriedBy: "HumanChain.sync",
      says: "an action timed to another instant",
    },
  ],
} as const;

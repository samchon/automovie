import type {
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanComposeAutoMovieMotionHumanAction,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEvaluation,
  IAutoMovieMotionHumanFollow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionWeaponContact,
  IAutoMovieMotionWeaponPath,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { AutoMovieMotionHumanChannel as HumanChannels } from "./AutoMovieMotionHumanChannel";

/** The channel mask a primitive reads at a second of its window. */
type SoDependency = (seconds: number) => number;

/**
 * An action composed of part primitives over a base.
 *
 * The base is the posture every unclaimed channel keeps (standing, a fighting
 * stance, seated, walking). The clock gives the duration and the events. At a
 * second, the base's posture is taken and every primitive whose window holds
 * that second writes its channels onto it, in
 * {@link AutoMovieMotionHumanChannel.ORDER}, so an arm reads the trunk the
 * action already placed. The plan's contact windows and weapons are the base's
 * followed by the primitives', and its `channels` are the channels some
 * primitive claims, in that order; where none claims the root, the trunk or a
 * leg, the base's legs-still or still window is the plan's `legsStill`. Each
 * primitive is also given the posture so far at any second of the action
 * (`IAutoMovieMotionHumanPrimitive.write`'s `before`): the base and the
 * primitives before it, so a movement planned once over its span (an arm's
 * trajectory) reads the very postures it will be written on, and its plan is a
 * constant of the action. That plan is made here, when the action is composed
 * (`IAutoMovieMotionHumanPrimitive.prepare`, in writing order), so no posture
 * read plans and a plan that cannot be made refuses the action; what a
 * primitive reads of other performers is solved once the performance is placed
 * (`IAutoMovieMotionHumanPrimitive.ready`, called by the plan's `prepare`).
 * Completed posture prefixes of one evaluation's second are shared by its
 * writers within that one call. A reader retained by a
 * primitive uses the scope active when it is called, never the scope in which
 * it was given to that primitive. A posture or prefix reader may demand only
 * named channels. The composer follows active writers' declared input
 * dependencies backward and leaves unrelated writers unevaluated; omitted
 * dependencies require all channels.
 *
 * @param props The base, the clock and the primitives.
 * @returns The plan.
 * @throws {Error} When the base and the clock differ in duration, a primitive
 *   claims no channel, a primitive's window is reversed or leaves the clock, or
 *   two primitives claim one channel over overlapping windows; and whatever a
 *   primitive's plan refuses with (a planned arm's `HumanRefusal`).
 */
export function composeAutoMovieMotionHumanAction(
  props: IAutoMovieMotionHumanComposeAutoMovieMotionHumanAction.IProps,
): IAutoMovieMotionHumanActionPlan {
  const duration: number = props.clock.duration;
  if (Math.abs(props.base.duration - duration) > 1e-6)
    throw new Error("A composed action's base lasts as long as its clock");
  const rank: (p: IAutoMovieMotionHumanPrimitive) => number = (
    p: IAutoMovieMotionHumanPrimitive,
  ): number =>
    Math.min(
      ...p.channels.map((c: AutoMovieMotionHumanChannel): number =>
        HumanChannels.ORDER.indexOf(c),
      ),
    );
  const primitives: IAutoMovieMotionHumanPrimitive[] = props.primitives
    .map(
      (
        p: IAutoMovieMotionHumanPrimitive,
        i: number,
      ): [IAutoMovieMotionHumanPrimitive, number, number] => [p, i, rank(p)],
    )
    .sort(
      (
        a: [IAutoMovieMotionHumanPrimitive, number, number],
        b: [IAutoMovieMotionHumanPrimitive, number, number],
      ): number => a[2] - b[2] || a[0].from - b[0].from || a[1] - b[1],
    )
    .map(
      (
        pair: [IAutoMovieMotionHumanPrimitive, number, number],
      ): IAutoMovieMotionHumanPrimitive => pair[0],
    );
  for (const p of primitives) {
    if (p.channels.length === 0)
      throw new Error("A primitive claims at least one channel");
    if (!(p.from >= -1e-9 && p.to >= p.from && p.to <= duration + 1e-9))
      throw new Error(
        `A primitive on ${p.channels.join(", ")} has a window outside its action`,
      );
  }
  for (let i: number = 0; i < primitives.length; i++)
    for (let k: number = i + 1; k < primitives.length; k++) {
      const a: IAutoMovieMotionHumanPrimitive = primitives[i]!;
      const b: IAutoMovieMotionHumanPrimitive = primitives[k]!;
      const shared: AutoMovieMotionHumanChannel | undefined = a.channels.find(
        (c: AutoMovieMotionHumanChannel): boolean => b.channels.includes(c),
      );
      if (
        shared !== undefined &&
        Math.min(a.to, b.to) - Math.max(a.from, b.from) > 1e-9
      )
        throw new HumanRefusal({
          kind: "channel",
          axis: "channel",
          value: shared,
          reason: `Two primitives claim the ${shared} channel at the same time`,
          fix: "give one of the two movements another body part or another time",
        });
    }
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    ...props.base.contacts,
    ...primitives.flatMap(
      (
        p: IAutoMovieMotionHumanPrimitive,
      ): readonly IAutoMovieMotionHumanContactWindow[] => p.contacts ?? [],
    ),
  ];
  const weapons: IAutoMovieMotionWeaponPath[] = [
    ...(props.base.weapons ?? []),
    ...primitives.flatMap(
      (
        p: IAutoMovieMotionHumanPrimitive,
      ): readonly IAutoMovieMotionWeaponPath[] => p.weapons ?? [],
    ),
  ];
  const base: IAutoMovieMotionHumanActionPlan = props.base;

  /**
   * The completed demanded prefixes of one evaluation's second, shared by its
   * writers within that one call.
   */
  interface Evaluation {
    /**
     * The explicit context the plan's posture was called with, which every
     * primitive's write of this evaluation receives.
     */
    evaluation?: IAutoMovieMotionHumanEvaluation;

    /** The first clamped second this evaluation read; absent until one is. */
    seconds: number | undefined;

    /** That second's completed prefixes by prefix and demand. */
    first: Map<number, IAutoMovieMotionHumanPosture> | undefined;
  }

  /** Fixed-claim posture merge retained by each primitive's plan. */
  type Merger = ReturnType<typeof HumanChannels.prepareMerge>;

  /** Exact FK metadata borrowed only by the currently active synchronous query. */
  type Resolution = Parameters<typeof prepareHumanPoseResolution>[0];

  /** Genuine direct ROM metadata borrowed with the same synchronous query. */
  type Projection = Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3];

  // Nine owned channels fit in one integer. A write may replace a channel
  // without reading it; only its declared prerequisites propagate backward.
  const width: number = 1 << HumanChannels.ORDER.length;
  const all: number = width - 1;
  // A primitive writes its claimed channels and the hands it plays
  // (`IAutoMovieMotionHumanPrimitive.plays`), taken from its write as the
  // claimed ones are.
  const written = (
    p: IAutoMovieMotionHumanPrimitive,
  ): readonly AutoMovieMotionHumanChannel[] =>
    p.plays === undefined ? p.channels : [...p.channels, ...p.plays];
  const masks: number[] = primitives.map(
    (p: IAutoMovieMotionHumanPrimitive): number => mask(written(p)),
  );
  const mergers: Merger[] = primitives.map(
    (p: IAutoMovieMotionHumanPrimitive): Merger =>
      HumanChannels.prepareMerge(written(p)),
  );
  const dependencies: SoDependency[] = primitives.map(
    (p: IAutoMovieMotionHumanPrimitive): SoDependency => {
      const reads: IAutoMovieMotionHumanPrimitive["reads"] = p.reads;
      if (reads === undefined) return (): number => all;
      if (typeof reads === "function")
        return (seconds: number): number => mask(reads(seconds));
      const fixed: number = mask(reads);
      return (): number => fixed;
    },
  );

  // A retained reader selects its scope when called: a follower may keep
  // it after the evaluation in which it first received it has ended.
  let scope: Evaluation | undefined;
  let resolution: Resolution = undefined;
  let projection: Projection = undefined;
  const readers: IAutoMovieMotionHumanPrimitive.Reader[] = Array.from(
    { length: primitives.length },
    (_: unknown, index: number): IAutoMovieMotionHumanPrimitive.Reader =>
      (
        seconds: number,
        channels?: readonly AutoMovieMotionHumanChannel[],
        source?: Resolution,
        projector?: Projection,
      ): IAutoMovieMotionHumanPosture =>
        scope === undefined ||
        (source !== undefined && source !== resolution) ||
        (projector !== undefined && projector !== projection)
          ? evaluate(
              (current: Evaluation): IAutoMovieMotionHumanPosture =>
                so(
                  index,
                  seconds,
                  current,
                  channels === undefined ? all : mask(channels),
                ),
              source ?? resolution,
              projector ?? projection,
            )
          : so(
              index,
              seconds,
              scope,
              channels === undefined ? all : mask(channels),
            ),
  );

  // What is planned once over a span is planned now, in the order the
  // primitives write, each on the posture so far before it. Each preparation
  // reader query owns its scope, so a long refinement does not retain
  // every intermediate prefix after the planner has consumed that query.
  primitives.forEach((p: IAutoMovieMotionHumanPrimitive, i: number): void =>
    p.prepare?.(readers[i]!),
  );

  // Primitives that move only the head, the arms and the hands leave the
  // root, the trunk and the legs as the base keeps them: still wherever the
  // base keeps its legs still or holds still altogether.
  const legsStill: readonly [number, number] | undefined = primitives.some(
    (p: IAutoMovieMotionHumanPrimitive): boolean =>
      p.channels.some((c: AutoMovieMotionHumanChannel): boolean =>
        LEGGED.includes(c),
      ),
  )
    ? undefined
    : (base.legsStill ?? base.still);
  // The channels whose writer follows another performer live, each over its
  // window: the base's and the primitives' (`IAutoMovieMotionHumanPrimitive.follows`).
  const follows: IAutoMovieMotionHumanFollow[] = [
    ...(base.follows ?? []),
    ...primitives.flatMap(
      (p: IAutoMovieMotionHumanPrimitive): IAutoMovieMotionHumanFollow[] =>
        p.follows === true
          ? p.channels.map(
              (
                channel: AutoMovieMotionHumanChannel,
              ): IAutoMovieMotionHumanFollow => ({
                channel,
                from: p.from,
                to: p.to,
              }),
            )
          : [],
    ),
  ];
  const plan: IAutoMovieMotionHumanActionPlan = {
    duration,
    events: props.clock.events(),
    contacts,
    ...(follows.length === 0 ? {} : { follows }),
    ...(legsStill === undefined ? {} : { legsStill }),
    channels: HumanChannels.ORDER.filter(
      (c: AutoMovieMotionHumanChannel): boolean =>
        primitives.some((p: IAutoMovieMotionHumanPrimitive): boolean =>
          written(p).includes(c),
        ),
    ),
    ...(props.contact === undefined
      ? {}
      : { contact: props.clock.at(props.contact) }),
    ...(base.holds === undefined ? {} : { holds: base.holds }),
    // Solved once the performance is placed: the base's own solution, then
    // each primitive's on the posture so far (`IAutoMovieMotionHumanPrimitive.ready`).
    ...(base.prepare === undefined && !primitives.some(readies)
      ? {}
      : {
          prepare: (): void => {
            base.prepare?.();
            primitives.forEach(
              (p: IAutoMovieMotionHumanPrimitive, i: number): void =>
                p.ready?.(readers[i]!),
            );
          },
        }),
    ...(weapons.length === 0 ? {} : { weapons }),
    ...(base.stop === undefined
      ? {}
      : {
          stop: (events: readonly IAutoMovieMotionWeaponContact[]): void =>
            base.stop!(events),
        }),
    posture,
  };
  return plan;

  function posture(
    seconds: number,
    channels?: readonly AutoMovieMotionHumanChannel[],
    source?: Resolution,
    projector?: Projection,
    evaluation?: IAutoMovieMotionHumanEvaluation,
  ): IAutoMovieMotionHumanPosture {
    return evaluate(
      (current: Evaluation): IAutoMovieMotionHumanPosture =>
        so(
          primitives.length,
          seconds,
          current,
          channels === undefined ? all : mask(channels),
        ),
      source,
      projector,
      evaluation,
    );
  }

  /**
   * Run with a fresh scope, restoring an enclosing evaluation even if this one
   * throws.
   */
  function evaluate<T>(
    run: (current: Evaluation) => T,
    source?: Resolution,
    projector?: Projection,
    evaluation?: IAutoMovieMotionHumanEvaluation,
  ): T {
    const previous: Evaluation | undefined = scope;
    const previousResolution: Resolution = resolution;
    const previousProjection: Projection = projection;
    const current: Evaluation = {
      seconds: undefined,
      first: undefined,
      ...(evaluation === undefined ? {} : { evaluation }),
    };
    scope = current;
    resolution = source;
    projection = projector;
    try {
      return run(current);
    } finally {
      scope = previous;
      resolution = previousResolution;
      projection = previousProjection;
    }
  }

  /** Encode the owned partition once for each fixed primitive dependency. */
  function mask(channels: readonly AutoMovieMotionHumanChannel[]): number {
    let result: number = 0;
    for (const channel of channels)
      result |= 1 << HumanChannels.ORDER.indexOf(channel);
    return result;
  }

  /** Resolve only contributors to a demand; a failed write publishes no result. */
  function so(
    index: number,
    seconds: number,
    current: Evaluation,
    demand: number,
  ): IAutoMovieMotionHumanPosture {
    const t: number = Math.min(duration, Math.max(0, seconds));

    // One evaluation reads one second, whose prefixes stand in the scope
    // itself and are shared by its writers; a primitive that reads its prefix
    // at another second reads that second's prefixes afresh.
    let postures: Map<number, IAutoMovieMotionHumanPosture>;
    if (current.first === undefined) {
      postures = new Map();
      current.seconds = t;
      current.first = postures;
    } else if (current.seconds === t) postures = current.first;
    else postures = new Map();
    const key: number = index * width + demand;
    const known: IAutoMovieMotionHumanPosture | undefined =
      postures.get(key) ?? postures.get(index * width + all);
    if (known !== undefined) return known;
    if (index === 0) {
      const initial: IAutoMovieMotionHumanPosture = base.posture(
        t,
        demand === all
          ? undefined
          : HumanChannels.ORDER.filter(
              (_: AutoMovieMotionHumanChannel, index: number): boolean =>
                (demand & (1 << index)) !== 0,
            ),
        resolution,
        projection,
      );
      postures.set(key, initial);
      return initial;
    }

    const previous: number = index - 1;
    const p: IAutoMovieMotionHumanPrimitive = primitives[previous]!;
    const contributes: boolean =
      (masks[previous]! & demand) !== 0 &&
      t >= p.from - 1e-9 &&
      t <= p.to + 1e-9;
    const dependency: SoDependency = dependencies[previous]!;
    const needed: number = contributes
      ? (demand & ~masks[previous]!) |
        dependency(Math.min(p.to, Math.max(p.from, t)))
      : demand;
    let posture: IAutoMovieMotionHumanPosture = so(
      previous,
      t,
      current,
      needed,
    );
    if (contributes)
      posture = mergers[previous]!(
        posture,
        p.write(
          posture,
          Math.min(p.to, Math.max(p.from, t)),
          readers[previous]!,
          resolution,
          projection,
          current.evaluation,
        ),
      );
    postures.set(key, posture);
    return posture;
  }
}

/** Whether a primitive solves what it reads of other performers once placed. */
function readies(p: IAutoMovieMotionHumanPrimitive): boolean {
  return p.ready !== undefined;
}

/** The channels that move the root, the trunk or a leg, which a leg fit reads. */
const LEGGED: readonly AutoMovieMotionHumanChannel[] = [
  "root",
  "trunk",
  "leftLeg",
  "rightLeg",
];

import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanChannel } from "./AutoMovieMotionHumanChannel";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * An action composed of part primitives over a base.
 *
 * The base is the posture every unclaimed channel keeps (standing, a fighting
 * stance, seated, walking). The clock gives the duration and the events. At a
 * second, the base's posture is taken and every primitive whose window holds
 * that second writes its channels onto it, in {@link AutoMovieMotionHumanChannel.ORDER}, so
 * an arm reads the trunk the action already placed. The plan's contact
 * windows and weapons are the base's followed by the primitives', and its
 * `channels` are the channels some primitive claims, in that order. Each
 * primitive is also given the posture so far at any second of the action
 * (`IAutoMovieMotionHumanPrimitive.write`'s `before`): the base and the
 * primitives before it, so a movement planned once over its span (an arm's
 * trajectory) reads the very postures it will be written on, and its plan
 * is a constant of the action. That plan is made here, when the action is
 * composed (`IAutoMovieMotionHumanPrimitive.prepare`, in writing order), so
 * no posture read plans and a plan that cannot be made refuses the action.
 * Completed posture prefixes are shared at each exact clamped second within
 * the preparation pass or one posture evaluation. A reader retained by a
 * primitive uses the scope active when it is called, never the scope in
 * which it was given to that primitive.
 *
 * @param props The base, the clock and the primitives.
 * @returns The plan.
 * @throws {Error} When the base and the clock differ in duration, a primitive claims no channel, a primitive's window is reversed or leaves the clock, or two primitives claim one channel over overlapping windows; and whatever a primitive's plan refuses with (a planned arm's `HumanRefusal`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the base and the clock give, the writing order, where contacts and weapons come from, which channels the plan reports and every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The posture at a second is the base's with each active primitive's channels merged in, in the order of the kinematic tree, so a part reads the parts it hangs from as already placed; the posture so far before a primitive is the same composition stopped at it, at any second, so it is a pure function of time.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Rank each primitive once, sort and validate once, collect contacts and weapons once, and give each primitive's prefix one stable reader over the current synchronous evaluation scope.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Two primitives on one channel at one time throw instead of the later one winning; windows that only touch at an instant are allowed, and the sort is stable by the given order.
 * @evidence contracts/development/implementation.md#efficient-algorithms Ranks scan the channel claims once before O(P log P) sorting; validation is quadratic in the primitive count P once per plan. An evaluation computes each requested prefix at a distinct clamped second once, with constant-time reads thereafter and at most (P + 1) times T posture references for T requested seconds.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Sorting reuses each primitive's fixed channel rank. A prefix is the same base and ordered pure writes at the same exact clamped second within one synchronous preparation pass or posture evaluation; only completed prefixes are shared, and another evaluation starts afresh.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the base, clock, sorted primitives and stable readers. Temporary prefix maps live only through their synchronous evaluation; finally restores the previous scope on success or failure, including a nested evaluation, and retained readers capture no map.
 */
export function composeAutoMovieMotionHumanAction(
  props: composeAutoMovieMotionHumanAction.IProps,
): IHumanActionPlan {
  const duration: number = props.clock.duration;
  if (Math.abs(props.base.duration - duration) > 1e-6)
    throw new Error("A composed action's base lasts as long as its clock");
  const rank: (p: IAutoMovieMotionHumanPrimitive) => number = (
    p: IAutoMovieMotionHumanPrimitive,
  ): number =>
    Math.min(
      ...p.channels.map((c: AutoMovieMotionHumanChannel): number =>
        AutoMovieMotionHumanChannel.ORDER.indexOf(c),
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
  const contacts: IHumanContactWindow[] = [
    ...props.base.contacts,
    ...primitives.flatMap(
      (p: IAutoMovieMotionHumanPrimitive): readonly IHumanContactWindow[] =>
        p.contacts ?? [],
    ),
  ];
  const weapons: IHumanActionPlan.IWeapon[] = [
    ...(props.base.weapons ?? []),
    ...primitives.flatMap(
      (
        p: IAutoMovieMotionHumanPrimitive,
      ): readonly IHumanActionPlan.IWeapon[] => p.weapons ?? [],
    ),
  ];
  const base: IHumanActionPlan = props.base;

  /** Completed posture prefixes at each exact clamped second of one evaluation. */
  type Evaluation = Map<number, IHumanPosture[]>;

  // A retained reader selects its scope when called: a follower may keep
  // it after the evaluation in which it first received it has ended.
  let scope: Evaluation | undefined;
  const readers: ((seconds: number) => IHumanPosture)[] = Array.from(
    { length: primitives.length },
    (_: unknown, index: number): ((seconds: number) => IHumanPosture) =>
      (seconds: number): IHumanPosture =>
        scope === undefined
          ? evaluate(
              (current: Evaluation): IHumanPosture =>
                so(index, seconds, current),
            )
          : so(index, seconds, scope),
  );

  // What is planned once over a span is planned now, in the order the
  // primitives write, each on the posture so far before it. Their common
  // prefixes are shared only through this preparation pass.
  evaluate((): void => {
    primitives.forEach((p: IAutoMovieMotionHumanPrimitive, i: number): void =>
      p.prepare?.(readers[i]!),
    );
  });
  return {
    duration,
    events: props.clock.events(),
    contacts,
    channels: AutoMovieMotionHumanChannel.ORDER.filter(
      (c: AutoMovieMotionHumanChannel): boolean =>
        primitives.some((p: IAutoMovieMotionHumanPrimitive): boolean =>
          p.channels.includes(c),
        ),
    ),
    ...(props.contact === undefined
      ? {}
      : { contact: props.clock.at(props.contact) }),
    ...(base.holds === undefined ? {} : { holds: base.holds }),
    ...(base.settle === undefined ? {} : { settle: (): void => base.settle!() }),
    ...(weapons.length === 0 ? {} : { weapons }),
    ...(base.stop === undefined
      ? {}
      : {
          stop: (events: readonly IHumanActionPlan.IContactEvent[]): void =>
            base.stop!(events),
        }),
    posture: (seconds: number): IHumanPosture =>
      evaluate(
        (current: Evaluation): IHumanPosture =>
          so(primitives.length, seconds, current),
      ),
  };

  /** Run with a fresh scope, restoring an enclosing evaluation even if this one throws. */
  function evaluate<T>(run: (current: Evaluation) => T): T {
    const previous: Evaluation | undefined = scope;
    const current: Evaluation = new Map();
    scope = current;
    try {
      return run(current);
    } finally {
      scope = previous;
    }
  }

  /** Complete only the missing part of a prefix; a failed write publishes no posture for it. */
  function so(
    index: number,
    seconds: number,
    current: Evaluation,
  ): IHumanPosture {
    const t: number = Math.min(duration, Math.max(0, seconds));
    let postures: IHumanPosture[] | undefined = current.get(t);
    if (postures === undefined) {
      postures = [];
      current.set(t, postures);
    }
    let completed: number = Math.min(index, postures.length - 1);
    let posture: IHumanPosture;
    if (completed < 0) {
      posture = base.posture(t);
      postures.push(posture);
      completed = 0;
    } else posture = postures[completed]!;
    for (let i: number = completed; i < index; ++i) {
      const p: IAutoMovieMotionHumanPrimitive = primitives[i]!;
      if (t >= p.from - 1e-9 && t <= p.to + 1e-9)
        posture = AutoMovieMotionHumanChannel.merge(
          posture,
          p.write(posture, Math.min(p.to, Math.max(p.from, t)), readers[i]!),
          p.channels,
        );
      postures[i + 1] = posture;
    }
    return posture;
  }
}
/**
 * Companion types of {@link composeAutoMovieMotionHumanAction}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what `IProps` is composed of; each member states its meaning and its constraint.
 * @evidence contracts/development/design.md#principled-representation The posture kept where nothing is claimed, the time axis, the part movements, and which instant is decisive.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One interface of four members; contacts and weapons come from the base and the primitives and are not stated a second time.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The decisive instant is a name of the clock and not a second, so it cannot disagree with the clock.
 */
export namespace composeAutoMovieMotionHumanAction {
  /** What an action is composed of. */
  export interface IProps {
    /** The plan whose posture the unclaimed channels keep; as long as the clock. */
    base: IHumanActionPlan;

    /** The action's clock: its duration and its events. */
    clock: AutoMovieMotionClock.IClock;

    /** The part primitives, in any order. */
    primitives: readonly IAutoMovieMotionHumanPrimitive[];

    /** The clock instant that is the action's decisive instant, when it has one. */
    contact?: string;
  }
}

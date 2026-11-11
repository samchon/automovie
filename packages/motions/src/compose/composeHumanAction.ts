import type { AutoMovieMotionClock } from "@automovie/engine";

import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanChannel } from "./HumanChannel";
import type { IHumanPrimitive } from "./IHumanPrimitive";

/**
 * An action composed of part primitives over a base.
 *
 * The base is the posture every unclaimed channel keeps (standing, a fighting
 * stance, seated, walking). The clock gives the duration and the events. At a
 * second, the base's posture is taken and every primitive whose window holds
 * that second writes its channels onto it, in {@link HumanChannel.ORDER}, so
 * an arm reads the trunk the action already placed. The plan's contact
 * windows and weapons are the base's followed by the primitives'.
 *
 * @param props The base, the clock and the primitives.
 * @returns The plan.
 * @throws {Error} When the base and the clock differ in duration, a primitive's window is reversed or leaves the clock, or two primitives claim one channel over overlapping windows.
 */
export function composeHumanAction(
  props: composeHumanAction.IProps,
): IHumanActionPlan {
  const duration: number = props.clock.duration;
  if (Math.abs(props.base.duration - duration) > 1e-6)
    throw new Error("A composed action's base lasts as long as its clock");
  const rank = (p: IHumanPrimitive): number =>
    Math.min(
      ...p.channels.map((c: HumanChannel): number =>
        HumanChannel.ORDER.indexOf(c),
      ),
    );
  const primitives: IHumanPrimitive[] = props.primitives
    .map((p: IHumanPrimitive, i: number): [IHumanPrimitive, number] => [p, i])
    .sort(
      (a: [IHumanPrimitive, number], b: [IHumanPrimitive, number]): number =>
        rank(a[0]) - rank(b[0]) || a[0].from - b[0].from || a[1] - b[1],
    )
    .map((pair: [IHumanPrimitive, number]): IHumanPrimitive => pair[0]);
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
      const a: IHumanPrimitive = primitives[i]!;
      const b: IHumanPrimitive = primitives[k]!;
      const shared: HumanChannel | undefined = a.channels.find(
        (c: HumanChannel): boolean => b.channels.includes(c),
      );
      if (
        shared !== undefined &&
        Math.min(a.to, b.to) - Math.max(a.from, b.from) > 1e-9
      )
        throw new Error(
          `Two primitives claim the ${shared} channel at the same time`,
        );
    }
  const contacts: IHumanContactWindow[] = [
    ...props.base.contacts,
    ...primitives.flatMap(
      (p: IHumanPrimitive): readonly IHumanContactWindow[] => p.contacts ?? [],
    ),
  ];
  const weapons: IHumanActionPlan.IWeapon[] = [
    ...(props.base.weapons ?? []),
    ...primitives.flatMap(
      (p: IHumanPrimitive): readonly IHumanActionPlan.IWeapon[] =>
        p.weapons ?? [],
    ),
  ];
  const base: IHumanActionPlan = props.base;
  return {
    duration,
    events: props.clock.events(),
    contacts,
    ...(props.contact === undefined
      ? {}
      : { contact: props.clock.at(props.contact) }),
    ...(base.holds === undefined ? {} : { holds: base.holds }),
    ...(base.settle === undefined ? {} : { settle: () => base.settle!() }),
    ...(weapons.length === 0 ? {} : { weapons }),
    ...(base.stop === undefined
      ? {}
      : {
          stop: (events: readonly IHumanActionPlan.IContactEvent[]): void =>
            base.stop!(events),
        }),
    posture: (seconds: number): IHumanPosture => {
      const t: number = Math.min(duration, Math.max(0, seconds));
      let posture: IHumanPosture = base.posture(t);
      for (const p of primitives)
        if (t >= p.from - 1e-9 && t <= p.to + 1e-9)
          posture = HumanChannel.merge(
            posture,
            p.write(posture, Math.min(p.to, Math.max(p.from, t))),
            p.channels,
          );
      return posture;
    },
  };
}
/** Companion types of {@link composeHumanAction}. */
export namespace composeHumanAction {
  /** What an action is composed of. */
  export interface IProps {
    /** The plan whose posture the unclaimed channels keep; as long as the clock. */
    base: IHumanActionPlan;

    /** The action's clock: its duration and its events. */
    clock: AutoMovieMotionClock.IClock;

    /** The part primitives, in any order. */
    primitives: readonly IHumanPrimitive[];

    /** The clock instant that is the action's decisive instant, when it has one. */
    contact?: string;
  }
}

import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanWorkoutKind,
} from "@automovie/interface";

import type { workoutSpans } from "./workoutSpans";

/**
 * Build the windows.
 *
 * @param props What the windows are built from.
 * @returns The contact windows.
 */
export function workoutContacts(
  props: workoutContacts.IProps,
): IAutoMovieMotionHumanContactWindow[] {
  const duration: number = props.clock.duration;
  const mirror: (
    part: IAutoMovieMotionHumanContactWindow["part"],
  ) => IAutoMovieMotionHumanContactWindow["part"] = (
    part: IAutoMovieMotionHumanContactWindow["part"],
  ): IAutoMovieMotionHumanContactWindow["part"] =>
    (part.startsWith("left")
      ? `right${part.slice(4)}`
      : part.startsWith("right")
        ? `left${part.slice(5)}`
        : part) as IAutoMovieMotionHumanContactWindow["part"];
  const ends: (name: string) => number = (name: string): number => {
    const index: number = props.spans.findIndex(
      (s: workoutSpans.ISpan): boolean => s.from === name,
    );
    return index + 1 < props.spans.length ? props.starts[index + 1]! : duration;
  };
  const contacts: IAutoMovieMotionHumanContactWindow[] = [];
  for (const support of props.kind.supports) {
    const on: IAutoMovieMotionHumanContactWindow["support"] =
      support.prop === true && props.prop !== undefined
        ? { kind: "prop", subject: props.prop }
        : { kind: "ground" };
    const window: (
      part: IAutoMovieMotionHumanContactWindow["part"],
      a: number,
      b: number,
    ) => void = (
      part: IAutoMovieMotionHumanContactWindow["part"],
      a: number,
      b: number,
    ): void => {
      const open: IAutoMovieMotionHumanContactWindow | undefined =
        contacts.find(
          (c: IAutoMovieMotionHumanContactWindow): boolean =>
            c.part === part &&
            c.kind === support.kind &&
            Math.abs(c.to - a) < 1e-12,
        );
      if (open !== undefined) open.to = b;
      else
        contacts.push({
          part,
          kind: support.kind,
          from: a,
          to: b,
          support: on,
        });
    };
    if (support.at === undefined) {
      window(support.part, props.from, props.to);
      continue;
    }
    for (const s of props.between) {
      if (!(support.at.includes(s.was) && support.at.includes(s.is))) continue;
      const a: number = Math.max(props.from, props.clock.at(s.name) / duration);
      const b: number = Math.min(props.to, ends(s.name) / duration);
      if (b > a) window(s.other ? mirror(support.part) : support.part, a, b);
    }
  }
  if (props.recovers)
    for (const part of ["leftFoot", "rightFoot"] as const)
      contacts.push({
        part,
        kind: "plant",
        from: props.clock.at("relax") / duration,
        to: 1,
        support: { kind: "ground" },
      });
  return contacts;
}

/**
 * A workout's support windows: each support its kind bears, over the work or
 * over the spans whose two postures name it, on the other side's part in a
 * repetition done on that side, adjacent spans joined, and both feet planted
 * from the settle of a rise back to a recovered stance (`workout`).
 */
export namespace workoutContacts {
  /** What the windows are built from. */
  export interface IProps {
    /** The exercise. */
    kind: IAutoMovieMotionHumanWorkoutKind;

    /** The prop subject the kind's prop supports bear on, when one is named. */
    prop: string | undefined;

    /** The spans. */
    spans: readonly workoutSpans.ISpan[];

    /** Each span's start, seconds. */
    starts: readonly number[];

    /** Each repetition span's events and side. */
    between: readonly workoutSpans.IBetween[];

    /** The action's clock. */
    clock: IAutoMovieMotionClock;

    /** The work's first share. */
    from: number;

    /** The work's last share. */
    to: number;

    /** Whether the body rises back to a recovered two-foot stance. */
    recovers: boolean;
  }
}

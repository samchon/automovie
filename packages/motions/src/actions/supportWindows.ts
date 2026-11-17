import type { IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanSupport, IAutoMovieMotionTarget } from "@automovie/interface";


import { HumanContactWindow } from "../law/HumanContactWindow";

import { supportContact } from "./supportContact";

/**
 * A support sequence's declared windows, including the frame each target
 * belongs to. The contact identity keeps separate placements and targets.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the window and frame ownership.
 * @evidence contracts/development/design.md#principled-representation A stance schedule becomes the existing contact windows on ground, prop or person frames.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One schedule reader for support.plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the shared target and contact types.
 */
export namespace supportWindows {
  /**
   * A named instant of the support sequence.
   * @evidence contracts/development/common.md#meaningful-documentation States both fields and their units.
   * @evidence contracts/development/design.md#principled-representation A name identifies one solved instant in seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the two key fields the schedule reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the support planner's event names.
   */
  export interface IKey {
    /** Seconds since the sequence began. */
    seconds: number;
    /** The planner's event name. */
    name: string;
  }

  /**
   * Windows on the target's actual support frame.
   *
   * @param context The sequence's subject and shared on target.
   * @param stances The contact schedule.
   * @param keys The solved instants.
   * @param duration The sequence's seconds.
   * @returns Contact windows.
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, units and result.
   * @evidence contracts/development/implementation.md#principled-implementation Contacts open when placed and close when released; each named target supplies its own support frame, including the shared on target and self regions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads identities, opens and closes their spans, then closes the final spans.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No action-specific support override.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in scheduled contacts apart from named-key lookup.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One read per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing after returning.
   */
  export function of(
    context: Pick<
      IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSupport.IParams>,
      "subject" | "entry" | "params"
    >,
    stances: readonly IAutoMovieMotionHumanSupport.IStance[],
    keys: readonly IKey[],
    duration: number,
  ): IAutoMovieMotionHumanContactWindow[] {
    // Each contact bears from the key that places it to the key after the
    // last stance that holds it, and to the end where the last stance holds
    // it.
    const contacts: IAutoMovieMotionHumanContactWindow[] = [];
    const opened: Map<string, number> = new Map();
    const kinds: Map<string, IAutoMovieMotionHumanSupport.IContact["kind"]> = new Map(
      stances.flatMap(
        (st: IAutoMovieMotionHumanSupport.IStance): [string, IAutoMovieMotionHumanSupport.IContact["kind"]][] =>
          st.contacts.map(
            (
              c: IAutoMovieMotionHumanSupport.IContact,
            ): [string, IAutoMovieMotionHumanSupport.IContact["kind"]] => [
              supportContact.id(c),
              c.kind,
            ],
          ),
      ),
    );
    const frames: Map<string, IAutoMovieMotionHumanContactWindow.Support> = new Map(
      stances.flatMap((stance: IAutoMovieMotionHumanSupport.IStance) =>
        stance.contacts.map(
          (c: IAutoMovieMotionHumanSupport.IContact): [string, IAutoMovieMotionHumanContactWindow.Support] => {
            const target: IAutoMovieMotionTarget | undefined =
              c.target === "on" ? context.params.on : c.target;
            const frame: IAutoMovieMotionHumanContactWindow.Support =
              target?.kind === "prop"
                ? { kind: "prop", subject: target.subject }
                : target?.kind === "person"
                  ? target
                  : target?.kind === "self"
                    ? {
                        kind: "person",
                        subject: context.subject,
                        region: target.region,
                      }
                    : { kind: "ground" };
            return [supportContact.id(c), frame];
          },
        ),
      ),
    );
    const close = (key: string, until: number): void => {
      const from: number = opened.get(key)!;
      opened.delete(key);
      const [named] = key.split("|") as [string];
      const window: string = supportContact.window(named as IAutoMovieMotionHumanSupport.Part);
      const part: IAutoMovieMotionHumanContactWindow["part"] | undefined =
        HumanContactWindow.PARTS.find(
          (p: IAutoMovieMotionHumanContactWindow["part"]): boolean => p === window,
        );
      if (part === undefined) return;
      contacts.push({
        part,
        kind:
          kinds.get(key) === "grip"
            ? "grip"
            : part === "seat"
              ? "seat"
              : part === "back"
                ? "lie"
                : "plant",
        from: from / duration,
        to: until / duration,
        support: frames.get(key) ?? { kind: "ground" },
      });
    };
    const keyAt = (name: string): IKey | undefined =>
      keys.find((k: IKey): boolean => k.name === name);
    stances.forEach((stance: IAutoMovieMotionHumanSupport.IStance, i: number): void => {
      const held: IKey = keyAt(stance.event ?? `stance${i}`)!;
      const placed: IKey = keyAt(`bear${i}`) ?? held;
      // A part the body already rests on as it enters bears from the start.
      for (const c of stance.contacts)
        if (!opened.has(supportContact.id(c)))
          opened.set(
            supportContact.id(c),
            i === 0 &&
              context.entry.supports.some(
                (s: { part: string }): boolean => s.part === c.part,
              )
              ? 0
              : placed.seconds,
          );
      const next: IAutoMovieMotionHumanSupport.IStance | undefined = stances[i + 1];
      if (next === undefined) return;
      // A stepping limb lets go as the step lifts it; any other contact the
      // next stance lacks once the next stance's new contacts bear.
      const released: number = (keyAt(`bear${i + 1}`) ?? held).seconds;
      const lifted: number = (keyAt(`lift${i + 1}`) ?? held).seconds;
      for (const c of stance.contacts)
        if (
          !next.contacts.some((n: IAutoMovieMotionHumanSupport.IContact): boolean =>
            supportContact.same(n, c),
          )
        )
          close(
            supportContact.id(c),
            next.contacts.some(
              (n: IAutoMovieMotionHumanSupport.IContact): boolean =>
                supportContact.limb(n.part) === supportContact.limb(c.part),
            )
              ? lifted
              : released,
          );
    });
    for (const key of [...opened.keys()]) close(key, duration);

    return contacts;
  }
}

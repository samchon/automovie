import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

import { HumanContactWindow } from "../law/HumanContactWindow";
import { supportContact } from "./supportContact";

/** Only the subject and target parameters identify a support frame. */
type ContextField = "subject" | "params";

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
   * Describe how and where a stance contact bears.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Resolves the body part, bearing kind and support frame of a stance contact.
   * @evidence contracts/development/implementation.md#principled-implementation The same canonical part, kind and frame identify both entry bearings and emitted windows.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolves the part, then the target frame and bearing kind.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A self region keeps the performing subject and the target region.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The part vocabulary has fixed size.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Entry selection and window emission share this mapping.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No state outlives the call.
   */
  export function bearing(
    context: Pick<
      IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSupport.IParams>,
      ContextField
    >,
    contact: IAutoMovieMotionHumanSupport.IContact,
  ):
    | Pick<IAutoMovieMotionHumanContactWindow, "part" | "kind" | "support">
    | undefined {
    const name: string = supportContact.window(contact.part);
    const part: IAutoMovieMotionHumanContactWindow["part"] | undefined =
      HumanContactWindow.PARTS.find(
        (candidate: IAutoMovieMotionHumanContactWindow["part"]): boolean =>
          candidate === name,
      );
    if (part === undefined) return undefined;
    const target: IAutoMovieMotionTarget | undefined =
      contact.target === "on" ? context.params.on : contact.target;
    const support: IAutoMovieMotionHumanContactWindow.Support =
      target?.kind === "prop"
        ? { kind: "prop", subject: target.subject }
        : target?.kind === "person"
          ? { kind: "person", subject: target.subject, region: target.region }
          : target?.kind === "self"
            ? {
                kind: "person",
                subject: context.subject,
                region: target.region,
              }
            : { kind: "ground" };
    return {
      part,
      kind:
        contact.kind === "grip"
          ? "grip"
          : part === "seat"
            ? "seat"
            : part === "back"
              ? "lie"
              : part === "head" || part === "chest"
                ? "bear"
                : "plant",
      support,
    };
  }

  /**
   * A solved instant of the support sequence.
   * @evidence contracts/development/common.md#meaningful-documentation States both fields and their units.
   * @evidence contracts/development/design.md#principled-representation Each instant carries its solved contacts and seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the two key fields the schedule reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads the same contacts used to carry each interval.
   */
  export interface IKey {
    /** Seconds since the sequence began. */
    seconds: number;
    /** Contacts bearing at the solved instant. */
    contacts: readonly IAutoMovieMotionHumanSupport.IContact[];
  }

  /**
   * A reader told of each window as it opens, with the authored contact that opened it.
   * @evidence contracts/development/common.md#meaningful-documentation States when it is called and with what.
   * @evidence contracts/development/design.md#principled-representation The window is the published record; its end is final once the schedule settles.
   * @evidence contracts/development/design.md#minimal-and-owned-surface planLadderAccess reads it to seat each named grip.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It reads the published window and cannot change it.
   */
  export type Observe = (
    window: IAutoMovieMotionHumanContactWindow,
    contact: IAutoMovieMotionHumanSupport.IContact,
  ) => void;

  /**
   * Windows on the target's actual support frame.
   *
   * @param context The sequence's subject and shared on target.
   * @param keys The solved instants.
   * @param duration The sequence's seconds.
   * @param observe Optional reader of a window and the exact authored target that opens it.
   * @param socket The sole socket each floor foot holds through its window, declared on it (`IAutoMovieMotionHumanContactWindow.socket`).
   * @returns Contact windows.
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, units and result.
   * @evidence contracts/development/implementation.md#principled-implementation Contacts open when placed and close when released; each named target supplies its own support frame, including the shared on target and self regions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads identities, opens and closes their spans, then closes the final spans.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No action-specific support override.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pass over solved contacts, with one map entry per currently held contact.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One read per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing after returning.
   */
  export function of(
    context: Pick<
      IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSupport.IParams>,
      ContextField
    >,
    keys: readonly IKey[],
    duration: number,
    observe?: Observe,
    socket?: (
      contact: IAutoMovieMotionHumanSupport.IContact,
    ) => "heel" | "ball" | undefined,
  ): IAutoMovieMotionHumanContactWindow[] {
    // An interval carries exactly the contacts common to its two solved keys.
    // A newly placed contact starts on the arriving key. A lifted contact
    // ends on the departing key, before the limb begins to travel. The
    // ordered keys supply these boundaries independently of event labels.
    const contacts: IAutoMovieMotionHumanContactWindow[] = [];
    const open: Map<string, IAutoMovieMotionHumanContactWindow> = new Map();
    for (const key of keys) {
      const share: number = key.seconds / duration;
      const held: Set<string> = new Set();
      for (const contact of key.contacts) {
        const id: string = supportContact.id(contact);
        held.add(id);
        const existing: IAutoMovieMotionHumanContactWindow | undefined =
          open.get(id);
        if (existing !== undefined) {
          existing.to = share;
          continue;
        }
        const identity: ReturnType<typeof bearing> = bearing(context, contact);
        if (identity === undefined) continue;
        const holds: "heel" | "ball" | undefined = socket?.(contact);
        const window: IAutoMovieMotionHumanContactWindow = {
          ...identity,
          from: share,
          to: share,
          ...(holds === undefined ? {} : { socket: holds }),
        };
        contacts.push(window);
        open.set(id, window);
        observe?.(window, contact);
      }
      for (const id of open.keys()) if (!held.has(id)) open.delete(id);
    }
    return contacts;
  }
}

import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

import { HumanContactWindow } from "../../law/internal/HumanContactWindow";
import { supportContact } from "./supportContact";

/*
 * Windows on the target's actual support frame.
 * Parameter context: The sequence's subject and shared on target.
 * Parameter keys: The solved instants.
 * Parameter duration: The sequence's seconds.
 * Parameter observe: Optional reader of a window and the exact authored target that
 * opens it.
 * Parameter socket: The sole socket each floor foot holds through its window,
 * declared on it (`IAutoMovieMotionHumanContactWindow.socket`).
 * Returns: Contact windows.
 */
export function supportWindows(
  context: Pick<
    IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSupport.IParams>,
    ContextField
  >,
  keys: readonly supportWindows.IKey[],
  duration: number,
  observe?: supportWindows.Observe,
  socket?: (contact: IAutoMovieMotionHumanSupport.IContact) => OfSocket,
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
      const identity: ReturnType<typeof supportWindows.bearing> =
        supportWindows.bearing(context, contact);
      if (identity === undefined) continue;
      const holds: OfHolds = socket?.(contact);
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
/*
 * A support sequence's declared windows, including the frame each target
 * belongs to. The contact identity keeps separate placements and targets.
 */
export namespace supportWindows {
  /*
   * Describe how and where a stance contact bears.
   */
  export function bearing(
    context: Pick<
      IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSupport.IParams>,
      ContextField
    >,
    contact: IAutoMovieMotionHumanSupport.IContact,
  ): Pick<IAutoMovieMotionHumanContactWindow, BearingResult> | undefined {
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
        ? { kind: "prop", subject: target.subject, point: target.point }
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

  /*
   * A solved instant of the support sequence.
   */
  export interface IKey {
    /*
     * Seconds since the sequence began.
     */
    seconds: number;
    /*
     * Contacts bearing at the solved instant.
     */
    contacts: readonly IAutoMovieMotionHumanSupport.IContact[];
  }

  /*
   * A reader told of each window as it opens, with the authored contact that
   * opened it.
   */
  export type Observe = (
    window: IAutoMovieMotionHumanContactWindow,
    contact: IAutoMovieMotionHumanSupport.IContact,
  ) => void;
}

/*
 * Only the subject and target parameters identify a support frame.
 */
type ContextField = "subject" | "params";

/*
 * The alternatives of `OfHolds`'s site.
 */
type OfHolds = "heel" | "ball" | undefined;

/*
 * The alternatives of `OfSocket`'s site.
 */
type OfSocket = "heel" | "ball" | undefined;

/*
 * The alternatives of `BearingResult`'s site.
 */
type BearingResult = "part" | "kind" | "support";

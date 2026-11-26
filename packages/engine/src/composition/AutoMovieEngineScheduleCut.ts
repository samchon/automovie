import type {
  IAutoMovieIntent,
  IAutoMovieIntentTiming,
  IAutoMovieMotionEvent,
  IAutoMovieScheduleContext,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleCut,
  IAutoMovieScheduleError,
  IAutoMovieScheduleWalk,
} from "@automovie/interface";

import { AutoMovieScheduleError } from "./AutoMovieScheduleError";
import { AutoMovieScheduleWalk } from "./AutoMovieScheduleWalk";

/** Normalization and placement of intent schedule cuts. */
export namespace AutoMovieEngineScheduleCut {
  /**
   * Normalize an authored cut or one of the exact legacy cut shapes.
   *
   * @param value A canonical tagged cut or a supported legacy cut object.
   * @returns Its canonical tagged form.
   * @throws {TypeError} When the value is malformed, mixed, or ambiguous.
   */
  export function normalize(value: unknown): IAutoMovieIntent.IUntil {
    if (typeof value !== "object" || value === null || Array.isArray(value))
      throw new TypeError("Invalid schedule cut: expected an object");
    const record: Record<string, unknown> = value as Record<string, unknown>;
    const hasKeys = (
      props: Record<string, unknown>,
      required: readonly string[],
      optional: readonly string[] = [],
      allowAdditional: boolean = false,
    ): boolean => {
      const allowed: ReadonlySet<string> = new Set([...required, ...optional]);
      return (
        required.every((key: string): boolean => Object.hasOwn(props, key)) &&
        Reflect.ownKeys(props).every(
          (key: string | symbol): boolean =>
            typeof key === "string" && (allowAdditional || allowed.has(key)),
        )
      );
    };
    const isRecord = (input: unknown): input is Record<string, unknown> =>
      typeof input === "object" && input !== null && !Array.isArray(input);
    const isVector = (input: unknown): boolean =>
      isRecord(input) &&
      hasKeys(input, ["x", "y", "z"], [], true) &&
      typeof input.x === "number" &&
      typeof input.y === "number" &&
      typeof input.z === "number";
    const isLine = (line: unknown): boolean =>
      line === "low" || line === "middle" || line === "high";
    const isTarget = (input: unknown): boolean => {
      if (!isRecord(input)) return false;
      switch (input.kind) {
        case "person":
          return (
            hasKeys(input, ["kind", "region", "subject"]) &&
            typeof input.region === "string" &&
            typeof input.subject === "string"
          );
        case "self":
          return (
            hasKeys(input, ["kind", "region"]) &&
            typeof input.region === "string"
          );
        case "prop":
          return (
            hasKeys(input, ["kind", "point", "subject"]) &&
            typeof input.point === "string" &&
            typeof input.subject === "string"
          );
        case "point":
          return (
            hasKeys(input, ["at", "frame", "kind"], ["normal"]) &&
            isVector(input.at) &&
            (input.frame === "world" ||
              input.frame === "performer" ||
              input.frame === "stature") &&
            (input.normal === undefined || isVector(input.normal))
          );
        case "none":
          return (
            hasKeys(input, ["kind"], ["line", "range"]) &&
            (input.line === undefined || isLine(input.line)) &&
            (input.range === undefined || typeof input.range === "number")
          );
        default:
          return false;
      }
    };
    const isProximity = (input: unknown): boolean => {
      if (!isRecord(input)) return false;
      return (
        hasKeys(input, ["distance", "effector", "target"]) &&
        typeof input.distance === "number" &&
        typeof input.effector === "string" &&
        isTarget(input.target)
      );
    };
    const owns = (key: string): boolean => Object.hasOwn(record, key);
    const tagged: boolean = owns("type");
    let variant: string | undefined;
    if (tagged && typeof record.type === "string") variant = record.type;
    else if (!tagged && owns("share")) variant = "share";
    else if (!tagged && owns("proximity")) variant = "proximity";
    else if (!tagged && owns("event"))
      variant = owns("of") ? "anchor-event" : "event";
    switch (variant) {
      case undefined:
        break;
      case "share":
        if (
          hasKeys(record, tagged ? ["type", "share"] : ["share"]) &&
          typeof record.share === "number"
        )
          return tagged
            ? (record as unknown as IAutoMovieIntent.IUntilShare)
            : { type: "share", share: record.share };
        break;
      case "event":
        if (
          hasKeys(record, tagged ? ["type", "event"] : ["event"]) &&
          typeof record.event === "string"
        )
          return tagged
            ? (record as unknown as IAutoMovieIntent.IUntilEvent)
            : { type: "event", event: record.event };
        break;
      case "anchor-event":
        if (
          hasKeys(record, tagged ? ["type", "event", "of"] : ["event", "of"], [
            "index",
          ]) &&
          typeof record.event === "string" &&
          typeof record.of === "string" &&
          (record.index === undefined || typeof record.index === "number")
        )
          return tagged
            ? (record as unknown as IAutoMovieIntent.IUntilAnchorEvent)
            : {
                type: "anchor-event",
                of: record.of,
                event: record.event,
                ...(record.index === undefined ? {} : { index: record.index }),
              };
        break;
      case "proximity":
        if (
          hasKeys(record, tagged ? ["type", "proximity"] : ["proximity"]) &&
          isProximity(record.proximity)
        )
          return tagged
            ? (record as unknown as IAutoMovieIntent.IUntilProximity)
            : {
                type: "proximity",
                proximity: record.proximity as IAutoMovieIntent.IProximity,
              };
    }
    throw new TypeError(
      "Invalid schedule cut: expected one exact tagged or legacy variant",
    );
  }

  /**
   * Resolve an intent's cut.
   *
   * @param walk The walk.
   * @param intent The intent.
   * @param timing Its timing.
   * @param start Where it starts, film seconds.
   * @param context What the laws see while it is placed.
   * @returns The cut, or undefined when nothing cuts it.
   * @throws {AutoMovieScheduleError} When the law, anchor, event or share is
   *   invalid.
   * @throws {TypeError} When its cut is malformed or ambiguous.
   */
  export function of(
    walk: IAutoMovieScheduleWalk.IWalk,
    intent: IAutoMovieIntent,
    timing: IAutoMovieIntentTiming,
    start: number,
    context: IAutoMovieScheduleContext,
  ): IAutoMovieScheduleCut.ICut | undefined {
    if (intent.until === undefined) return undefined;
    const until: IAutoMovieIntent.IUntil = normalize(intent.until);
    const who: Pick<IAutoMovieScheduleError.IProps, "subject" | "capability"> =
      {
        subject: intent.subject,
        capability: intent.capability,
      };
    let cut: IAutoMovieScheduleCut.ICut | undefined;
    switch (until.type) {
      case "proximity": {
        if (walk.laws.until === undefined)
          throw new AutoMovieScheduleError(
            `${intent.subject}.${intent.capability} cuts on proximity, which these laws cannot resolve`,
            { ...who, code: "law", value: "until" },
          );
        const share: number | undefined = walk.laws.until(
          until === intent.until ? intent : { ...intent, until },
          { start, duration: timing.duration },
          context,
        );
        if (share !== undefined) cut = { share };
        break;
      }
      case "anchor-event": {
        const events: readonly IAutoMovieScheduleCue[] | undefined =
          AutoMovieScheduleWalk.instants(walk, until.of);
        if (events === undefined)
          throw new AutoMovieScheduleError(
            `Cut of ${intent.subject}.${intent.capability} waits for ${until.of}, which is not placed earlier`,
            {
              ...who,
              code: "anchor",
              of: until.of,
              value: until.of,
              alternatives: AutoMovieScheduleWalk.placed(walk),
            },
          );
        const seconds: number = AutoMovieScheduleWalk.instant(
          until.of,
          events,
          until.event,
          until.index ?? 0,
          intent,
        );
        cut = {
          share:
            timing.duration === 0 ? 0 : (seconds - start) / timing.duration,
          event: `${until.of}.${until.event}`,
        };
        break;
      }
      case "event": {
        const event: IAutoMovieMotionEvent | undefined = timing.events?.find(
          (e: IAutoMovieMotionEvent): boolean => e.name === until.event,
        );
        if (event === undefined)
          throw new AutoMovieScheduleError(
            `${intent.subject}.${intent.capability} has no event ${until.event}; its events are ${(timing.events ?? []).map((e: IAutoMovieMotionEvent): string => e.name).join(", ") || "none"}`,
            {
              ...who,
              code: "event",
              value: until.event,
              alternatives: (timing.events ?? []).map(
                (e: IAutoMovieMotionEvent): string => e.name,
              ),
            },
          );
        cut = { share: event.share, event: event.name };
        break;
      }
      case "share":
        cut = { share: until.share };
        break;
    }
    if (cut !== undefined && !(cut.share >= 0 && cut.share <= 1))
      throw new AutoMovieScheduleError(
        `Cut share of ${intent.subject}.${intent.capability} lies outside [0, 1]`,
        {
          ...who,
          code: "share",
          value: cut.share,
          ...(until.type === "anchor-event" ? { of: until.of } : {}),
        },
      );
    return cut;
  }
}

import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";

/**
 * One deterministic event-to-sample soundtrack for the Viewer and final export.
 *
 * @evidence contracts/common.md#implementation-and-ownership Builds only receipt-backed impact cues, then sums the fixed mono sources with equal-power pan, four-millisecond edge fades and a fixed -6 dB master. A clipping result refuses publication. Cost is linear in audible cue samples plus the exact 180-second stereo output.
 * @evidence contracts/common.md#authoring-interface Events use the film's absolute clock. Contacts must be measured from the compiled displayed actors, not copied from planned outcomes. Source offsets, rates and gains survive unchanged into both consumers; listening and geometric truth remain external acceptance checks.
 */
export namespace AudioMix {
  /**
   * Fixed source identities admitted by the production's asset manifest.
   *
   * @evidence contracts/common.md#implementation-and-ownership The closed family separates five bag impacts, voice takes and recorded or explicitly designed Foley. An identity establishes neither contact nor timbre suitability.
   * @evidence contracts/common.md#authoring-interface Numbered count sources are English male spoken numbers. Every referenced source must have retained PCM bytes and a matching digest before playback or export.
   */
  export type Source =
    | "punch1"
    | "punch2"
    | "punch3"
    | "punch4"
    | "punch5"
    | "fight"
    | "bell"
    | "breath"
    | "step"
    | "air"
    | "fall"
    | "crowd"
    | "applause"
    | "down"
    | "neutral"
    | "decision"
    | `count${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`;

  /**
   * Minimum actual displayed-contact receipt needed to admit an impact sound.
   *
   * @evidence contracts/common.md#implementation-and-ownership The compiled runtime owns measurement and provenance. The mixer rejects duplicate, orphan or mismatched receipts and never turns an attempted strike into a claimed hit; an absent ordinary interception emits no impact cue.
   * @evidence contracts/common.md#authoring-interface Seconds are absolute film seconds, participant identities must match the planned event, and relation names the measured receiving surface. This structural input does not independently remeasure geometry.
   */
  export interface Contact {
    /** Source-plan contact event. */
    eventId: string;
    /** Actual attacking action. */
    actionId: string;
    /** Attacker. */
    actorId: FilmPlan.ActorId;
    /** Receiver. */
    targetId: FilmPlan.ActorId;
    /** Actual first contact on the film clock. */
    seconds: number;
    /** Measured receiving surface. */
    relation: "guard" | "body" | "head" | "shin-check";
    /** Actual runtime query and its limits. */
    provenance: string;
  }

  /**
   * Actual fitted ground arrival of a body region during the articulated fall.
   *
   * @evidence contracts/common.md#implementation-and-ownership The runtime owns first-arrival sampling and support inspection. These records keep hip and shoulder arrivals distinct instead of attaching a single impact to a planned knockout time.
   * @evidence contracts/common.md#authoring-interface Event id matches a fall request, seconds use the absolute film clock and provenance states the actual query and sampling limitation. The mixer does not infer a ground strike from a falling pose.
   */
  export interface FloorContact {
    /** Matching fall event identity. */
    eventId: string;
    /** Falling actor. */
    actorId: FilmPlan.ActorId;
    /** Measured arrival on the film clock. */
    seconds: number;
    /** Distinct region arriving at the mat. */
    bodyPart: "hip" | "shoulder";
    /** Actual query and finite-sampling limitations. */
    provenance: string;
  }

  /**
   * Fully resolved native-speed source excerpt on the one film clock.
   *
   * @evidence contracts/common.md#implementation-and-ownership Each id is unique, every excerpt remains within the fixed source, and required contact id links impact intent to the actual runtime receipt. Both hosts consume these same scalar controls.
   * @evidence contracts/common.md#authoring-interface Seconds, offsetSeconds and durationSeconds are seconds; gain is linear amplitude, pan is [-1,1], and rate is source seconds per film second. Duration describes film time after rate conversion.
   */
  export interface Cue {
    /** Unique schedule identity. */
    id: string;
    /** Absolute audible onset. */
    seconds: number;
    /** Fixed retained sample identity. */
    source: Source;
    /** Offset into the prepared PCM recording. */
    offsetSeconds: number;
    /** Audible duration on the film clock. */
    durationSeconds: number;
    /** Linear amplitude before the fixed master. */
    gain: number;
    /** Equal-power stereo position. */
    pan: number;
    /** Source samples per output sample. */
    rate: number;
    /** Required actual contact identity for an impact, otherwise absent. */
    contactId?: string;
    /** Replayable foot arrival provenance from the same actual displayed state. */
    footfall?: FilmPlan.Event["footfall"];
  }

  /**
   * Compile a complete cue list from planned events and actual impact receipts.
   *
   * @evidence contracts/common.md#implementation-and-ownership Validates the full event and receipt collections before returning a detached sorted list. Misses produce air only; guard/check and flesh contacts choose distinct excerpts and gains. Foot sounds follow explicit actor-owned step events rather than attack frequency.
   * @evidence contracts/common.md#authoring-interface A contact event without a measured receipt contributes no impact. The runtime separately requires the opening touch and finishing head contact before allowing complete audio preparation. A supplied receipt supplies actual onset and category; an explicit planned relation constrains that observed category.
   */
  export function build(
    events: readonly FilmPlan.Event[],
    contacts: readonly Contact[],
    floorContacts: readonly FloorContact[] = [],
  ): Cue[] {
    const ids: Set<string> = new Set<string>();
    const byId: Map<string, Contact> = new Map<string, Contact>();
    const floorById: Map<string, FloorContact> = new Map<
      string,
      FloorContact
    >();
    for (const contact of contacts) {
      if (
        byId.has(contact.eventId) ||
        !contact.provenance.trim() ||
        !Number.isFinite(contact.seconds) ||
        contact.seconds < 0 ||
        contact.seconds > 180 ||
        contact.actorId === contact.targetId
      )
        throw new Error(`Invalid audio contact receipt: ${contact.eventId}`);
      byId.set(contact.eventId, contact);
    }
    for (const contact of floorContacts) {
      if (
        floorById.has(contact.eventId) ||
        !contact.provenance.trim() ||
        !Number.isFinite(contact.seconds) ||
        contact.seconds < 0 ||
        contact.seconds > 180 ||
        (contact.bodyPart !== "hip" && contact.bodyPart !== "shoulder")
      )
        throw new Error(`Invalid actual mat contact: ${contact.eventId}`);
      floorById.set(contact.eventId, contact);
    }
    const cues: Cue[] = [];
    for (const event of events) {
      if (
        ids.has(event.id) ||
        !Number.isFinite(event.seconds) ||
        event.seconds < 0 ||
        event.seconds > 180 ||
        (event.durationSeconds !== undefined &&
          (!Number.isFinite(event.durationSeconds) ||
            event.durationSeconds <= 0))
      )
        throw new Error(`Invalid audio event: ${event.id}`);
      ids.add(event.id);
      const pan: number =
        event.actorId === "a" ? -0.25 : event.actorId === "b" ? 0.25 : 0;
      const add: (
        source: Source,
        duration: number,
        gain: number,
        offset?: number,
        rate?: number,
        contactId?: string,
      ) => void = (
        source: Source,
        duration: number,
        gain: number,
        offset: number = 0,
        rate: number = 1,
        contactId?: string,
      ): void => {
        cues.push({
          id: event.id,
          seconds: event.seconds,
          source,
          offsetSeconds: offset,
          durationSeconds: Math.min(duration, 180 - event.seconds),
          gain,
          pan,
          rate,
          ...(contactId === undefined ? {} : { contactId }),
          ...(event.footfall === undefined
            ? {}
            : { footfall: structuredClone(event.footfall) }),
        });
      };
      if (event.kind === "contact" || event.kind === "touch") {
        const contact: Contact | undefined = byId.get(event.id);
        if (contact === undefined) continue;
        if (
          contact.actionId !== event.actionId ||
          contact.actorId !== event.actorId ||
          contact.targetId !== event.targetId ||
          (event.relation !== undefined &&
            contact.relation !== event.relation) ||
          (event.requiresContact !== undefined &&
            event.requiresContact !== contact.actionId)
        )
          throw new Error(`Mismatched actual audio contact: ${event.id}`);
        const variation: number =
          ([...event.id].reduce(
            (sum: number, character: string): number =>
              sum + character.charCodeAt(0),
            0,
          ) %
            4) +
          1;
        const source: Source =
          contact.relation === "body" || contact.relation === "head"
            ? "punch5"
            : (`punch${variation}` as Source);
        add(
          source,
          event.kind === "touch" ? 0.14 : 0.27,
          event.kind === "touch"
            ? 0.12
            : contact.relation === "body"
              ? 0.6
              : contact.relation === "head"
                ? 0.68
                : 0.42,
          0,
          contact.relation === "shin-check" ? 0.85 : 1,
          contact.eventId,
        );
        cues[cues.length - 1].seconds = contact.seconds;
        cues[cues.length - 1].durationSeconds = Math.min(
          cues[cues.length - 1].durationSeconds,
          180 - contact.seconds,
        );
        byId.delete(contact.eventId);
      } else if (event.kind === "attempt" || event.kind === "miss")
        add("air", 0.15, event.kind === "miss" ? 0.12 : 0.06);
      else if (event.kind === "step") {
        const arrival: FilmPlan.Event["footfall"] = event.footfall;
        if (
          arrival &&
          (!["solver", "geometric"].includes(arrival.source) ||
            !["authored", "return", "dynamic"].includes(arrival.ownership) ||
            (arrival.source === "solver") !==
              (arrival.ownership === "dynamic") ||
            !arrival.bone.trim() ||
            !Number.isFinite(arrival.contactSeconds) ||
            arrival.contactSeconds < 0 ||
            arrival.contactSeconds > event.seconds ||
            !Number.isFinite(arrival.ownershipSeconds) ||
            arrival.ownershipSeconds < arrival.contactSeconds ||
            arrival.ownershipSeconds > event.seconds ||
            arrival.confirmedSeconds !== event.seconds ||
            (arrival.recoverySeconds !== undefined &&
              (!Number.isFinite(arrival.recoverySeconds) ||
                arrival.recoverySeconds > event.seconds)) ||
            !arrival.receiptIds.length ||
            new Set(arrival.receiptIds).size !== arrival.receiptIds.length ||
            arrival.receiptIds.some((id: string): boolean => !id.trim()))
        )
          throw new Error(`Invalid footfall provenance: ${event.id}`);
        const variation: number =
          [...event.id].reduce(
            (sum: number, character: string): number =>
              sum + character.charCodeAt(0),
            0,
          ) % 5;
        add(
          "step",
          0.14,
          (event.actorId === "referee" ? 0.16 : 0.24) *
            (0.92 + variation * 0.04),
          0,
          0.94 + variation * 0.03,
        );
      } else if (event.kind === "bell") add("bell", 1.8, 0.38);
      else if (event.kind === "count") {
        if (
          event.count === undefined ||
          !Number.isInteger(event.count) ||
          event.count < 1 ||
          event.count > 10
        )
          throw new Error(`Invalid referee count: ${event.id}`);
        add(`count${event.count}` as Source, 0.85, 0.95);
      } else if (event.kind === "decision") {
        if (
          event.durationSeconds === undefined ||
          !Number.isFinite(event.durationSeconds) ||
          event.durationSeconds <= 0
        )
          throw new Error(`Missing adopted decision window: ${event.id}`);
        add("decision", event.durationSeconds, 0.95);
      } else if (event.kind === "celebration")
        add("applause", Math.min(12, 180 - event.seconds), 0.2);
      else if (event.kind === "breath") {
        const window: number = event.durationSeconds ?? 6;
        if (!Number.isFinite(window) || window <= 0 || window > 6)
          throw new Error(`Invalid breathing window: ${event.id}`);
        add(
          "breath",
          window,
          event.seconds >= 150
            ? event.actorId === "b"
              ? 0.018
              : 0.045
            : 0.028,
          event.actorId === "a" ? 0 : 7,
        );
      } else if (event.kind === "speech") {
        if (event.speech === undefined)
          throw new Error(`Missing referee speech identity: ${event.id}`);
        add(
          event.speech,
          event.durationSeconds ??
            (event.speech === "neutral"
              ? 1.7
              : event.speech === "fight"
                ? 0.8
                : event.speech === "down"
                  ? 0.65
                  : 2.3),
          0.95,
        );
      } else if (event.kind === "fall") {
        const contact: FloorContact | undefined = floorById.get(event.id);
        if (contact === undefined || contact.actorId !== event.actorId)
          throw new Error(`Missing actual mat contact: ${event.id}`);
        add(
          "fall",
          0.36,
          contact.bodyPart === "hip" ? 0.55 : 0.32,
          0,
          contact.bodyPart === "hip" ? 0.85 : 1,
          contact.eventId,
        );
        cues[cues.length - 1].seconds = contact.seconds;
        cues[cues.length - 1].durationSeconds = Math.min(
          0.36,
          180 - contact.seconds,
        );
        floorById.delete(contact.eventId);
      } else if (event.kind === "ambience") {
        for (let seconds: number = event.seconds; seconds < 180; seconds += 24)
          cues.push({
            id: `${event.id}:${seconds}`,
            seconds,
            source: "crowd",
            offsetSeconds: 0,
            durationSeconds: Math.min(24, 180 - seconds),
            gain: 0.025,
            pan: 0,
            rate: 1,
          });
      }
    }
    if (byId.size > 0)
      throw new Error(
        `Unmapped actual audio contacts: ${[...byId.keys()].join(", ")}`,
      );
    if (floorById.size > 0)
      throw new Error(
        `Unmapped actual mat contacts: ${[...floorById.keys()].join(", ")}`,
      );
    return cues
      .filter((cue: Cue): boolean => cue.durationSeconds > 0)
      .sort(
        (left: Cue, right: Cue): number =>
          left.seconds - right.seconds ||
          (left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
      );
  }

  /**
   * Render fixed excerpts into exactly 8,640,000 stereo frames at 48 kHz.
   *
   * @evidence contracts/common.md#implementation-and-ownership Uses linear fractional resampling, equal-power pan and symmetric edge fades. Samples outside the excerpt are never read. The fixed master gain is 0.5; a nonfinite or peak-above-one result refuses instead of hiding clipping with a limiter.
   * @evidence contracts/common.md#authoring-interface Every cue source is normalized mono PCM at 48 kHz. The caller owns returned channels; input arrays and cues are unchanged. The output is always 180 seconds, including any intentional trailing room tone or silence.
   */
  export function render(
    cues: readonly Cue[],
    sources: ReadonlyMap<Source, Float32Array>,
  ): { left: Float32Array; right: Float32Array; peak: number } {
    const left: Float32Array = new Float32Array(180 * 48000);
    const right: Float32Array = new Float32Array(left.length);
    const ids: Set<string> = new Set<string>();
    for (const cue of cues) {
      if (
        ids.has(cue.id) ||
        ![
          cue.seconds,
          cue.offsetSeconds,
          cue.durationSeconds,
          cue.gain,
          cue.pan,
          cue.rate,
        ].every(Number.isFinite) ||
        cue.seconds < 0 ||
        cue.seconds >= 180 ||
        cue.offsetSeconds < 0 ||
        cue.durationSeconds <= 0 ||
        cue.seconds + cue.durationSeconds > 180 + 1 / 48000 ||
        cue.gain < 0 ||
        cue.gain > 2 ||
        Math.abs(cue.pan) > 1 ||
        cue.rate <= 0 ||
        cue.rate > 2
      )
        throw new Error(`Invalid audio cue: ${cue.id}`);
      ids.add(cue.id);
      const source: Float32Array | undefined = sources.get(cue.source);
      if (source === undefined || source.length === 0)
        throw new Error(`Audio source not prepared: ${cue.source}`);
      const count: number = Math.round(cue.durationSeconds * 48000);
      const start: number = Math.round(cue.seconds * 48000);
      const offset: number = cue.offsetSeconds * 48000;
      if (offset + (count - 1) * cue.rate > source.length - 1 + 1e-6)
        throw new Error(`Audio source excerpt exceeds fixed bytes: ${cue.id}`);
      const gainLeft: number =
        Math.cos(((cue.pan + 1) * Math.PI) / 4) * cue.gain * 0.5;
      const gainRight: number =
        Math.sin(((cue.pan + 1) * Math.PI) / 4) * cue.gain * 0.5;
      const fade: number = Math.min(192, Math.floor(count / 2));
      for (
        let index: number = 0;
        index < count && start + index < left.length;
        index++
      ) {
        const position: number = offset + index * cue.rate;
        const lower: number = Math.floor(position);
        const fraction: number = position - lower;
        const sample: number =
          source[lower] * (1 - fraction) +
          source[Math.min(lower + 1, source.length - 1)] * fraction;
        if (!Number.isFinite(sample) || Math.abs(sample) > 1)
          throw new Error(`Invalid source amplitude: ${cue.source}`);
        const edge: number =
          fade === 0
            ? 1
            : Math.min(1, index / fade, (count - 1 - index) / fade);
        left[start + index] += sample * edge * gainLeft;
        right[start + index] += sample * edge * gainRight;
      }
    }
    let peak: number = 0;
    for (let index: number = 0; index < left.length; index++)
      peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]));
    if (!Number.isFinite(peak) || peak > 1)
      throw new Error(`Soundtrack clips at peak ${peak}`);
    return { left, right, peak };
  }
}

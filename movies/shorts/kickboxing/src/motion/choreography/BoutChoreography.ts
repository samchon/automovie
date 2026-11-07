import { BoutAnswer } from "./BoutAnswer";
import type { BoutGeometry } from "./BoutGeometry";
import { BoutOutcome } from "./BoutOutcome";
import { BoutTechnique } from "./BoutTechnique";
import { BoutTimeline } from "./BoutTimeline";
import { BoutVariation } from "./BoutVariation";

/**
 * Small authoring API for a bout. The screenplay is composed as attacker intent
 * (a combination) and receiver intent (what he reads, which answer, when),
 * plus the outcome class the screenplay requires. Performing the composition
 * derives every contact second from the registered specs and composition
 * rules, draws seeded continuous parameters, computes each outcome from the
 * relations, and refuses any composition whose intents cannot produce the
 * required outcome. Only screenplay anchors are explicit.
 */
export namespace BoutChoreography {
  /** One fighter. */
  export type Fighter = "a" | "b";

  /** A strike, the receiver's intent and the outcome class the screenplay requires; or one supported step that plants both feet. */
  export type Move = readonly [BoutTechnique.Name, BoutAnswer.IIntent, BoutOutcome.Class] | "settle";

  /** One fighter's continuous combination. */
  export interface IPhrase {
    /** Attacker. */ readonly actor: Fighter;
    /** Moves in order. */ readonly moves: readonly Move[];
  }

  /**
   * Where the exchange takes the pair in the ring, a screenplay beat realized
   * by the ring-generalship laws for the fighter who moves: `circle` he
   * circles off toward his lead side; `press` he walks the other back and
   * cuts off the ring; `pivot` he pivots off the line onto an angle; `center`
   * he retakes the centre of the ring.
   */
  export type Ring = "circle" | "press" | "pivot" | "center";

  /** One ring beat and the fighter whose footwork carries it. */
  export interface IRing {
    /** Movement law. */ readonly beat: Ring;
    /** Fighter who moves. */ readonly actor: Fighter;
  }

  /** Phrases that answer one another without a reset, under a stable name that keys its variation. */
  export interface IExchange {
    /** Stable unique name. */ readonly name: string;
    /** Ring beat of the reset into it and of the exchange itself; without one, the opener's receiver circles off. */ readonly ring?: IRing;
    /** Spread scale of this exchange's variation, multiplied with the film scale. */ readonly scale: number;
    /** Opening phrase first; each later phrase starts when its actor is free. */ readonly phrases: readonly IPhrase[];
  }

  /** A screenplay group: exchanges separated by equal resets inside fixed bounds, with a half reset at each bound. */
  export interface IGroup {
    /** First second available to the group. */ readonly start: number;
    /** Group end, or the anchored contact second of its last strike. */ readonly end: number;
    /** True when `end` is the exact contact of the last strike. */ readonly anchored: boolean;
    /** Exchanges in order. */ readonly exchanges: readonly IExchange[];
  }

  /** Continuous parameters of one strike and its answer, drawn and admitted for the required outcome. */
  export interface IParameters {
    /** Second the answer started. */ readonly begin: number;
    /** Fraction of the answer set by contact: guard coverage or evasion clearance of the weapon patch. */ readonly progress: number;
    /** Weapon patch centre across the target region, metres. */ readonly contactOffset: number;
    /** Approach deviation from the region normal inside the region's visible cone, radians. */ readonly approach: number;
    /** Commitment: the cosine of the approach deviation. */ readonly power: number;
    /** Recovery seconds after the hold, scaled by commitment. */ readonly recovery: number;
  }

  /** One derived row consumed by motion, contact, sound, effects and audits. */
  export interface IAction {
    /** Stable identity shared with sound cues and contact receipts. */ readonly id: string;
    /** Film second of contact, closest pass or deepest feint. */ readonly at: number;
    /** Attacker. */ readonly actor: Fighter;
    /** Registered technique. */ readonly technique: BoutTechnique.Name;
    /** Receiver intent. */ readonly answer: BoutAnswer.IIntent;
    /** Computed outcome. */ readonly outcome: BoutOutcome.Class;
    /** Combination identity. */ readonly combo: string;
    /** Exchange name. */ readonly exchange: string;
    /** Continuous parameters. */ readonly parameters: IParameters;
  }

  /** Performance inputs: the film's variation and the extents outcomes are measured against. */
  export interface IOptions extends BoutVariation.IOptions {
    /** Actual or estimated extents. */ readonly extents: BoutGeometry.IExtents;
  }

  /** Seconds of one supported step, matching the footstep schedule. */
  export const STEP: number = 0.18;

  /** Shortest reset between exchanges: two supported steps out of range and two back in. */
  export const RESET: number = 4 * STEP;

  /** One fighter's combination. */
  export function combo(actor: Fighter, ...moves: Move[]): IPhrase {
    return { actor, moves };
  }

  /** Phrases that answer one another, under a stable name. */
  export function exchange(name: string, ...phrases: IPhrase[]): IExchange {
    return { name, scale: 1, phrases };
  }

  /** The same exchange with the ring beat the screenplay states. */
  export function ring(beat: Ring, actor: Fighter, value: IExchange): IExchange {
    return { ...value, ring: { beat, actor } };
  }

  /** The same exchange with its variation spread scaled. */
  export function vary(scale: number, value: IExchange): IExchange {
    return { ...value, scale };
  }

  /** Exchanges spread evenly through a screenplay group. */
  export function group(start: number, end: number, ...exchanges: IExchange[]): IGroup {
    return { start, end, anchored: false, exchanges };
  }

  /** Exchanges spread evenly so the last strike of the last exchange lands exactly at `contact`. */
  export function finale(start: number, contact: number, ...exchanges: IExchange[]): IGroup {
    return { start, end: contact, anchored: true, exchanges };
  }

  /** Perform composed groups: derive timing, draw variation, compute and check outcomes. */
  export function perform(groups: readonly IGroup[], options: IOptions): readonly IAction[] {
    const names: string[] = groups.flatMap((value: IGroup): string[] =>
      value.exchanges.map((item: IExchange): string => item.name),
    );
    if (new Set(names).size !== names.length) throw new Error("Exchange names must be unique");
    const placed: IRow[][] = [];
    for (const current of groups) {
      const measured: IMeasured[] = current.exchanges.map(
        (value: IExchange): IMeasured => play(value, 0, options),
      );
      const last: IMeasured = measured.at(-1)!;
      const used: number = measured
        .slice(0, current.anchored ? -1 : undefined)
        .reduce((sum: number, value: IMeasured): number => sum + value.duration, 0);
      // Exchanges are separated by equal resets, and each group bound takes a
      // half reset, so neighbouring groups share one reset across the bound.
      // A finale ends at its anchored contact instead of a half reset.
      const room: number = current.anchored ? current.end - last.lastContact - current.start : current.end - current.start;
      const reset: number = (room - used) / (current.anchored ? measured.length - 0.5 : measured.length);
      if (!(reset >= RESET))
        throw new Error(`Group ${current.start}–${current.end} leaves ${reset.toFixed(3)} s per reset, below ${RESET} s`);
      let origin: number = current.start + reset / 2;
      for (const value of current.exchanges) {
        const performed: IMeasured = play(value, origin, options);
        placed.push(...performed.rows);
        origin += performed.duration + reset;
      }
      // Summed offsets carry floating-point residue; the anchored contact is
      // a screenplay value, so the derived last row takes it exactly.
      if (current.anchored) {
        const final: IRow = placed.at(-1)!.at(-1)!;
        if (Math.abs(final.at - current.end) > 1e-9)
          throw new Error(`Anchored contact missed ${current.end} by ${final.at - current.end} s`);
        final.at = current.end;
      }
    }
    return identify(placed);
  }

  /** A performed strike before identification; its contact may still take an anchored value. */
  interface IRow {
    /** Film second of contact. */ at: number;
    /** Attacker. */ readonly actor: Fighter;
    /** Registered technique. */ readonly technique: BoutTechnique.Name;
    /** Receiver intent. */ readonly answer: BoutAnswer.IIntent;
    /** Computed outcome. */ readonly outcome: BoutOutcome.Class;
    /** Exchange name. */ readonly exchange: string;
    /** Continuous parameters. */ readonly parameters: IParameters;
  }

  /** One exchange performed from `origin`. */
  interface IMeasured {
    /** Rows of each phrase, in film order. */ readonly rows: IRow[][];
    /** Seconds from origin until both fighters are free. */ readonly duration: number;
    /** Seconds from origin to the last contact. */ readonly lastContact: number;
  }

  /** Perform one exchange on fresh timelines. Both fighters are free at `origin` and every draw is keyed by name and position, so the result is translation invariant. */
  function play(value: IExchange, origin: number, options: IOptions): IMeasured {
    const timelines: Record<Fighter, BoutTimeline> = { a: new BoutTimeline(origin), b: new BoutTimeline(origin) };
    const rows: IRow[][] = [];
    let lastContact: number = origin;
    for (const [phraseIndex, phrase] of value.phrases.entries()) {
      const own: BoutTimeline = timelines[phrase.actor];
      const other: BoutTimeline = timelines[phrase.actor === "a" ? "b" : "a"];
      const performed: IRow[] = [];
      for (const [moveIndex, move] of phrase.moves.entries()) {
        if (move === "settle") {
          own.settle(origin, STEP);
          continue;
        }
        const [name, intent, required]: readonly [BoutTechnique.Name, BoutAnswer.IIntent, BoutOutcome.Class] = move;
        const technique: BoutTechnique.ISpec = BoutTechnique.get(name);
        const answer: BoutAnswer.ISpec = BoutAnswer.get(intent.family);
        const side: BoutTechnique.Side = BoutAnswer.side(technique.side);
        const free: number = other.free(answer, side, origin);

        // A set answer needs its limb free before contact; the attacker's
        // read of that guard is part of the composed intent.
        const ready: number =
          intent.timing === "committed" ? free : intent.timing === "anticipated" ? free + answer.lead - technique.windup : -Infinity;
        const start: number = Math.max(own.attackable(technique, origin), ready);
        const draw: (parameter: string) => number = (parameter: string): number =>
          BoutVariation.draw(options.seed, `${value.name}/${phraseIndex}/${moveIndex}/${parameter}`, (options.scale ?? 1) * value.scale);
        const parameters: IParameters = admit(value.name, technique, intent, required, start, free, draw, options.extents);
        const at: number = own.attack(technique, start, parameters.recovery);
        const outcome: BoutOutcome.Class = classify(technique, intent, at, parameters);
        other.answer(answer, side, BoutOutcome.release(name, intent, outcome, at, parameters.begin));
        lastContact = Math.max(lastContact, at);
        performed.push({ at, actor: phrase.actor, technique: name, answer: intent, outcome, exchange: value.name, parameters });
      }
      rows.push(performed);
    }
    return { rows, duration: Math.max(timelines.a.end(), timelines.b.end()) - origin, lastContact: lastContact - origin };
  }

  /**
   * Rule first: the required class fixes the interval of the answer's set
   * fraction (or, for a feint, whether the receiver starts before it returns);
   * that interval and the answer's timing class bound when the receiver may
   * begin. Geometry then audits the class and bounds where the weapon patch
   * may land. Seeded draws pick points inside those derived domains only, so
   * no draw can change the class; an empty domain refuses the composition.
   */
  function admit(
    name: string,
    technique: BoutTechnique.ISpec,
    intent: BoutAnswer.IIntent,
    required: BoutOutcome.Class,
    launch: number,
    free: number,
    draw: (parameter: string) => number,
    extents: BoutGeometry.IExtents,
  ): IParameters {
    const answer: BoutAnswer.ISpec = BoutAnswer.get(intent.family);
    const contact: number = launch + technique.windup;
    const timing: readonly [number, number] = beginDomain(intent.timing, launch, contact, free, answer.lead);
    const returned: number = contact + technique.recovery;
    let begins: readonly [number, number] | null;
    if (!technique.contact)
      begins =
        required === "bit" && answer.family !== "none"
          ? intersect(timing, [-Infinity, returned - Number.EPSILON * Math.max(1, returned)])
          : required === "ignored"
            ? answer.family === "none"
              ? timing
              : intersect(timing, [returned, Infinity])
            : null;
    else {
      const progress: readonly [number, number] | null = BoutOutcome.progressFor(technique.name, intent, required);
      begins =
        progress === null
          ? null
          : answer.lead > 0
            ? intersect(timing, [
                progress[1] >= 1 ? -Infinity : contact - progress[1] * answer.lead,
                // An answer that starts at or after contact has set nothing,
                // so a zero lower bound leaves every later start admissible.
                progress[0] <= 0 ? Infinity : contact - progress[0] * answer.lead,
              ])
            : timing;
    }
    const contacts: readonly [number, number] | null = BoutOutcome.realizable(technique.name, intent, required, extents);
    if (begins === null || contacts === null)
      throw new Error(`${name}: ${technique.name} against ${intent.timing} ${intent.family} cannot produce ${required}`);
    const reach: number = Math.max(Math.abs(contacts[0]), Math.abs(contacts[1]));
    const cone: number = Math.atan(reach / technique.range);
    const approach: number = BoutVariation.within([-cone, cone], draw("approach"));
    const power: number = Math.cos(approach);
    const begin: number = BoutVariation.within(begins, draw("begin"));
    const parameters: IParameters = {
      begin,
      progress: setFraction(begin, contact, answer.lead),
      contactOffset: BoutVariation.within(contacts, draw("contact")),
      approach,
      power,
      recovery: technique.recovery * power,
    };
    const decided: BoutOutcome.Class = classify(technique, intent, contact, parameters);
    if (decided !== required) throw new Error(`${name}: ${technique.name} decided ${decided}, screenplay requires ${required}`);
    return parameters;
  }

  /**
   * Overlap of two closed intervals, or null when they are disjoint. Bounds
   * that agree within double-precision roundoff of film seconds touch: a
   * limb freed exactly when an answer must start is one instant, not a gap.
   */
  function intersect(a: readonly [number, number], b: readonly [number, number]): readonly [number, number] | null {
    const low: number = Math.max(a[0], b[0]);
    const high: number = Math.min(a[1], b[1]);
    if (low <= high) return [low, high];
    return low - high <= roundoff(low) ? [high, high] : null;
  }

  /** Double-precision roundoff of sums of film seconds near `value`. */
  function roundoff(value: number): number {
    return 8 * Number.EPSILON * Math.max(1, Math.abs(value));
  }

  /** Fraction of an answer set by contact; an answer whose set instant equals contact within roundoff is fully set. */
  function setFraction(begin: number, contact: number, lead: number): number {
    if (!(lead > 0)) return 0;
    if (begin + lead <= contact + roundoff(contact)) return 1;
    return Math.max(0, Math.min(1, (contact - begin) / lead));
  }

  /** Start domain of an answer by its timing class, never before its limb is free. */
  function beginDomain(
    timing: BoutAnswer.Timing,
    launch: number,
    contact: number,
    free: number,
    lead: number,
  ): readonly [number, number] {
    const domain: readonly [number, number] =
      timing === "committed"
        ? [free, launch]
        : timing === "anticipated"
          ? [free, contact - lead]
          : timing === "reactive"
            ? [launch + BoutAnswer.SIMPLE[0], launch + BoutAnswer.SIMPLE[1]]
            : [launch + BoutAnswer.CHOICE[0], launch + BoutAnswer.CHOICE[1]];
    const low: number = Math.max(domain[0], free);
    return [low, Math.max(low, domain[1])];
  }

  /** The rule's class for drawn parameters. */
  function classify(
    technique: BoutTechnique.ISpec,
    intent: BoutAnswer.IIntent,
    contact: number,
    parameters: IParameters,
  ): BoutOutcome.Class {
    return BoutOutcome.decide(technique.name, intent, parameters.progress, parameters.begin < contact + technique.recovery);
  }

  /** Assign stable ids and combination ids in film order. */
  function identify(phrases: readonly IRow[][]): readonly IAction[] {
    const counts: Record<Fighter, number> = { a: 0, b: 0 };
    const rows: Omit<IAction, "id">[] = [];
    for (const phrase of phrases) {
      if (!phrase.length) continue;
      const actor: Fighter = phrase[0]!.actor;
      const combo: string = `${actor}${String(++counts[actor]).padStart(2, "0")}`;
      for (const row of phrase) rows.push({ ...row, combo });
    }
    rows.sort((x: Omit<IAction, "id">, y: Omit<IAction, "id">): number => x.at - y.at);
    return Object.freeze(
      rows.map(
        (row: Omit<IAction, "id">, index: number): IAction =>
          Object.freeze({ ...row, id: `x${String(index + 1).padStart(3, "0")}-${row.actor}-${row.technique}` }),
      ),
    );
  }
}

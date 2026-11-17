import type { IAutoMovieMotionClock, IAutoMovieMotionClockInstant } from "@automovie/interface";
import { AutoMovieMotionClock as C } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Prepared action intervals resolve native fixed names on first demand and evaluate every
 * actual query second through the existing linear and minimum-jerk laws.
 *
 * Scenarios:
 * 1. The named [2,6] second interval has clamped shares0,1/4,1/2,3/4,1
 *    and progress10u^3-15u^4+6u^5, including backward and repeated reads.
 *    The actual native public clock preserves its fixed interval.
 * 2. Equal and reversed endpoints retain the original step at the closing
 *    second. A one-picosecond interval remains linear at its midpoint, while
 *    the adjacent shorter interval uses its stated step rule.
 * 3. A separate clock with identical names gives its own numeric interval,
 *    and a missing name refuses on the first requested native query before it can return a scalar.
 * 4. A full owned custom clock retains actual receiver-bound linear/progress
 *    callbacks. Construction reads no custom instant; each current linear
 *    query needs exactly two lookups. Changing current named instants affects
 *    later reads, and a custom missing name refuses at its own actual query.
 * 5. An owned custom clock exposes live linear/progress getters whose actual
 *    callbacks do not depend on at. Each demand captures only its requested
 *    method once; unused at/other-method probes would throw or change the
 *    independent observations. Replaced current callbacks retain receiver,
 *    literal progress and recovery after an owned callback exception.
 * 6. A native envelope rises over[2,4] and falls over[4,6], retaining
 *    literal quarter-profile values in arbitrary order. Fixed names survive
 *    edits to caller arrays; a foreign current envelope receives two fresh
 *    tuples per query so its retained mutations cannot poison the next call.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States action-local seconds, clamped shares and polynomial, native fixed-name lifetime versus current custom callbacks, inherited picosecond branch and six query/admission scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public Clock.prepare and Clock.prepareEnvelope on native Clock.of and full owned custom clocks, checks hand-derived uniform/progress values and boundaries, and observes required current custom callbacks/two instant lookups, receiver ownership, changing instants and first-demand missing-name refusal. Owned live method getters independently require one requested-method lookup per actual call without touching unrelated methods, and retain callback receiver/change/exception behavior.
 * @evidence contracts/development/testing.md#independent-expectations Mapping [2,6] to [0,1] gives (t-2)/4 and Flash-Hogan's polynomial gives the expected progress. The existing strict1e-12-second short-window branch defines exact/reversed/adjacent cases, without changing the rule or relying on ordinary clock output as an oracle. Current custom callbacks are looked up and invoked once per explicit requested method; the owned progress callback declares no linear/at dependency, so those extra probes are forbidden observable effects. Quarter progress53/512 and half progress1/2 are exact binary fractions. Native first-demand name admission avoids eager or unrelated public method observations. The[2,4]/[4,6] envelope is max(0,rise-fall), giving53/512 on the rising quarter and459/512 on the falling quarter. Original rise evaluation precedes fall-name admission, so nonfinite rise time refuses before an unused missing fall name. Foreign callback values0.25/0.75 and one requested-method read/call per query are owned public extension behavior, not sampled native counts.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers native before/inside/after intervals, out-of-order/repeated times, smooth/degenerate spans, strict short-span boundary, separate same-named clocks and first-demand native missing-name admission; custom callbacks retain receiver/effects/current names and defer their own refusal until queried. Native private lookup counts are deliberately not inferred through a wrapper that invalidates native identity; required custom lookups remain directly asserted. Native/foreign envelope cases additionally preserve fixed-name snapshots, rise-before-fall refusal, current callback replacement and fresh retained mutable input tuples across success/throw/recovery.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable unit owns clock callbacks and scalar inputs, invokes existing public preparation and starts no Human producer, host, renderer, compiler or foreign replacement.
 */
export function test_motion_prepared_clock_interval(): void {
  const clock: IAutoMovieMotionClock = C.of(8, [
    { name: "open", seconds: 2 }, { name: "close", seconds: 6 }, { name: "zero", seconds: 4 },
    { name: "short", seconds: 0.5e-12 }, { name: "boundary", seconds: 1e-12 },
  ]);
  const prepared: ReturnType<typeof C.prepare> = C.prepare(clock, "open", "close");
  for (const seconds of [5, 1, 6, 3, 4, 8, 2, 3]) {
    const share: number = Math.min(1, Math.max(0, (seconds - 2) / 4));
    const progress: number = 10 * share ** 3 - 15 * share ** 4 + 6 * share ** 5;
    TestValidator.predicate("actual interval reads follow independent clock laws",
      nclose(prepared.linear(seconds), share, 0) && nclose(prepared.progress(seconds), progress, 1e-12),
    );
  }
  for (const [from, to, before, at] of [
    ["zero", "zero", 3.99, 4], ["close", "open", 1.99, 2], ["start", "short", 0.25e-12, 0.5e-12],
  ] as const) {
    const step: ReturnType<typeof C.prepare> = C.prepare(clock, from, to);
    TestValidator.predicate("equal reversed and short spans keep their exact closing step",
      nclose(step.linear(before), 0, 0) && nclose(step.progress(before), 0, 0) &&
      nclose(step.linear(at), 1, 0) && nclose(step.progress(at), 1, 0),
    );
  }
  const boundary: ReturnType<typeof C.prepare> = C.prepare(clock, "start", "boundary");
  TestValidator.predicate("exact picosecond boundary stays in the linear branch",
    nclose(boundary.linear(0.5e-12), 0.5, 0) && nclose(boundary.progress(0.5e-12), 0.5, 1e-12),
  );
  const other: ReturnType<typeof C.prepare> = C.prepare(C.of(8, [
    { name: "open", seconds: 4 }, { name: "close", seconds: 8 },
  ]), "open", "close");
  TestValidator.predicate("same names on another clock keep their own interval",
    nclose(prepared.linear(4), 0.5, 0) && nclose(other.linear(4), 0, 0),
  );
  const nativeMissing: ReturnType<typeof C.prepare> = C.prepare(clock, "open", "missing");
  TestValidator.predicate("unknown native instant refuses at its first actual demanded query",
    throwsError((): number => nativeMissing.linear(0), "missing") && throwsError((): number => nativeMissing.progress(0), "missing"),
  );

  envelopes(clock);
  let reads: number = 0;
  let lines: number = 0;
  let progresses: number = 0;
  let offset: number = 0;
  const custom: IAutoMovieMotionClock = {
    duration: 8,
    get instants(): readonly IAutoMovieMotionClockInstant[] {
      return [{ name: "open", seconds: 2 + offset }, { name: "close", seconds: 6 + offset }];
    },
    at: (name: string): number => {
      reads++;
      if (name === "open") return 2 + offset;
      if (name === "close") return 6 + offset;
      if (name === "start") return 0;
      if (name === "end") return 8;
      throw new Error(`Unknown owned instant ${name}`);
    },
    linear(this: IAutoMovieMotionClock, from: string, to: string, seconds: number): number {
      lines++;
      TestValidator.predicate("custom linear keeps its actual receiver", this === custom);
      const a: number = this.at(from);
      const b: number = this.at(to);
      return b - a < 1e-12 ? (seconds >= b ? 1 : 0) : Math.min(1, Math.max(0, (seconds - a) / (b - a)));
    },
    progress(this: IAutoMovieMotionClock, from: string, to: string, seconds: number): number {
      progresses++;
      TestValidator.predicate("custom progress keeps its actual receiver", this === custom);
      const u: number = this.linear(from, to, seconds);
      return 10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5;
    },
    envelope(this: IAutoMovieMotionClock, rise: readonly [string, string], fall: readonly [string, string], seconds: number): number {
      return Math.max(0, this.progress(rise[0], rise[1], seconds) - this.progress(fall[0], fall[1], seconds));
    },
    events(this: IAutoMovieMotionClock): ReturnType<IAutoMovieMotionClock["events"]> {
      return this.instants.map((instant: IAutoMovieMotionClockInstant): ReturnType<IAutoMovieMotionClock["events"]>[number] =>
        ({ name: instant.name, share: instant.seconds / this.duration }));
    },
  };
  const live: ReturnType<typeof C.prepare> = C.prepare(custom, "open", "close");
  TestValidator.predicate("custom preparation does not execute inactive callbacks",
    reads === 0 && lines === 0 && progresses === 0,
  );
  TestValidator.predicate("one actual custom linear query retains exactly two required name lookups",
    nclose(live.linear(3), 0.25, 0) && reads === 2 && lines === 1 && progresses === 0,
  );
  offset = 1;
  TestValidator.predicate("custom progress reads its current interval and actual linear dependency",
    nclose(live.progress(3), 0, 0) && reads === 4 && lines === 2 && progresses === 1,
  );
  TestValidator.predicate("another current second cannot receive an earlier custom answer",
    nclose(live.linear(5), 0.5, 0) && reads === 6 && lines === 3,
  );
  getters();
  const missing: ReturnType<typeof C.prepare> = C.prepare(custom, "open", "missing");
  TestValidator.predicate("custom missing-name refusal remains at its original actual callback",
    throwsError((): number => missing.linear(0), "Unknown owned instant missing"),
  );
}

/** Own current callback getters without changing any factory-produced clock method. */
function getters(): void {
  const counts: { linear: number; progress: number; lines: number; progresses: number } = {
    linear: 0, progress: 0, lines: 0, progresses: 0,
  };
  let shifted: boolean = false;
  let fails: boolean = false;
  const sentinel: Error = new Error("owned current clock callback failure");
  const clock: IAutoMovieMotionClock = {
    duration: 8, instants: [{ name: "open", seconds: 2 }, { name: "close", seconds: 6 }],
    get at(): IAutoMovieMotionClock["at"] { throw new Error("this custom callback has no at dependency"); },
    get linear(): IAutoMovieMotionClock["linear"] {
      counts.linear++;
      const start: number = shifted ? 1 : 2;
      return function (this: IAutoMovieMotionClock, from: string, to: string, seconds: number): number {
        counts.lines++;
        TestValidator.predicate("the one captured current linear callback retains its receiver/names",
          this === clock && from === "open" && to === "close");
        return Math.min(1, Math.max(0, (seconds - start) / 4));
      };
    },
    get progress(): IAutoMovieMotionClock["progress"] {
      counts.progress++;
      const start: number = shifted ? 1 : 2;
      return function (this: IAutoMovieMotionClock, from: string, to: string, seconds: number): number {
        counts.progresses++;
        TestValidator.predicate("the one captured current progress callback retains its receiver/names",
          this === clock && from === "open" && to === "close");
        if (fails) throw sentinel;
        const u: number = Math.min(1, Math.max(0, (seconds - start) / 4));
        return 10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5;
      };
    },
    envelope(this: IAutoMovieMotionClock, rise: readonly [string, string], fall: readonly [string, string], seconds: number): number {
      return Math.max(0, this.progress(rise[0], rise[1], seconds) - this.progress(fall[0], fall[1], seconds));
    },
    events(this: IAutoMovieMotionClock): ReturnType<IAutoMovieMotionClock["events"]> {
      return this.instants.map((instant: IAutoMovieMotionClockInstant): ReturnType<IAutoMovieMotionClock["events"]>[number] =>
        ({ name: instant.name, share: instant.seconds / this.duration }));
    },
  };
  const prepared: ReturnType<typeof C.prepare> = C.prepare(clock, "open", "close");
  TestValidator.equals("construction never looks up an inactive custom method", counts,
    { linear: 0, progress: 0, lines: 0, progresses: 0 });
  TestValidator.predicate("current custom linear keeps its literal quarter share", nclose(prepared.linear(3), 0.25, 0));
  TestValidator.equals("one linear demand captures/calls only that declared callback", counts,
    { linear: 1, progress: 0, lines: 1, progresses: 0 });
  TestValidator.predicate("independent custom progress needs no public linear lookup", nclose(prepared.progress(3), 53 / 512, 0));
  TestValidator.equals("one progress demand captures/calls only its own callback", counts,
    { linear: 1, progress: 1, lines: 1, progresses: 1 });
  shifted = true;
  TestValidator.predicate("the next current getter supplies its own changed callback", nclose(prepared.linear(3), 0.5, 0));
  fails = true;
  let error: unknown = undefined;
  try { prepared.progress(3); } catch (actual) { error = actual; }
  TestValidator.predicate("the owned current progress exception propagates unchanged", error === sentinel);
  fails = false;
  TestValidator.predicate("a failed callback cannot poison the next current progress", nclose(prepared.progress(3), 0.5, 0));
  TestValidator.equals("each actual request resolves/calls its own method once, including throw/recovery", counts,
    { linear: 2, progress: 3, lines: 2, progresses: 3 });
}

/** Literal native envelope geometry and independent current foreign callback/array ownership. */
function envelopes(native: IAutoMovieMotionClock): void {
  const rise: [string, string] = ["open", "zero"];
  const fall: [string, string] = ["zero", "close"];
  const envelope: ReturnType<typeof C.prepareEnvelope> = C.prepareEnvelope(native, rise, fall);
  rise[0] = "edited caller rise";
  fall[1] = "edited caller fall";
  for (const [seconds, expected] of [[5, 0.5], [2.5, 53 / 512], [4, 1], [6, 0], [3, 0.5], [1, 0], [4.5, 459 / 512], [2, 0], [7, 0], [2.5, 53 / 512]] as const)
    TestValidator.predicate(`native envelope retains literal fixed-name progress at${seconds}`, nclose(envelope(seconds), expected, 0));
  const missing: ReturnType<typeof C.prepareEnvelope> = C.prepareEnvelope(native, ["open", "zero"], ["missing", "close"]);
  TestValidator.predicate("native rise evaluation precedes admission of an unused fall interval",
    throwsError((): number => missing(NaN), ["time", "finite"]) && throwsError((): number => missing(3), "missing"));

  let reads: number = 0;
  let calls: number = 0;
  let changed: boolean = false;
  let fails: boolean = false;
  const retained: { rise: readonly [string, string]; fall: readonly [string, string] }[] = [];
  const sentinel: Error = new Error("owned foreign envelope failure");
  const clock: IAutoMovieMotionClock = {
    duration: 8, instants: [],
    get at(): IAutoMovieMotionClock["at"] { throw new Error("foreign envelope has no at dependency"); },
    get linear(): IAutoMovieMotionClock["linear"] { throw new Error("foreign envelope has no linear dependency"); },
    get progress(): IAutoMovieMotionClock["progress"] { throw new Error("foreign envelope has no progress dependency"); },
    get envelope(): IAutoMovieMotionClock["envelope"] {
      reads++;
      const weight: number = changed ? 0.75 : 0.25;
      return function (this: IAutoMovieMotionClock, up: readonly [string, string], down: readonly [string, string], seconds: number): number {
        calls++;
        TestValidator.predicate("foreign envelope gets its original receiver, fixed names and actual current time",
          this === clock && up[0] === "open" && up[1] === "zero" && down[0] === "zero" && down[1] === "close" && nclose(seconds, 3, 0));
        TestValidator.predicate("each foreign envelope call owns fresh input tuples without repairing earlier mutation",
          retained.every((entry: { rise: readonly [string, string]; fall: readonly [string, string] }): boolean =>
            up !== entry.rise && down !== entry.fall && entry.rise[0] === "retained rise" && entry.fall[1] === "retained fall"));
        retained.push({ rise: up, fall: down });
        Object.defineProperty(up, "0", { value: "retained rise" });
        Object.defineProperty(down, "1", { value: "retained fall" });
        if (fails) throw sentinel;
        return weight;
      };
    },
    events: (): ReturnType<IAutoMovieMotionClock["events"]> => [],
  };
  const up: [string, string] = ["open", "zero"];
  const down: [string, string] = ["zero", "close"];
  const current: ReturnType<typeof C.prepareEnvelope> = C.prepareEnvelope(clock, up, down);
  up[0] = "caller rise after preparation";
  down[1] = "caller fall after preparation";
  TestValidator.predicate("foreign envelope construction neither looks up nor invokes an inactive callback", reads === 0 && calls === 0);
  TestValidator.predicate("the first actual foreign envelope returns its own literal weight", nclose(current(3), 0.25, 0));
  changed = true;
  TestValidator.predicate("same-time foreign envelope resolves its current replacement callback", nclose(current(3), 0.75, 0));
  fails = true;
  let error: unknown = undefined;
  try { current(3); } catch (actual) { error = actual; }
  TestValidator.predicate("the current foreign envelope exception propagates unchanged", error === sentinel);
  fails = false;
  TestValidator.predicate("failure publishes no envelope answer or tuple state into recovery", nclose(current(3), 0.75, 0));
  TestValidator.predicate("each actual foreign demand captures/calls only envelope and preserves caller-owned windows",
    reads === 4 && calls === 4 && up[0] === "caller rise after preparation" && down[1] === "caller fall after preparation");
}

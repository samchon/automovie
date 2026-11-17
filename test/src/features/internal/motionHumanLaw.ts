import type {
  AutoMovieHumanoidBone,
  IAutoMovieComposition,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanAudit,
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanAuditMotion as IAutoMovieMotionHumanAuditMotionType,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAudit,
  AutoMovieMotionHumanAuditMotion,
  HumanPerformance,
} from "@automovie/motions";

import { motionHumanFrame } from "./motionHumanFrame";

/**
 * Shared readers for action-law tests: build a trained performance, remember
 * its displayed frames, locate an event, measure adjacent-frame travel and
 * return complaints from a whole audit, one audit part, every audit part of
 * one film or a stated condition, whose label may be built only on failure.
 * Callers gather these complaints into their own assertions.
 *
 * Measures of one film share its actual FK frames, checked on first read for
 * nonempty bones, finite world positions and finite unit local and world
 * rotations. The film owns this memory; it does not replace the performance
 * or decide whether an action met its intent.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the eight helpers, the frame checks and the caller's ownership of assertions.
 * @evidence contracts/development/design.md#principled-representation Public performances and audit readers carry world metres and film seconds; frame admission checks finite coordinates and unit rotations before metrics read them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Eight helpers shared by solo, touch and hand-to-face specifications; body, FK, performance and audit types remain their package owners'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No action, body or scene gets a replacement pose or limit; the audit part is a closed choice and the frame record is the public FK map.
 * Builds and reads the public performance, converts event shares to seconds, measures Euclidean travel and delegates generic checks to their audit owner.
 * Eight small helpers separate construction, frame admission, event lookup, travel, audit formatting, partitioning, the union of the parts and complaint selection.
 * Invalid displayed frames and missing events throw; caller limits and measured values are neither repaired nor relaxed.
 * Local work scales with performer records, event counts, grid intervals and findings; delegated audits also include collider-pair work and continuity refinement, not just a frame scan.
 * Each film shares a successfully validated subject/second frame across its measures; planning and audit computations remain with the public owners.
 * A film retains one map per distinct subject/second read, without a capacity limit, until its reader is released; other helpers retain no process-wide state or external resource.
 */
export namespace motionHumanLaw {
  /**
   * A person's displayed bones, indexed by the actual canonical bone id.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the displayed frame and key.
   * @evidence contracts/development/design.md#principled-representation Keeps the public FK record with position and local/world rotations rather than a reduced proxy.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One alias for the map the public performance already returns.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No test bone or replacement coordinate is introduced.
   */
  export type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /**
   * An actual performance with per-film remembered displayed frames.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the film wraps and retains.
   * @evidence contracts/development/design.md#principled-representation Extends the public audit-motion reader and retains its actual performance for event and posture queries.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Adds only the owning performance to the existing duration/segments/bones reader.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Readers observe the public performance; this type provides no replacement producer or oracle pose.
   */
  export interface IFilm extends IAutoMovieMotionHumanAuditMotionType {
    /** The performance itself. */
    performance: IAutoMovieMotionHumanPerformance;
  }

  /**
   * A performance of people standing at their places, trained.
   *
   * @param seed The seed.
   * @param performers Each subject's body, floor point (the origin when absent) and heading (+Z when absent).
   * @param composition What they do.
   * @param props The props, none when absent.
   * @returns The film of the performance.
   * @throws {Error} When the public performance refuses its input or its film duration is invalid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the seed, cast defaults, trained proficiency, accepted composition forms and returned film.
   * @evidence contracts/development/implementation.md#principled-implementation Supplies the declared bodies and placements to HumanPerformance with trained proficiency, preserving the composition and props.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Map the cast, copy the props, unwrap a chain when given and pass the public performance to film.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses each supplied body and seed without a synthetic motion or a caught refusal; only absent placement and heading receive the documented defaults.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copies P performer records and Q prop references in O(P + Q); schedule and motion-planning costs belong to HumanPerformance and frames are read lazily.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses HumanPerformance's resolution and film's shared frame reader instead of another planner or per-metric performance.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned film owns the performance reference and its frame memory; temporary cast and prop arrays are handed to the public constructor, with no helper-global cache.
   */
  export function perform(
    seed: string,
    performers: readonly {
      subject: string;
      body: IAutoMovieMotionHumanBody;
      at?: IAutoMovieVector3;
      yaw?: number;
    }[],
    composition: IAutoMovieComposition | IAutoMovieMotionHumanChain,
    props: readonly IAutoMovieMotionHumanProp[] = [],
  ): IFilm {
    return film(
      new HumanPerformance({
        seed,
        performers: performers.map(
          (p: (typeof performers)[number]): IAutoMovieMotionHumanPerformer => ({
            subject: p.subject,
            body: p.body,
            at: p.at ?? { x: 0, y: 0, z: 0 },
            yaw: p.yaw ?? 0,
            proficiency: { level: "trained" as const },
          }),
        ),
        props: [...props],
        composition: "node" in composition ? composition.node : composition,
      }),
    );
  }

  /**
   * A performance as a film whose bones reader validates each actual
   * displayed frame before returning it and remembers successful reads.
   *
   * @param performance The performance.
   * @returns The film.
   * @throws {Error} When duration is nonfinite or negative, a queried second is nonfinite, or the displayed frame fails motionHumanFrame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the actual frame checks, exact query memory and failures; finite query seconds are forwarded without clamping here.
   * @evidence contracts/development/implementation.md#principled-implementation A metric requires finite world positions and unit orientations, so motionHumanFrame validates each nonempty public FK map before it is remembered; duration must be finite and nonnegative.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate duration once, forward segment queries and memoize each successful bones read by subject and second.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not normalize rotations, repair coordinates or replace missing data; failed reads are not cached, and the admission check does not claim physical correctness or every rig bone's presence.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each new subject/second costs public pose/FK evaluation plus an O(B) check of its B bones; subsequent reads use one map lookup with no repeated validation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the validated map for the same subject and numeric second within this film; consumers must keep the performance and returned maps unchanged while sharing them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure holds the performance and F distinct frame maps, with O(F times B) bone references and no eviction; releasing the film reader releases this helper's memory.
   */
  export function film(performance: IAutoMovieMotionHumanPerformance): IFilm {
    if (!Number.isFinite(performance.duration) || performance.duration < 0)
      throw new Error(`invalid film duration ${performance.duration}`);
    const known: Map<string, Bones> = new Map();
    return {
      performance,
      duration: performance.duration,
      segments: (
        subject: string,
      ): readonly IAutoMovieMotionHumanAuditMotionType.ISpan[] =>
        performance.segments(subject),
      bones: (subject: string, seconds: number): Bones => {
        if (!Number.isFinite(seconds))
          throw new Error(`${subject}: a nonfinite film second ${seconds}`);
        const key: string = `${subject}@${seconds}`;
        let bones: Bones | undefined = known.get(key);
        if (bones === undefined) {
          bones = performance.bones(subject, seconds);
          motionHumanFrame(bones, `${subject} at ${seconds} s`);
          known.set(key, bones);
        }
        return bones;
      },
    };
  }

  /**
   * The film second of a named event of a subject's first action that has it.
   *
   * @param film The film.
   * @param name The event.
   * @param subject The subject.
   * @returns Film seconds.
   * @throws {Error} When no action of the subject has the event.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the first matching action, default subject, seconds calculation and missing-event failure.
   * @evidence contracts/development/implementation.md#principled-implementation Converts the published event share using the matched plan's own start and duration, the same timebase the public performance uses.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Scan segments in order and find the named event in each, returning at the first match.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing events throw instead of becoming zero; lookup reads the plan's published events without inventing one or filtering it against a later cut.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the segments and their event records visited before the first match, with constant extra space.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads existing segment and event records directly; no pose is resolved or repeated subcomputation coordinated.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and retains no film or event.
   */
  export function event(
    film: IFilm,
    name: string,
    subject: string = "a",
  ): number {
    for (const segment of film.performance.segments(subject)) {
      const found: IAutoMovieMotionEvent | undefined = segment.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === name,
      );
      if (found !== undefined)
        return segment.start + found.share * segment.plan.duration;
    }
    throw new Error(`${subject} has no event ${name}`);
  }

  /**
   * The farthest a bone's joint centre travels between two neighbouring
   * instants of the grid, over the whole film.
   *
   * @param film The film.
   * @param subject The subject.
   * @param bone The bone.
   * @param rate Grid samples per second.
   * @returns Metres per grid interval, the start of the interval and the bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the grid, bone, displacement unit and reported interval; zero and second zero remain when no interval exceeds zero.
   * @evidence contracts/development/implementation.md#principled-implementation Euclidean distance between adjacent displayed joint centres measures displacement per grid interval, rather than speed or a plan's requested path.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Build the public audit grid once, read neighbouring endpoints and keep the first strict maximum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the requested bone's actual world position and unchanged grid; trusts the film's bone contract instead of supplying a missing joint or rescaling a displacement.
   * @evidence contracts/development/implementation.md#efficient-algorithms F grid instants require O(F) lookups and distance calculations plus any uncached frame evaluations; the endpoint array uses O(F) temporary space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The film remembers shared endpoints, so neighbouring intervals and other metrics reuse their validated frames.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Grid instants and the worst scalar record are local; only the returned measure survives, while frame ownership stays with the caller's film.
   */
  export function travel(
    film: IFilm,
    subject: string,
    bone: AutoMovieHumanoidBone,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditMeasure {
    const times: number[] = AutoMovieMotionHumanAuditMotion.grid(
      0,
      film.duration,
      rate,
    );
    const at: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 => film.bones(subject, t).get(bone)!.worldPosition;
    let worst: IAutoMovieMotionHumanAuditMeasure = {
      value: 0,
      seconds: 0,
      where: bone,
    };
    for (let i: number = 0; i + 1 < times.length; i++) {
      const a: IAutoMovieVector3 = at(times[i]!);
      const b: IAutoMovieVector3 = at(times[i + 1]!);
      const value: number = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
      if (value > worst.value)
        worst = { value, seconds: times[i]!, where: bone };
    }
    return worst;
  }

  /**
   * The generic audit of a subject, as complaints.
   *
   * @param film The film.
   * @param label What the complaints are prefixed with.
   * @param subject The subject.
   * @param body Their body.
   * @param options The audit's options.
   * @returns Empty when clean, otherwise one prefixed summary with at most four deepest pair examples.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the subject, body, options and aggregate complaint format, including the four-example bound.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates measurements and caller-selected limits to the public generic audit, then describes its findings without changing their values.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Run one audit, return empty when clean and otherwise format one summary with up to four pair examples.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Passes options unchanged and does not suppress a finding; the pair examples are bounded message context, while describe includes every finding.
   * @evidence contracts/development/implementation.md#efficient-algorithms Dominated by the delegated grid, bone, collider-pair and continuity-refinement work; this wrapper formats K findings and at most four pairs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Audit.run shares its own frame reads across checks, and an owning film can also share already validated frames across measures.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The report and formatting arrays are local to this call; only the returned summary array survives, with no added persistent frame cache.
   */
  export function audit(
    film: IAutoMovieMotionHumanAuditMotionType,
    label: string,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    options: IAutoMovieMotionHumanAudit.IOptions = {},
  ): string[] {
    const report: IAutoMovieMotionHumanAudit.IReport =
      AutoMovieMotionHumanAudit.run(film, subject, body, options);
    return report.findings.length === 0
      ? []
      : [
          `${label}: ${AutoMovieMotionHumanAudit.describe(report)}${
            report.pairs.length === 0
              ? ""
              : ` [${report.pairs
                  .slice(0, 4)
                  .map(
                    (
                      p: IAutoMovieMotionHumanAudit.IReport["pairs"][number],
                    ): string =>
                      `${p.a} in ${p.b} ${(p.depth * 1000).toFixed(1)} mm at ${p.seconds.toFixed(2)} s`,
                  )
                  .join(", ")}]`
          }`,
        ];
  }

  /**
   * A part of the generic audit: `tangle` reads the tangle over the whole
   * film, and `motion-1` to `motion-6` the audit's other checks (the ground,
   * the continuity and the balance) over one sixth of the film each.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the full-film tangle part and the six motion parts.
   * @evidence contracts/development/design.md#principled-representation A closed string choice separates whole-film tangle from numbered motion windows; their seconds are derived from the film rather than stored in the type.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The part selector of auditPart and auditParts, which the touch and hand-to-face readers use, without another audit configuration type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Excludes unsupported part names and indices at compile time; no body, law or precomputed result is encoded.
   */
  export type AuditPart = "tangle" | `motion-${1 | 2 | 3 | 4 | 5 | 6}`;

  /**
   * The six windows the split specifications use for non-tangle checks.
   *
   * States the shared partition count used by AuditPart and auditPart.
   */
  export const PARTS: number = 6;

  /**
   * One part of the generic audit of a subject, as complaints. The sixths
   * meet at frames of the 24 Hz grid and overlap by two frames, so an
   * interval, its two neighbours and an out-and-back across a meeting are
   * read whole in one of them; each is audited as a view of the film
   * shifted to its start.
   *
   * Finding seconds are relative to that view; the label states its film
   * start. The tangle part keeps only the default tangle limit; a motion
   * part keeps the other defaults and leaves tangle to its own part.
   *
   * @param film The film.
   * @param label What the complaints are prefixed with; a sixth adds its start.
   * @param subject The subject.
   * @param body Their body.
   * @param part The part.
   * @returns Empty when clean, otherwise one summary of the selected part.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two part modes, grid-aligned meetings, two-frame overlaps and view-relative finding times.
   * @evidence contracts/development/implementation.md#principled-implementation A translated time view preserves displayed bones and contact shares: bones read at from plus local seconds and segment clocks shift by minus from.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The tangle branch audits the whole film; the motion branch computes one overlapping window, builds its view and delegates to audit.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the selected checks' default limits unchanged, includes film endpoints through clamping and retains contact plan durations while shifting their placed spans.
   * @evidence contracts/development/implementation.md#efficient-algorithms Window arithmetic is constant work, each segment query copies S span records, and the selected audit's sampled geometry and continuity refinement dominate the remaining cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The view forwards to the source film's bones reader and the existing audit; it creates no second performance or replacement pose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The view closure and shifted span arrays live through this audit call; the caller retains the original film and its frame memory, and this wrapper retains only its returned complaints.
   */
  export function auditPart(
    film: IAutoMovieMotionHumanAuditMotionType,
    label: string,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    part: AuditPart,
  ): string[] {
    if (part === "tangle")
      return audit(film, label, subject, body, {
        limits: {
          tangle: AutoMovieMotionHumanAudit.LIMITS.tangle,
          floor: null,
          slip: null,
          lift: null,
          jump: null,
          reversal: null,
          speed: null,
          balance: null,
        },
      });
    const rate: number = 24;
    const sixth: number = Number(part.slice("motion-".length)) - 1;
    const meet: (k: number) => number = (k: number): number =>
      k <= 0
        ? 0
        : k >= PARTS
          ? film.duration
          : Math.round(((film.duration * k) / PARTS) * rate) / rate;
    const from: number = Math.max(0, meet(sixth) - (sixth > 0 ? 2 / rate : 0));
    const to: number = Math.min(
      film.duration,
      meet(sixth + 1) + (sixth < PARTS - 1 ? 2 / rate : 0),
    );
    const view: IAutoMovieMotionHumanAuditMotionType = {
      duration: to - from,
      bones: (who: string, seconds: number): Bones =>
        film.bones(who, from + seconds),
      segments: (who: string): IAutoMovieMotionHumanAuditMotionType.ISpan[] =>
        film.segments(who).map(
          (
            span: IAutoMovieMotionHumanAuditMotionType.ISpan,
          ): IAutoMovieMotionHumanAuditMotionType.ISpan => ({
            ...span,
            start: span.start - from,
            entryTime: span.entryTime - from,
            end: span.end - from,
          }),
        ),
    };
    return audit(view, `${label} ${from.toFixed(3)} s on`, subject, body, {
      limits: { tangle: null },
    });
  }

  /**
   * Every part of the generic audit of a subject, as complaints: the
   * `tangle` part and `motion-1` to `motion-6`, each read by
   * {@link auditPart} on the one film the caller holds, so a case that owes
   * the whole audit performs its film once and every part shares its
   * remembered frames.
   *
   * @param film The film.
   * @param label What the complaints are prefixed with; a sixth adds its start.
   * @param subject The subject.
   * @param body Their body.
   * @returns Every part's complaints, in the order tangle, then the sixths.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the seven parts read, their order and that they share the caller's film.
   * @evidence contracts/development/implementation.md#principled-implementation Reads exactly the parts AuditPart names, each through auditPart with its unchanged limits, windows and overlaps.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One traversal of the closed part list delegating to auditPart.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every part is read and none stops the others; no limit, window or finding is changed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Seven audits over one film; frames read at the same subject and second by two parts are resolved once through the film's memory.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The parts share the caller's film and its validated frame memory instead of each performing the case again.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned complaint list survives; frame memory stays with the caller's film.
   */
  export function auditParts(
    film: IAutoMovieMotionHumanAuditMotionType,
    label: string,
    subject: string,
    body: IAutoMovieMotionHumanBody,
  ): string[] {
    return AUDIT_PARTS.flatMap((part: AuditPart): string[] =>
      auditPart(film, label, subject, body, part),
    );
  }

  /** Every audit part, the tangle first and then the sixths in film order. */
  const AUDIT_PARTS: readonly AuditPart[] = [
    "tangle",
    "motion-1",
    "motion-2",
    "motion-3",
    "motion-4",
    "motion-5",
    "motion-6",
  ];

  /**
   * A complaint when a condition does not hold. The label may be given as a
   * function, so a label that resolves poses or formats numbers only to
   * describe a failure is built only when the condition fails.
   *
   * @param label What is expected, with its measured numbers, or what builds it.
   * @param holds Whether it holds.
   * @returns The label when it does not hold; empty when it does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the condition, the lazy label and the complaint returned on each branch.
   * @evidence contracts/development/implementation.md#principled-implementation Projects the caller's boolean into an empty complaint list or the supplied failure label; a label function runs only on the failing branch, so it cannot change the condition the caller computed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conditional returning an array of zero or one label.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not recalculate the condition, change its threshold or assert success on the caller's behalf.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work on success; a lazy label costs its own work only on failure.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A direct boolean projection has no repeated subcomputation to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the returned array is owned by the caller; the helper retains no label or resource.
   */
  export function expect(
    label: string | (() => string),
    holds: boolean,
  ): string[] {
    return holds ? [] : [typeof label === "string" ? label : label()];
  }
}

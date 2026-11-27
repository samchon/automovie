import type {
  IAutoMovieMotionHumanAudit,
  IAutoMovieMotionHumanAuditContact,
  IAutoMovieMotionHumanAuditMeasure,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAudit
} from "../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAudit";
import {
  AutoMovieMotionHumanAuditContact
} from "../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditContact";
import {
  AutoMovieMotionHumanAuditPartner
} from "../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditPartner";
import {
  AutoMovieMotionHumanAuditRange
} from "../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditRange";
import {
  AutoMovieMotionHumanAuditSpin
} from "../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditSpin";
import {
  AutoMovieMotionHumanAuditTiming
} from "../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditTiming";

import type { motionHumanLaw } from "./motionHumanLaw";
import type { motionHumanLawSweep } from "./motionHumanLawSweep";
import { motionHumanRepeat } from "./motionHumanRepeat";

/**
 * Perform and verify a staged sweep cell on its actual films. Timing, generic
 * motion, declared contact, range, spin and partner readings share the first
 * film. An optional repeat stages and performs independently, retaining the
 * existing finite-frame and position/orientation comparison.
 *
 * @param scene The actual first scene.
 * @param perform The caller's seed-bound real performance constructor.
 * @param airborne Whether this law omits the existing floor/support checks.
 * @param skin The existing partner-depth bound, metres.
 * @param say Receives subject-attributed findings in detector order.
 * @param repeat Builds the same-input second scene; absent for no repeat.
 * @returns The first film, including when measurements reported complaints.
 * @throws {Error} A construction, frame-validation or detector error; the cell
 *   caller attributes it.
 * @evidence contracts/development/common.md#meaningful-documentation States every detector, the real-film boundary, optional repeat and error propagation.
 * @evidence contracts/development/implementation.md#principled-implementation Reads the package audits at their unchanged limits, including 6 Hz range and the 5-degree spin bound. The repeat compares finite/unit displayed frames, membership, positions and sign-equivalent quaternion orientations at 4 Hz with motionHumanRepeat's existing 1e-9 bounds; this is a sampled comparison, not a continuous certificate.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One real film, per-person detectors, every unordered partner pair, then one optional independent repeat.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonfinite measures remain findings; the airborne exclusions and every arithmetic bound are the caller's existing contract, with no cell-specific adjustment.
 * @evidence contracts/development/implementation.md#efficient-algorithms Work is driven by requested frame resolutions and detector grids for each person, plus all unordered partner pairs; repeating requires another performance and its sampled bone comparison. The split removes no audit work and claims no speedup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All detectors read the same first film and its owning frame cache. The repeat uses newly staged inputs and shallowly distinct actual body records so a performance-identity cache cannot stand in for the second construction.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Adds no global cache or task. Film caches live with their films; the first film transfers to the caller and the repeated film is local to this read. Findings flow to the caller's complaint list without an added cap.
 */
export function motionHumanLawSweepCell(
  scene: motionHumanLawSweep.IScene,
  perform: (scene: motionHumanLawSweep.IScene) => motionHumanLaw.IFilm,
  airborne: boolean,
  skin: number,
  say: (subject: string, what: string) => void,
  repeat?: () => motionHumanLawSweep.IScene,
): motionHumanLaw.IFilm {
  const film: motionHumanLaw.IFilm = perform(scene);
  const measured: (
    subject: string,
    check: string,
    m: IAutoMovieMotionHumanAuditMeasure,
    limit: number,
  ) => void = (
    subject: string,
    check: string,
    m: IAutoMovieMotionHumanAuditMeasure,
    limit: number,
  ): void => {
    if (m.value > limit)
      say(
        subject,
        `${check} ${m.value.toFixed(4)} over ${limit} at ${m.seconds.toFixed(2)} s (${m.where})`,
      );
  };

  for (const one of scene.people) {
    const who: string = one.subject;
    for (const fault of AutoMovieMotionHumanAuditTiming.faults(
      film.performance.segments(who),
    ))
      say(who, `timing ${fault}`);
    const report: IAutoMovieMotionHumanAudit.IReport =
      AutoMovieMotionHumanAudit.run(film, who, one.body, {
        limits: airborne
          ? { floor: null, slip: null, lift: null, balance: null }
          : {},
      });
    for (const finding of report.findings)
      measured(who, finding.check, finding, finding.limit);
    if (!airborne) {
      const contact: IAutoMovieMotionHumanAuditContact.IResult =
        AutoMovieMotionHumanAuditContact.measure(film, who, one.body);
      for (const check of ["skate", "loose", "afloat"] as const)
        measured(
          who,
          check,
          contact[check],
          check === "afloat"
            ? AutoMovieMotionHumanAuditContact.HEIGHT
            : AutoMovieMotionHumanAuditContact.SPEED,
        );
    }
    measured(
      who,
      "range",
      AutoMovieMotionHumanAuditRange.measure(film.performance, who, 6)
        .overshoot,
      0.01,
    );
    measured(
      who,
      "turn",
      AutoMovieMotionHumanAuditSpin.measure(film, who).turn,
      5,
    );
  }
  for (let i: number = 0; i < scene.people.length; i++)
    for (let j: number = i + 1; j < scene.people.length; j++)
      measured(
        `${scene.people[i]!.subject}+${scene.people[j]!.subject}`,
        "partner",
        AutoMovieMotionHumanAuditPartner.measure(
          film,
          scene.people[i]!,
          scene.people[j]!,
        ).worst,
        skin,
      );

  if (repeat !== undefined) {
    const repeated: motionHumanLawSweep.IScene = repeat();
    const again: motionHumanLaw.IFilm = perform({
      ...repeated,
      people: repeated.people.map(
        (one: motionHumanLawSweep.IPerson): motionHumanLawSweep.IPerson => ({
          ...one,
          body: { ...one.body },
        }),
      ),
    });
    for (const one of scene.people)
      for (const complaint of motionHumanRepeat(film, again, one.subject, 4))
        say(one.subject, `determinism ${complaint}`);
  }
  return film;
}

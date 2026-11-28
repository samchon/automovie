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
 * Perform a staged sweep cell and report timing, motion, contact, range, spin
 * and partner findings. When requested, stage a second film for comparison
 * against the first.
 *
 * @param scene People and props for the first film.
 * @param perform Seed-bound performance constructor supplied by the caller.
 * @param airborne Omits floor, slip, lift and balance limits and contact measures.
 * @param skin Maximum partner depth in metres.
 * @param say Receives findings with their subject in detector order.
 * @param repeat Builds the second scene for a sampled comparison.
 * @returns The first film, even when its measurements report findings.
 * @throws If construction, frame reading or a detector fails.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the first film, each detector group, the airborne exclusions, the partner-depth unit and optional second film.
 * @evidence contracts/development/implementation.md#principled-implementation Applies the package auditors to the actual performance. Range overshoot is measured at 6 Hz against 0.01, spin at the configured audit resolution against 5 degrees, and the optional second film compares sampled bone positions and orientations at 4 Hz.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reuses one film and its owning caches across each person's detectors. Only distinct unordered partner pairs require pairwise work. The optional repeat constructs a separate film, scoped to the call, and findings flow to the caller.
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

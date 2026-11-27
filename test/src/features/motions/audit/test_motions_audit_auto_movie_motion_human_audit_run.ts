import type {
  IAutoMovieMotionHumanAudit,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAudit
} from "../../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAudit";
import { TestValidator } from "@nestia/e2e";

import { auditStanceMotion } from "../../internal/auditStanceMotion";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/** Rounding of a few sums, metres. */
const ROUNDING: number = 1e-9;

/** How far the planted body slides over the take, metres. */
const SLIDE: number = 0.1;

/**
 * `AutoMovieMotionHumanAudit.run` reads every generic check of one person on
 * one shared grid and reports each reading above its limit as a finding; a
 * `null` limit leaves its check unread.
 *
 * Scenarios, the average man's quiet stance for 1 s, both feet planted, read at
 * 4 Hz:
 *
 * 1. Held still, it is clean: every check read, no finding.
 * 2. Sliding 0.1 m along +X over the second, it slips 0.1 m, past the 5 mm limit:
 *    one `slip` finding with that limit, the rest clean.
 * 3. With the slip's limit `null`, the slip is not read and nothing is found.
 *
 * The body is built whole (`humanFixtureBody`): the checks read its colliders,
 * soles, tangle model and mass model on the displayed bones.
 */
export async function test_motions_audit_auto_movie_motion_human_audit_run(): Promise<void> {
  // Runs every generic check: every collider, the tangle model, the soles and the mass model, a whole-body read.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const still: IAutoMovieMotionHumanAudit.IReport =
    AutoMovieMotionHumanAudit.run(
      auditStanceMotion(body, { contacts: auditStanceMotion.plants() }),
      "a",
      body,
      { rate: 4 },
    );
  TestValidator.predicate(
    "still",
    still.findings.length === 0 &&
      AutoMovieMotionHumanAudit.CHECKS.every(
        (check: IAutoMovieMotionHumanAudit.Check): boolean =>
          still.measures[check] !== undefined,
      ),
  );
  const sliding: IAutoMovieMotionHumanAuditMotion = auditStanceMotion(body, {
    contacts: auditStanceMotion.plants(),
    shift: (t: number) => ({ x: SLIDE * t, y: 0, z: 0 }),
  });
  const slid: IAutoMovieMotionHumanAudit.IReport =
    AutoMovieMotionHumanAudit.run(sliding, "a", body, { rate: 4 });
  TestValidator.predicate(
    "sliding",
    slid.findings.length === 1 &&
      slid.findings[0]!.check === "slip" &&
      slid.findings[0]!.limit === AutoMovieMotionHumanAudit.LIMITS.slip &&
      nclose(slid.findings[0]!.value, SLIDE, ROUNDING),
  );
  const unread: IAutoMovieMotionHumanAudit.IReport =
    AutoMovieMotionHumanAudit.run(sliding, "a", body, {
      rate: 4,
      limits: { slip: null },
    });
  TestValidator.predicate(
    "unread",
    unread.findings.length === 0 && unread.measures.slip === undefined,
  );
}

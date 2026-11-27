import type {
  IAutoMovieAssessRenderBudgetProps,
  IAutoMovieRenderBudget,
  IAutoMovieRenderBudgetAssessment,
  IAutoMovieRenderBudgetEvidence,
  IAutoMovieRenderBudgetEvidenceProps,
  IAutoMovieRenderObservationAuditRequest,
  IAutoMovieRenderObservationAudit,
  IAutoMovieRenderGraphicsIdentity,
  IAutoMovieRenderTargetRenderer,
  IAutoMovieRenderTargetSettings,
  IAutoMovieRenderTargetSettingsOfShotProps,
} from "@automovie/interface";

import {
  auditAutoMovieRenderObservation,
} from "./internal/auditAutoMovieRenderObservation.js";
import {
  assessAutoMovieRenderBudget,
} from "./internal/assessAutoMovieRenderBudget.js";
import {
  autoMovieRenderBudgetEvidence,
} from "./internal/autoMovieRenderBudgetEvidence.js";
import {
  autoMovieRenderBudgetRefusal,
} from "./internal/autoMovieRenderBudgetRefusal.js";
import {
  autoMovieRenderTargetRendererOfGraphics,
} from "./internal/autoMovieRenderTargetRendererOfGraphics.js";
import {
  autoMovieRenderTargetSettingsOfShot,
} from "./internal/autoMovieRenderTargetSettingsOfShot.js";
import {
  selectAutoMovieRenderBudget,
} from "./internal/selectAutoMovieRenderBudget.js";

/** Projects caller-supplied inputs into Render budget preflight results. */
export class AutoMovieRenderBudgetPreflight {
  private constructor() {}

  /** Compare the report cleared for capture with the scene actually observed. */
  public static auditObservation(
    props: IAutoMovieRenderObservationAuditRequest,
  ): IAutoMovieRenderObservationAudit {
    return auditAutoMovieRenderObservation(props);
  }

  /**
   * Convert an optional graphics probe into a target renderer identity. A
   * missing probe returns `null`; blank answered fields become `unknown`.
   *
   * @param graphics The capture host's graphics probe, if available.
   * @returns The target renderer identity or `null` when no probe ran.
   */
  public static targetRendererOfGraphics(
    graphics: IAutoMovieRenderGraphicsIdentity | null | undefined,
  ): IAutoMovieRenderTargetRenderer | null {
    return autoMovieRenderTargetRendererOfGraphics(graphics);
  }

  /**
   * Project a compiled shot's intended renderer settings. Its scene
   * environment supplies tone mapping, exposure and shadow policy; absent an
   * environment, delivery tone mapping, exposure one and disabled shadows are
   * used.
   *
   * @param props The shot and caller-supplied target dimensions and delivery.
   * @returns The projected render-target settings.
   */
  public static targetSettingsOfShot(
    props: IAutoMovieRenderTargetSettingsOfShotProps,
  ): IAutoMovieRenderTargetSettings {
    return autoMovieRenderTargetSettingsOfShot(props);
  }

  /**
   * Select the first declared budget for a tier. Missing declarations return
   * `null`; duplicate tiers are not validated.
   *
   * @param budgets The production's declared render budgets.
   * @param tier The tier being rendered.
   * @returns The first matching budget or `null` when none is declared.
   */
  public static selectBudget(
    budgets: readonly IAutoMovieRenderBudget[] | undefined,
    tier: string,
  ): IAutoMovieRenderBudget | null {
    return selectAutoMovieRenderBudget(budgets, tier);
  }

  /**
   * Measure one supplied compiled shot against its budget and supplied target
   * observations. No draw, capture-host acquisition or texture allocation is
   * performed; a missing renderer returns `not-run`.
   *
   * @param props The shot, budget, renderer, settings, assets and observations.
   * @returns The shot's assessment, report, inventory, mask and sealed target.
   */
  public static assessBudget(
    props: IAutoMovieAssessRenderBudgetProps,
  ): IAutoMovieRenderBudgetAssessment {
    return assessAutoMovieRenderBudget(props);
  }

  /**
   * Fold supplied assessments into a deterministic tier evidence value. The
   * assessments must already target the selected tier's declared budget.
   *
   * @param props The tier, declared budgets and one assessment per shot.
   * @returns The sorted evidence aggregate and its content digest.
   */
  public static budgetEvidence(
    props: IAutoMovieRenderBudgetEvidenceProps,
  ): IAutoMovieRenderBudgetEvidence {
    return autoMovieRenderBudgetEvidence(props);
  }

  /**
   * Format over-budget or unknown texture-storage findings as a diagnostic.
   * It raises no job refusal and does not verify report provenance.
   *
   * @param evidence The caller-supplied budget evidence.
   * @returns The diagnostic, or `null` when neither condition is recorded.
   */
  public static budgetRefusal(
    evidence: IAutoMovieRenderBudgetEvidence,
  ): string | null {
    return autoMovieRenderBudgetRefusal(evidence);
  }
}

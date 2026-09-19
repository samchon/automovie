import { AutoMovieGuidePass } from "../../cinematics/AutoMovieGuidePass";
import { IAutoMovieProductionMediaProbe } from "../IAutoMovieProductionMediaProbe";
import { AutoMovieContentDigest } from "../AutoMovieContentDigest";
import { AutoMovieRepaintReferenceRole } from "./AutoMovieRepaintReferenceRole";
import { IAutoMovieRepaintExecutionPolicy } from "./IAutoMovieRepaintExecutionPolicy";
import { IAutoMovieRepaintGeneratorProvenance } from "./IAutoMovieRepaintGeneratorProvenance";
import { IAutoMovieRepaintParameters } from "./IAutoMovieRepaintParameters";
import { IAutoMovieRepaintRequestEvidence } from "./IAutoMovieRepaintRequestEvidence";

/**
 * Immutable provenance for one accepted repaint rendition.
 *
 * @evidence requirements/repaint/scope-and-user-choice.md#repaint-independent-artifact Exposes `IAutoMovieRepaintReceipt` as the portable data boundary for the repaint independent artifact requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-output-provenance Types `IAutoMovieRepaintReceipt` for the asset spec repaint output provenance system contract.
 */
export interface IAutoMovieRepaintReceipt {
  /**
   * Receipt format.
   *
   * @evidence requirements/repaint/scope-and-user-choice.md#repaint-independent-artifact Exposes `version` as the portable data boundary for the repaint independent artifact requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-output-provenance Types `version` for the asset spec repaint output provenance system contract.
   */
  version: 3 | 4;

  /**
   * Owning production namespace.
   *
   * @evidence requirements/repaint/scope-and-user-choice.md#repaint-independent-artifact Exposes `productionId` as the portable data boundary for the repaint independent artifact requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-output-provenance Types `productionId` for the asset spec repaint output provenance system contract.
   */
  productionId: string;

  /**
   * Exact compiled shot id.
   *
   * @evidence requirements/repaint/scope-and-user-choice.md#repaint-independent-artifact Exposes `shot` as the portable data boundary for the repaint independent artifact requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-output-provenance Types `shot` for the asset spec repaint output provenance system contract.
   */
  shot: string;

  /**
   * Current builder registry fingerprint.
   *
   * @evidence requirements/repaint/scope-and-user-choice.md#repaint-independent-artifact Exposes `compileFingerprint` as the portable data boundary for the repaint independent artifact requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-output-provenance Types `compileFingerprint` for the asset spec repaint output provenance system contract.
   */
  compileFingerprint: AutoMovieContentDigest;

  /**
   * Digest over deterministic source manifest and frame bytes.
   *
   * @evidence requirements/repaint/scope-and-user-choice.md#repaint-independent-artifact Exposes `sourceRenderFingerprint` as the portable data boundary for the repaint independent artifact requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-output-provenance Types `sourceRenderFingerprint` for the asset spec repaint output provenance system contract.
   */
  sourceRenderFingerprint: AutoMovieContentDigest;

  /**
   * Immutable identity shared by the transport attempts of one request.
   *
   * @evidence requirements/repaint/retries-seeds-and-variation.md#repaint-retry-request-boundary Separates a request from the attempts that retry it.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-attempt-selection Carries the stable request side of request/attempt identity.
   */
  requestId?: string;

  /**
   * Host-generated identity of this repaint invocation.
   *
   * @evidence requirements/repaint/scope-and-user-choice.md#repaint-independent-artifact Exposes `attemptId` as the portable data boundary for the repaint independent artifact requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-output-provenance Types `attemptId` for the asset spec repaint output provenance system contract.
   */
  attemptId: string;

  /** UTC instant captured immediately before this provider call. */
  startedAt?: string;

  /** UTC instant captured when the validated candidate completed. */
  completedAt?: string;

  /** Metered cost charged to this successful attempt. */
  costUnits?: number;

  /** Complete bounded policy under which the request executed. */
  executionPolicy?: IAutoMovieRepaintExecutionPolicy;

  /**
   * Content-addressed deterministic source bundle.
   *
   * @evidence requirements/repaint/scope-and-user-choice.md#repaint-independent-artifact Exposes `sourceBundle` as the portable data boundary for the repaint independent artifact requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-output-provenance Types `sourceBundle` for the asset spec repaint output provenance system contract.
   */
  sourceBundle: string;

  /**
   * Structural passes supplied to the adapter.
   *
   * @evidence requirements/repaint/scope-and-user-choice.md#repaint-independent-artifact Exposes `controls` as the portable data boundary for the repaint independent artifact requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-output-provenance Types `controls` for the asset spec repaint output provenance system contract.
   */
  controls: Array<{
    /** Structural pass name. */
    pass: Exclude<AutoMovieGuidePass, "beauty">;

    /** Ordered source-frame digests for this pass. */
    frameDigests: AutoMovieContentDigest[];
  }>;

  /**
   * Fixed reference identities supplied to the adapter.
   *
   * @evidence requirements/repaint/scope-and-user-choice.md#repaint-independent-artifact Exposes `references` as the portable data boundary for the repaint independent artifact requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-output-provenance Types `references` for the asset spec repaint output provenance system contract.
   */
  references: Array<{
    /** Exact non-collapsible reference role. */
    role: AutoMovieRepaintReferenceRole;

    /** Project-relative manifest path. */
    path: string;

    /** Current byte digest. */
    digest: AutoMovieContentDigest;
  }>;

  /**
   * Canonical structured adapter/model identity.
   *
   * @evidence requirements/repaint/scope-and-user-choice.md#repaint-independent-artifact Exposes `adapterIdentity` as the portable data boundary for the repaint independent artifact requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-output-provenance Types `adapterIdentity` for the asset spec repaint output provenance system contract.
   */
  adapterIdentity: string;

  /**
   * Reviewed generator adoption retained with the exact rendition bytes.
   *
   * @evidence requirements/repaint/identity-and-provenance.md#repaint-provenance-refusal Makes missing generator terms and adoption provenance a malformed output identity.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-output-provenance Carries the selected generator's rights, terms, cost, and consumer into the immutable receipt.
   */
  generatorProvenance: IAutoMovieRepaintGeneratorProvenance;

  /**
   * Authority boundary of the derived appearance.
   *
   * The rendition may be the audience-visible delivery, but it never becomes
   * geometry, motion, contact, camera, timing, or prototype-fidelity truth.
   *
   * @evidence requirements/production-design/visual-delivery-and-fidelity-tiers.md#production-design-repaint-boundary Keeps the deterministic blocking pass authoritative for structure.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-eligibility-source-lock Marks the output as a derived appearance rather than a replacement source.
   */
  structuralAuthority: "deterministic-source-only";

  /**
   * Exact generation parameters.
   *
   * @evidence requirements/repaint/scope-and-user-choice.md#repaint-independent-artifact Exposes `parameters` as the portable data boundary for the repaint independent artifact requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-output-provenance Types `parameters` for the asset spec repaint output provenance system contract.
   */
  parameters: IAutoMovieRepaintParameters;

  /** Stable evidence addresses from which this immutable request was formed. */
  evidence?: IAutoMovieRepaintRequestEvidence;

  /**
   * Verified rendition output.
   *
   * @evidence requirements/repaint/scope-and-user-choice.md#repaint-independent-artifact Exposes `output` as the portable data boundary for the repaint independent artifact requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-output-provenance Types `output` for the asset spec repaint output provenance system contract.
   */
  output: {
    /** Render-root-relative content-addressed path. */
    path: string;

    /** Exact output bytes digest. */
    digest: AutoMovieContentDigest;

    /** Exact output byte length. */
    bytes: number;

    /** Parsed media facts. */
    probe: IAutoMovieProductionMediaProbe;
  };
}

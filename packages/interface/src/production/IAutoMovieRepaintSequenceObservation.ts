import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { AutoMovieRepaintObservationVerdict } from "./AutoMovieRepaintObservationVerdict";
import { IAutoMovieRepaintObservationMember } from "./IAutoMovieRepaintObservationMember";

/**
 * Versioned aggregate observation over one exact current visual member set.
 * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-continuity-baseline-changes Binds compile, timeline, baseline, active set, playback, and verdicts.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-structure-continuity Supplies the complete parser-verifiable sequence receipt.
 */
export interface IAutoMovieRepaintSequenceObservation {
  /** Closed observation protocol version; any other value is a malformed receipt. */
  version: 1;

  /** Production namespace whose current visual member set was observed together. */
  productionId: string;

  /** Compile fingerprint the observation was performed against; a later compile stales it. */
  compileFingerprint: AutoMovieContentDigest;

  /** Film timeline fingerprint the ordered member set was read from. */
  timelineFingerprint: AutoMovieContentDigest;

  /**
   * Continuity baseline the observation judged drift against.
   *
   * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-continuity-baseline-changes Binds the observation to one explicit baseline address, version, scope, and intended-delta list.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-structure-continuity Makes an intentional change distinguishable from drift by naming it before observation.
   */
  baseline: {
    /** Stable address of the baseline artifact the members were compared against. */
    address: string;

    /** Exact baseline revision identity. */
    version: string;

    /** Continuity aspects the baseline governs, in declared order. */
    scope: string[];

    /** Unique intentional deviations from the baseline that must not count as drift. */
    intendedDeltas: string[];
  };

  /** Complete ordered occurrence members observed together, lane by lane. */
  members: IAutoMovieRepaintObservationMember[];

  /** Digest of the canonical ordered member population, recomputed on every read. */
  memberSetDigest: AutoMovieContentDigest;

  /** Observed playback artifact and the exact bytes the verdicts were read from. */
  artifact: {
    /** Render-root-relative path of the observed artifact. */
    path: string;

    /** Digest of the observed artifact bytes at observation time. */
    digest: AutoMovieContentDigest;
  };

  /** Playback runtime and presentation context the sequence was observed under. */
  playback: {
    /** Exact playback runtime identity. */
    runtime: string;

    /** Exact presentation context identity. */
    context: string;
  };

  /**
   * Whether the aggregate observation ran to completion.
   * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-temporal-artifacts Keeps failed, unperformed, and unsupported observation distinct from a passing one.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-structure-continuity Gates publication on a completed observation rather than on the absence of failures.
   */
  status: "completed" | "failed" | "not-run" | "unsupported";

  /**
   * Independent verdict per temporal review axis.
   * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-temporal-artifacts Records flicker, identity drift, geometry warp, texture crawl, and transition mismatch as separate truths.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-structure-continuity Requires every axis to pass before the member set is publishable.
   */
  verdicts: {
    /** Frame-to-frame luminance or color flicker across the member sequence. */
    flicker: AutoMovieRepaintObservationVerdict;

    /** Loss of subject identity between consecutive members. */
    identityDrift: AutoMovieRepaintObservationVerdict;

    /** Structural geometry warping across consecutive members. */
    geometryWarp: AutoMovieRepaintObservationVerdict;

    /** Surface texture crawling or swimming across consecutive members. */
    textureCrawl: AutoMovieRepaintObservationVerdict;

    /** Mismatch at a cut or transition between adjacent members. */
    transitionMismatch: AutoMovieRepaintObservationVerdict;
  };
}

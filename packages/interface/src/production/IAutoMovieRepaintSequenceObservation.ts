import { AutoMovieRepaintObservationVerdict } from "./AutoMovieRepaintObservationVerdict";
import { IAutoMovieRepaintObservationMember } from "./IAutoMovieRepaintObservationMember";

/**
 * Versioned aggregate playback observation over one exact current ordered visual member set.
 *
 * @evidence contracts/common.md#principled-implementation Sequence admission compares production, compile, timeline, caller-supplied baseline, canonical member population and artifact digest, then requires completed status and passing stored verdicts on every temporal axis. Final delivery currently passes this record's own baseline as the expected baseline rather than resolving an independent current baseline.
 * @evidence contracts/common.md#clear-and-simple-design Separates observation basis and playback artifact from the five review verdicts, retaining intentional baseline deltas instead of treating every visible difference as drift.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current ordered membership and artifact bytes must match; stale selected receipts, incomplete playback or any non-pass axis refuse. Stored verdicts are external assertions, not fresh playback, and final delivery does not independently establish baseline currency.
 * @evidence contracts/common.md#meaningful-documentation Defines current basis, baseline scope and intended deltas, ordered lane population, observed artifact identity, playback context and independent completion and verdict fields.
 * @author Samchon
 */
export interface IAutoMovieRepaintSequenceObservation {
  /** Closed observation protocol version; any other value is a malformed receipt. */
  version: 1;

  /** Production namespace whose current visual member set was observed together. */
  productionId: string;

  /** Compile fingerprint the observation was performed against; a later compile stales it. */
  compileFingerprint: string;

  /** Film timeline fingerprint the ordered member set was read from. */
  timelineFingerprint: string;

  /** Continuity baseline the observation judged drift against. */
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
  memberSetDigest: string;

  /** Observed playback artifact and the exact bytes the verdicts were read from. */
  artifact: {
    /** Render-root-relative path of the observed artifact. */
    path: string;

    /** Digest of the observed artifact bytes at observation time. */
    digest: string;
  };

  /** Playback runtime and presentation context the sequence was observed under. */
  playback: {
    /** Exact playback runtime identity. */
    runtime: string;

    /** Exact presentation context identity. */
    context: string;
  };

  /** Whether the aggregate observation ran to completion. */
  status: "completed" | "failed" | "not-run" | "unsupported";

  /** Independent verdict per temporal review axis. */
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

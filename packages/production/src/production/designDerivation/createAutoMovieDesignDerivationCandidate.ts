import { canonicalAutoMovieJsonBytes, digestAutoMovieBytes } from "../contentIdentity";
import { AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL } from "./AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL";
import type { IAutoMovieDesignDerivationBasis } from "./IAutoMovieDesignDerivationBasis";
import type { IAutoMovieDesignDerivationRecord } from "./IAutoMovieDesignDerivationRecord";
import type { IAutoMovieDesignDerivationManifest } from "./IAutoMovieDesignDerivationManifest";
import { AutoMovieDesignDerivationError } from "./AutoMovieDesignDerivationError";
import { autoMovieDesignDerivationBasisDigest } from "./autoMovieDesignDerivationBasisDigest";
import { canonicalBases } from "./canonicalBases";
import { canonicalOutputs } from "./canonicalOutputs";
import { outputMismatch } from "./outputMismatch";
import { errorMessage } from "./errorMessage";

/**
 * Observe two equal evaluations and current metadata before returning staged output bytes.
 *
 * @evidence contracts/common.md#principled-implementation Canonicalizes supplied bases, passes separate structured clones to two evaluations, compares complete canonical output bytes and reacquires live basis metadata before target/path matching.
 * @evidence contracts/common.md#clear-and-simple-design Candidate staging has no store callback; canonical sorting and mismatch checks share their dedicated helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cloned basis arguments do not sandbox callback effects or freeze its captured environment. Two equal observations are not proof of every future execution, and this API currently has no maintained production runtime host.
 * @evidence contracts/common.md#meaningful-documentation Documents callback trust, actual clone/current-basis checks, staged output ownership and missing product-host wiring; the legacy diagnostic's frozen-basis wording does not establish runtime freezing.
 * @evidence contracts/performance.md#efficient-algorithms Two callback evaluations and byte copies/JSON comparisons dominate; basis/output sorting adds comparison costs, and both output populations coexist before selection.
 * @evidence contracts/performance.md#reuse-equivalent-work No candidate cache exists; both evaluations intentionally run and live metadata is reacquired after them rather than reusing the initial observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one manifest and a path-to-byte Map; temporary second output/serialized comparisons retire with the call, while callbacks own any external effects.
 */
export function createAutoMovieDesignDerivationCandidate(props: {
  /** Declared target/path/source metadata canonicalized before both observations. */
  bases: readonly IAutoMovieDesignDerivationBasis[];

  /** Called with independent structured clones; captured environment and effects remain caller-owned. */
  evaluate: (bases: readonly IAutoMovieDesignDerivationBasis[]) => readonly {
    target: string;
    recordPath: string;
    bytes: Uint8Array;
  }[];

  /** Reacquire current declared metadata after both evaluations; failures become basis-change refusals. */
  currentBases: () => readonly IAutoMovieDesignDerivationBasis[];
}): {
  manifest: IAutoMovieDesignDerivationManifest;
  outputs: ReadonlyMap<string, Uint8Array>;
} {
  const bases: readonly IAutoMovieDesignDerivationBasis[] = canonicalBases(props.bases);
  const first: readonly { target: string; recordPath: string; bytes: Uint8Array }[] = canonicalOutputs(props.evaluate(structuredClone(bases)));
  const second: readonly { target: string; recordPath: string; bytes: Uint8Array }[] = canonicalOutputs(props.evaluate(structuredClone(bases)));
  const mismatch: string | null = outputMismatch(first, second);
  if (mismatch !== null)
    throw new AutoMovieDesignDerivationError(
      "design-derivation-nondeterministic",
      `Design target ${mismatch} produced different canonical bytes from the same frozen basis. No design record was published.`,
    );
  let live: readonly IAutoMovieDesignDerivationBasis[];
  try {
    live = canonicalBases(props.currentBases());
  } catch (error) {
    throw new AutoMovieDesignDerivationError(
      "design-derivation-basis-changed",
      `The live design producer closure became invalid during generation (${errorMessage(error)}). Run the explicit design command again.`,
    );
  }
  if (
    Buffer.from(canonicalAutoMovieJsonBytes(bases)).equals(
      Buffer.from(canonicalAutoMovieJsonBytes(live)),
    ) === false
  )
    throw new AutoMovieDesignDerivationError(
      "design-derivation-basis-changed",
      "Design emitter, target mapping, transitive source, or tool identity changed during generation. Run the explicit design command again.",
    );
  if (bases.length !== first.length)
    throw new AutoMovieDesignDerivationError(
      "design-derivation-nondeterministic",
      "The evaluated design target set does not match the declared producer-basis target set. No design record was published.",
    );
  const basisByTarget: Map<string, IAutoMovieDesignDerivationBasis> = new Map(bases.map((basis: IAutoMovieDesignDerivationBasis): [string, IAutoMovieDesignDerivationBasis] => [basis.target, basis]));
  const records: IAutoMovieDesignDerivationRecord[] = first.map((output: { target: string; recordPath: string; bytes: Uint8Array }): IAutoMovieDesignDerivationRecord => {
    const basis: IAutoMovieDesignDerivationBasis | undefined = basisByTarget.get(output.target);
    if (basis === undefined || basis.recordPath !== output.recordPath)
      throw new AutoMovieDesignDerivationError(
        "design-derivation-nondeterministic",
        `Design target "${output.target}" has no exact declared record-path mapping. No design record was published.`,
      );
    return {
      target: output.target,
      recordPath: output.recordPath,
      basis,
      basisDigest: autoMovieDesignDerivationBasisDigest(basis),
      outputDigest: digestAutoMovieBytes(output.bytes),
    };
  });
  return {
    manifest: {
      version: 1,
      protocol: AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL,
      records,
    },
    outputs: new Map(first.map((output: { target: string; recordPath: string; bytes: Uint8Array }): [string, Uint8Array] => [output.recordPath, output.bytes])),
  };
}

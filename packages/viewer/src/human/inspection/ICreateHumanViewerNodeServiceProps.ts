/**
 * Host source and loopback bindings for its isolated numerical sessions.
 *
 * @evidence contracts/common.md#principled-implementation The isolated numerical service receives its actual maintained entry directory and live source-byte witnesses.
 * @evidence contracts/common.md#clear-and-simple-design Loopback origin, entry location and source readers are the complete host boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source witnesses identify the actual checked entry and inputs rather than a browser transformation receipt.
 * @evidence contracts/common.md#meaningful-documentation Revision and input membership are reread, while directory names the maintained Node entry owner.
 *
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure The isolated numerical service receives its actual maintained entry directory and live source-byte witnesses.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Source witnesses identify the actual checked entry and inputs rather than a browser transformation receipt.
 * @author Samchon
 */
export interface ICreateHumanViewerNodeServiceProps {
  /**
   * Origin of this resident viewer's unchanged digest-checked data routes.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Names the verified loopback basis/data provider consumed by the owned numerical realm.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Names the verified loopback basis/data provider consumed by the owned numerical realm.
   */
  origin: string;

  /**
   * Directory containing the maintained Node numerical entry.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Locates the maintained numerical-worker entry whose checked modules and source-byte membership establish execution authority.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Locates the maintained numerical-worker entry whose checked modules and source-byte membership establish execution authority.
   */
  directory: string;

  /**
   * Current source identity, reread rather than stored across an edit.
   *
   * @evidence contracts/common.md#principled-implementation Node session startup reads the host's actual source revision and checks it again for source changes.
   * @evidence contracts/common.md#clear-and-simple-design The service borrows source identity from one existing owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An old session's revision is not reclassified as current by later readiness.
   * @evidence contracts/common.md#meaningful-documentation The accessor rereads source identity across startup and failure checks.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Node session startup reads the host's actual source revision and checks it again for source changes.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest The accessor rereads source identity across startup and failure checks.
   */
  revision: () => string;

  /**
   * Actual code/config membership and byte witnesses.
   *
   * @evidence contracts/common.md#principled-implementation Node startup receives exact byte witnesses and input membership from the host's source authority.
   * @evidence contracts/common.md#clear-and-simple-design One digest map carries the actual code and configuration input set.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching entry names or elapsed startup cannot substitute for unchanged input bytes.
   * @evidence contracts/common.md#meaningful-documentation Each key identifies an actual source/config input and each value its byte digest.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Node startup receives exact byte witnesses and input membership from the host's source authority.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Each key identifies an actual source/config input and each value its byte digest.
   */
  inputs: () => Record<string, string>;
}

/**
 * The immutable inputs named by one pose-defect census run.
 * The census command captures this before evaluating any state and compares
 * every later sample against it before publishing rows. A basis name alone
 * cannot distinguish different skin weights or corrective payloads. The source
 * fingerprint includes the numerical packages, census/review tooling, their
 * manifests and runtime inputs. These identities establish which inputs were
 * measured, not anatomical validity or correctness of a pose.
 *
 * @evidence contracts/common.md#principled-implementation The record separates the input basis revision and full payload from source bytes and repository head; the census guard compares each distinct identity rather than treating a label as content provenance.
 * @evidence contracts/common.md#clear-and-simple-design One basis identity and two source revision fields express the inputs needed by a run.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stores no acceptance, waiver or inferred anatomy from a matching fingerprint.
 * @evidence contracts/common.md#meaningful-documentation States the capture/guard consumers, why the basis name is insufficient and the limit of what identity proves.
 * @author Samchon
 */
export interface IBodyPoseCensusIdentity {
  /** Exact revision and complete JSON payload fingerprint of the input basis. */
  basis: { id: string; sha256: string };

  /** Repository head captured before the first state, never substituted at the end. */
  head: string;

  /** Fingerprint of the canonical source-path/byte collection and runtime inputs. */
  sourceSha256: string;
}

import type { IAutoMovieModel } from "@automovie/interface";

import type { IHumanFaceHairContactLayout } from "../../face/anatomy/hair/IHumanFaceHairContactLayout";
import type { IAutoMovieHumanFaceHair } from "../../face/structures/IAutoMovieHumanFaceHair";
import type { IHumanPersonHairContactProps } from "./IHumanPersonHairContactProps";

/**
 * What keeping a person's generated hair off the posed body reads: the placed face parts, which of them are actual emitted hair, the hair document's clearance layers, and the posed body skin in metres in the shared Y-up, +Z-forward frame.
 *
 * @evidence contracts/common.md#principled-implementation Actual emitted hair membership and geometry-owned stations identify contact operands in the shared posed body frame; absence of layouts preserves only the documented ribbon path.
 * @evidence contracts/common.md#clear-and-simple-design The person owns body/hair interaction while the face producer supplies exact emitted IDs and per-part station geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The observer receives a detached frozen snapshot, so mutating that supplied value cannot steer contact; callbacks with independently captured mutable operands remain the caller's responsibility.
 * @evidence contracts/common.md#meaningful-documentation Comments state replaceable parts, emitted membership, layout completeness, metre frame and optional snapshot behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The generated hair membership and contact-stage operands specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the generated hair membership and contact-stage operands; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The generated hair membership and contact-stage operands acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHairClearanceProps {
  /** The face parts, placed on the head, whose meshes may be replaced. */
  parts: IAutoMovieModel["parts"];

  /**
   * Whether a part ID belongs to the face producer's actual hair emission.
   *
   * @evidence contracts/common.md#principled-implementation Exact emitted membership selects hair parts for body contact while preserving unrelated generated face geometry.
   * @evidence contracts/common.md#clear-and-simple-design The face producer's membership reader owns emission identity rather than making person contact duplicate hair naming rules.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Membership follows actual producer output instead of a part-name prefix that could misclassify dental or lining geometry.
   * @evidence contracts/common.md#meaningful-documentation The member states that its boolean concerns the face producer's actual emitted hair part IDs.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The emission predicate signature chooses no membership data structure; the face builder supplies its reader.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This hair-membership declaration caches no requests; the owning face producer maintains its emission population.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring the membership reader acquires no task or buffer and leaves its captured emission set with the face builder.
   */
  isGenerated: (id: string) => boolean;

  /**
   * This emission's geometry-owned per-part stations, source seats and gaps. A supplied map must cover every actual generated part. Absence is only the existing ribbon transport and does not support terminal shafts.
   */
  contactLayouts?: ReadonlyMap<string, IHumanFaceHairContactLayout>;

  /** The hair document's layers, or none. */
  layers: readonly Pick<
    IAutoMovieHumanFaceHair["layers"][number],
    "clearance" | "samplingStep"
  >[];

  /** The body's posed skin positions, metres. */
  positions: readonly number[];

  /** The body's retained skin triangles, as flat vertex index triples. */
  indices: readonly number[];

  /**
   * Observe a frozen copy of the actual pre-contact input in the shared metre frame. Omission allocates no snapshot. The supplied snapshot exposes no mutable contact operand; this is not isolation from side effects through an independently captured reference. A thrown observer error propagates before contact changes the meshes.
   *
   * @evidence contracts/common.md#principled-implementation A detached deeply frozen pre-contact snapshot permits observation without transferring mutable body or generated hair geometry.
   * @evidence contracts/common.md#clear-and-simple-design The optional observer is called at the contact boundary and omission avoids snapshot copying entirely.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The observer reads actual input and cannot monkey-patch contact operands through the supplied frozen snapshot.
   * @evidence contracts/common.md#meaningful-documentation Documentation states shared metre frame, frozen ownership, omitted allocation and propagation of observer failure before mesh mutation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The observer signature performs no copy; the contact owner constructs the detached snapshot when the callback is present.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work An observation callback can have effects, and this type defines no shared or memoized observer execution.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Snapshot retention is controlled by the callback consumer; this signature owns no observer task or resource handle.
   */
  observe?: (snapshot: IHumanPersonHairContactProps) => void;
}

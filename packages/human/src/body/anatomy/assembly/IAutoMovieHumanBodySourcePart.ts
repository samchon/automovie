import type { IAutoMovieHumanBodyGeneratedPart } from "../generated/IAutoMovieHumanBodyGeneratedPart";
import type { IAutoMovieHumanBodySourcePartPayload } from "./IAutoMovieHumanBodySourcePartPayload";

type SourcePart<Part extends IAutoMovieHumanBodyGeneratedPart> =
  Part extends IAutoMovieHumanBodyGeneratedPart
    ? Pick<Part, "id" | "tissue"> & IAutoMovieHumanBodySourcePartPayload
    : never;

/**
 * A coarse source part retaining the actual generated catalogue's id/tissue pair.
 *
 * The source union derives from the maintained generated-part identity rather
 * than a second catalogue. Actual boundary surfaces are not asserted to be
 * independently validated volumetric solids or clinically resolved tissue.
 *
 * @evidence contracts/common.md#principled-implementation Distributed identity/tissue pairs preserve the existing anatomical owner without importing clinical solid qualification.
 * @evidence contracts/common.md#clear-and-simple-design One derived union adds the named source payload.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A bone cannot carry muscle material and a source receipt is not clinical certification.
 * @evidence contracts/common.md#meaningful-documentation States identity derivation and qualification boundary.
 * @evidence contracts/modeling.md#part-identity-and-grouping Existing closed part identities bind their own tissue family.
 * @evidenceExclude contracts/modeling.md#parameter-channels The source payload does not expose numerical authoring controls.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Source surfaces own actual boundary geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Surface and graph declarations own the common frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Payload attachments own shared site references.
 * @evidenceExclude contracts/modeling.md#rendered-observation Assembly consumers own visual observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Surface receipts and payload qualification own source meaning.
 * @evidenceExclude contracts/anatomy.md#permitted-range Shared source joints admit supported movement.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This is immutable source output, not personal authoring input.
 * @author Samchon
 */
export type IAutoMovieHumanBodySourcePart =
  SourcePart<IAutoMovieHumanBodyGeneratedPart>;

import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../face/structures/IAutoMovieHumanFaceHair";

/**
 * What keeping a person's generated hair off the posed body reads: the placed
 * face parts, which of them are actual emitted hair, the hair document's
 * clearance layers, and the posed body skin in metres in the shared Y-up,
 * +Z-forward frame.
 *
 * @evidence contracts/common.md#principled-implementation Every member is an existing owner's value: the placed parts, the face producer's hair membership, the hair document's layers and the posed body skin.
 * @evidence contracts/common.md#clear-and-simple-design One named carrier of the five values the clearance pass reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hair membership is the producer's actual emission, not inferred from part names; clearance stays the document's own.
 * @evidence contracts/common.md#meaningful-documentation States each member, its owner, units and frame.
 * @evidence contracts/modeling.md#spatial-conventions Body positions are metres in the shared Y-up, +Z-forward posed frame.
 * @evidence contracts/modeling.md#shared-boundaries The hair and the body meet at the clearance the hair layers state.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Parts are named by the face producer; this carrier defines none.
 * @evidenceExclude contracts/modeling.md#parameter-channels No member is a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The carrier emits no primitive; it names geometry already emitted.
 * @evidenceExclude contracts/modeling.md#rendered-observation The person assembly owns what is displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source No anatomical value is carried; clearance is the hair document's.
 * @evidenceExclude contracts/anatomy.md#permitted-range Hair document admission precedes this carrier.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No member is a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHairClearanceProps {
  /** The face parts, placed on the head, whose meshes may be replaced. */
  parts: IAutoMovieModel["parts"];

  /**
   * Whether a part ID belongs to the face producer's actual hair emission.
   *
   * @evidence contracts/common.md#principled-implementation It answers from the face producer's actual emitted hair IDs, so only real hair moves.
   * @evidence contracts/common.md#clear-and-simple-design One predicate of a part ID.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts IAutoMovieHumanPersonHairClearanceProps.isGenerated is a signature; it carries no behaviour, special case or compensating path.
   * @evidence contracts/common.md#meaningful-documentation States what membership it reports and whose emission it reflects.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IAutoMovieHumanPersonHairClearanceProps.isGenerated is a declaration and defines no part or group of parts.
   * @evidenceExclude contracts/modeling.md#parameter-channels IAutoMovieHumanPersonHairClearanceProps.isGenerated carries no parameter channel of a form.
   * @evidenceExclude contracts/modeling.md#emitted-geometry IAutoMovieHumanPersonHairClearanceProps.isGenerated decides no primitive population; it only describes data.
   * @evidenceExclude contracts/modeling.md#spatial-conventions A part ID carries no frame or unit.
   * @evidenceExclude contracts/modeling.md#shared-boundaries IAutoMovieHumanPersonHairClearanceProps.isGenerated constructs no surface; it describes data only.
   * @evidenceExclude contracts/modeling.md#rendered-observation IAutoMovieHumanPersonHairClearanceProps.isGenerated is a declaration and displays nothing itself.
   * @evidenceExclude contracts/anatomy.md#anatomical-source IAutoMovieHumanPersonHairClearanceProps.isGenerated carries no anatomical value, range, proportion, landmark or tissue behaviour.
   * @evidenceExclude contracts/anatomy.md#permitted-range IAutoMovieHumanPersonHairClearanceProps.isGenerated admits, bounds and combines no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority IAutoMovieHumanPersonHairClearanceProps.isGenerated defines no input through which a caller shapes a human form.
   */
  isGenerated: (id: string) => boolean;

  /** The hair document's layers, or none. */
  layers: readonly Pick<
    IAutoMovieHumanFaceHair["layers"][number],
    "clearance" | "samplingStep"
  >[];

  /** The body's posed skin positions, metres. */
  positions: readonly number[];

  /** The body's retained skin triangles, as flat vertex index triples. */
  indices: readonly number[];
}

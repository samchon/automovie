import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * The standard person requested when the connected person editor opens: the reference face on the neutral body, one linked identity, no shape, expression or pose authored. The basis ids are the published generation's head and body view ids.
 *
 * The caller supplies those ids; this constructor performs no generation lookup or validation and does not insert measured body strengths or population geometry. Reset belongs to the panel's first accepted history state, which may differ when this initial request is refused or superseded.
 *
 * @evidence contracts/common.md#principled-implementation One linked person starts with explicit caller-supplied face/body basis ids and empty authored shape/expression records; the panel establishes its separate Reset baseline only after accepted admission.
 * @evidence contracts/common.md#clear-and-simple-design The constructor owns sparse authored starting data while source lookup, generation pairing and numerical admission remain downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed presentation identity is not a clinical population measurement, empty authoring does not invent missing anatomy and basis ids are not validated by this object constructor.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies reference/neutral start, linked population choice, caller id premise and separate generation validation.
 * @evidence contracts/performance.md#efficient-algorithms Construction creates a fixed-size person/face/body record with three fresh empty authoring maps and stores the two basis-id strings; no numerical generation or palette traversal occurs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each caller needs independently mutable authored records, so this small starting document is returned fresh instead of sharing one cached editable object.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The constructor retains no result and acquires no worker or GPU resources; ordinary document lifetime belongs to the panel history/draft owner.
 *
 * @author Samchon
 */
export function connectedPersonStandardDocument(
  faceBasis: string,
  bodyBasis: string,
): IAutoMovieHumanPersonDocument {
  return {
    id: "connected-person",
    name: "Connected person",
    population: "linked",
    face: {
      id: "connected-person-face",
      name: "reference face",
      basis: faceBasis,
      shape: {},
      expression: {},
    },
    body: {
      id: "connected-person-body",
      name: "neutral body",
      basis: bodyBasis,
      shape: {},
    },
  };
}

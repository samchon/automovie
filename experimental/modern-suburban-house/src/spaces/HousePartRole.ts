

/**
 * What a part is, so the viewer and later reviews can group it.
 *
 * @evidence spaces/03-surface-owners.md Surface families are allocated to their emitting spaces owners.
 * @evidence spaces/03-surface-owners.md#exterior-surface-handoff Exterior roles distinguish envelope, roof, porch, site and chimney parts.
 * @evidence spaces/03-surface-owners.md#interior-surface-handoff Floor and ceiling roles identify room finish parts made by their room owners.
 * @evidence principles/core/source-units.md#source-scope-preservation This role labels an assigned part without claiming its surface for the helper.
 * @evidence principles/core/source-units.md#source-substantive-completion The viewer can group every emitted structural or finish family.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The surface-owner table allocates exterior bodies and the interior handoff allocates room finishes; this role union labels those parts without assigning a new owner.
 */
export type HousePartRole =
  | "wall"
  | "partition"
  | "floor"
  | "ceiling"
  | "roof"
  | "stair"
  | "guard"
  | "porch"
  | "chimney"
  | "paving"
  | "fence";

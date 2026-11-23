# src/harness/IAutoMoviePropRelationTarget.ts#IAutoMoviePropRelationTarget

## @evidence contracts/development/design.md#principled-representation

A closed `kind` union pairs environment and owned-record ids, or prop and affordance ids. `validatePropPlacements` refuses missing or ambiguous environment/prop registry identities, but building-list membership uses `some` and nested anchor/affordance reads use first matches: unique nested building and affordance ids rely on their owners' admission, not this target gate alone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six arms, one per kind of record a relation can cite, each carrying only the two ids that locate that record, so the relation table and the anchor dispatch switch on `kind` without optional fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No geometry is copied into the target. `propAnchorFrame` uses first-match lookups on admitted registries and returns a rest-placement TRS; nested nonuniform scale can produce unrepresented shear, and numerical decomposition failures may throw instead of returning null. No environment or prop id selects a special rule.

## @evidence contracts/development/common.md#meaningful-documentation

States that targets cite ids rather than geometry, which record owns each kind, the resolution and same-environment refusals, and how the anchor function answers a space or missing target; members name the list each id must appear in.

# src/harness/IAutoMoviePropRelationTarget.ts#IAutoMoviePropRelationTarget.ISpace

## @evidence contracts/development/design.md#principled-representation

The pair cites a space in the environment; containment reads its subtree's cells or shells and tests the occupancy box's corners against their union. No stated volume imposes no restriction, and non-convex gaps between included corners remain outside that measurement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two ids are the whole citation; the space's cells and units stay on the environment record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No anchor frame is invented for a region, and an unresolved space is refused rather than treated as the whole building.

## @evidence contracts/development/common.md#meaningful-documentation

States which relation kind accepts it, why it has no anchor frame, how containment uses it, and which list each id must appear in.

# src/harness/IAutoMoviePropRelationTarget.ts#IAutoMoviePropRelationTarget.IElement

## @evidence contracts/development/design.md#principled-representation

The pair resolves to one entry of the environment's `elements` list, and the anchor composes that element's rest matrices up its parent chain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two ids are the whole citation; the element's transform and hierarchy stay on the environment record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fixing to an element is currently checked as a citation only; its model geometry does not cause this consumer to measure contact or solve a joint. The anchor is a rest transform, not an operating-state attachment trajectory.

## @evidence contracts/development/common.md#meaningful-documentation

States which relation kinds accept it, that its anchor is the rest pose, and which list each id must appear in.

# src/harness/IAutoMoviePropRelationTarget.ts#IAutoMoviePropRelationTarget.IBoundary

## @evidence contracts/development/design.md#principled-representation

The pair resolves to one entry of the environment's `boundaries` list, whose first realizing element supplies the anchor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two ids are the whole citation; which elements realize the boundary stays on the boundary record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Standing against a boundary is currently checked as a citation, without a bearing measurement. The boundary's optional face does not change that consumer path; its anchor comes from the first realizing element.

## @evidence contracts/development/common.md#meaningful-documentation

States which relation kind accepts it, where its anchor comes from, and which list each id must appear in.

# src/harness/IAutoMoviePropRelationTarget.ts#IAutoMoviePropRelationTarget.IOpening

## @evidence contracts/development/design.md#principled-representation

The pair cites an opening; placement compares occupancy with a measurable fill model's rest-pose world AABB using 1e-9 m containment slack. A missing fill/model or unresolved rest transform skips that fit check; the opening's architectural reveal is not independently measured here.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two ids are the whole citation; the reveal and the fill element stay on the opening record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An open cut answers no anchor rather than a frame guessed from the boundary.

## @evidence contracts/development/common.md#meaningful-documentation

States which relation kind accepts it, the anchor and its `null` case, and which list each id must appear in.

# src/harness/IAutoMoviePropRelationTarget.ts#IAutoMoviePropRelationTarget.ISurface

## @evidence contracts/development/design.md#principled-representation

The pair resolves to the environment `surfaces` entry whose `surface.id` matches, the scene surface record whose footprint and height rule both the bearing check and the anchor read.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two ids are the whole citation; footprint and height stay on the surface record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The anchor is an interior point of a convex piece rather than a vertex mean, which can fall outside an L-shaped or holed surface.

## @evidence contracts/development/common.md#meaningful-documentation

States which relation kind accepts it, that bearing is measured, the anchor and its `null` case, and which id the surface field matches.

# src/harness/IAutoMoviePropRelationTarget.ts#IAutoMoviePropRelationTarget.IPropAffordance

## @evidence contracts/development/design.md#principled-representation

The pair resolves through the prop registry to one spec and then to an affordance id on its model; `validatePropAffordanceTarget` checks identity, uniqueness, presence and kind in that order, and `validatePropSupportCycles` refuses a cycle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two ids are the whole citation; the contact frame and its kind stay on the cited prop's model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A self-citation, an ambiguous prop or an affordance of the wrong kind is refused rather than resolved to the nearest usable one.

## @evidence contracts/development/common.md#meaningful-documentation

States which relation kinds accept it, every refusal, the affordance kind each relation needs, that resting is measured, and where the anchor comes from.

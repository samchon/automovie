# Modeling Principles

These chapters apply to any form a declaration defines, builds or measures, human or not, in addition to the common chapters.

## Part Identity and Grouping

Apply to declarations that define one part of a form or a group of parts.

- A part is the smallest piece with its own identity, such as a door or a bone. Give each part one named declaration.
- Build a larger form as a group of parts and smaller groups. A group owns its composition and member order and copies no member's shape or values.
- Divide the form so a change to one part reaches its neighbors only through shared boundaries.

Answer: the part or group, its members and why the division falls there. When one declaration holds several parts, state why it cannot be split.

## Parameter Channels

Apply to declarations that define or consume a channel that varies a form.

- Give each channel one named trait, so no two channels vary the same trait. Document independent controls and intentional coupling.
- A normalized offset is zero at its declared neutral and has a stated positive direction. Absolute measurements keep their units and observed grades keep their protocol; neither becomes a neutral-zero offset implicitly. One declaration owns each conversion.
- Carry paired features as left and right values with an explicit neutral and symmetry rule, so asymmetry stays authored data.

Answer: each channel's trait, neutral, positive direction and pair representation, and each channel whose effect depends on another.

## Emitted Geometry

Apply to declarations that decide which primitives a form emits, such as vertices, triangles, strands, cards or instances.

- Derive the emitted population from the representation the form requires. Use a parametric surface, subdivision, card, instance or level of detail where the form allows, and emit individual primitives only where it does not.
- The count grows with resolution parameters, not with the number of authored features.

Answer: the representation, the parameters that set each primitive count, the counts at the supported extremes and why no smaller representation suffices. Computation cost is outside this chapter.

## Spatial Conventions

Apply to declarations whose values carry a unit or a coordinate frame.

- Keep one unit and one frame, with one handedness, axis order and origin, inside a declaration.
- Convert only where units or frames meet, as an explicit named step with one owner.

Answer: the unit, frame, origin and axes of each input and output, and the conversions at the boundary.

## Shared Boundaries

Apply to declarations that construct a surface or volume that meets another part.

- Build the boundary from one definition both sides share, so the parts meet without a gap, an overlap or, where the form is smooth, a jump in the normal.
- Keep it valid under every admitted configuration of both parts, including extremes and combinations.

Answer: the boundaries built or consumed, the shared definition, the continuity it guarantees and each configuration in which the join opens.

## Rendered Observation

Apply to declarations that own a part, a group of parts or the joint between two parts, and whose result a viewer displays.

- Observe the current final output through the viewer-verification procedure: opposing views, rest, intermediate states, supported extremes, return and relevant shape-motion combinations.
- Judge close and at the shot's use distance, because a proxy that reads far can fail close and close detail can vanish far. Judge the silhouette at use distance.
- Inspect in assembled context with beauty or clay and the structural pass that exposes the suspected failure. A joint owner observes the pair and an assembly owner the assembly; a transport or numerical helper has no whole-render obligation.
- Record the source revision, inputs, views, results and limits in the owning issue or review record. Missing, stale, unavailable or occluded output stays unverified. Reobserve affected results and neighbors when an input, source or consumer changes.

Answer: the observation responsibility and the supported result, with accepted defects as named ceilings. A list of views in a tag is not an observation.

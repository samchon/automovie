# Modeling Principles

These chapters address how a declaration that defines, builds or measures a form divides it into parts, varies it, sizes it, joins it to its neighbors and observes the result. They apply to any figure, structure, space or asset, human or not, in addition to the common chapters, and they do not repeat them.

## Part Identity and Grouping

Apply to declarations that define one part of a form or a group of parts.

A part is the smallest piece of the represented form that has its own identity, such as a door, a window or a bone. Represent each part by one declaration with its own name. Build every larger form as a group that composes parts and smaller groups, so a building is a group of storeys and a storey is a group of rooms. A group owns its composition and the order of its members, and it does not copy a member's shape or values.

Identify the part or group the declaration represents and the members it composes. Explain why the division falls where it does, so that a change to one part reaches its neighbors only through the shared boundaries that join them. State when one declaration holds more than one part and why it cannot be split.

## Parameter Channels

Apply to declarations that define or consume a channel that varies a form.

Give each channel one named trait, and document independent controls and intentional coupling. For a normalized deformation offset, zero denotes its declared neutral and positive values have a stated direction. Absolute measurements retain their units and observed grades retain their protocol; neither becomes a neutral-zero offset implicitly. Own any conversion between these quantities in one declaration. Carry paired features as left and right values with an explicit neutral and symmetry rule, so asymmetry remains authored data.

Identify the trait each channel varies, its neutral, the direction of its positive values and how a pair is represented. Explain why no two channels vary the same trait, and name each channel whose effect depends on the value of another.

## Emitted Geometry

Apply to declarations that decide which primitives a form emits, such as vertices, triangles, strands, cards or instances.

Derive the emitted population from the representation the form requires. Use a parametric surface, subdivision, a card, an instance or a level of detail wherever the form is regular enough for it, and emit an individual primitive only for a feature the representation cannot express. A population that follows from the form grows with the form's resolution parameters, and it does not grow with the number of features an author added.

Identify the representation, the parameters that determine the count of each primitive kind, and the counts at the supported extremes. Explain why no smaller representation expresses the form. This chapter concerns how much the declaration emits. The cost of computing it is outside this chapter.

## Spatial Conventions

Apply to declarations whose values carry a unit or a coordinate frame.

Keep every value in one declared unit and one coordinate frame inside a declaration, and convert only where frames or units meet. Use one handedness, axis order and origin per frame. Make each conversion an explicit, named step owned by one declaration.

Identify the unit, frame, origin and axis directions of each input and output, and the conversions the declaration performs at its boundary.

## Shared Boundaries

Apply to declarations that construct a surface or volume that meets another part.

Construct the boundary between two parts from one definition that both sides share, so the parts meet without a gap or an overlap and, where the form is smooth, without a jump in the normal. Keep the boundary valid under every admitted configuration of both parts, including extremes and combinations.

Identify the boundaries the declaration builds or consumes, the definition both sides share and the continuity the boundary guarantees. Explain what keeps the two sides joined when either changes, and state each configuration in which the join opens.

## Rendered Observation

Apply to declarations that own a part, a group of parts or the joint between two parts, and whose result a viewer displays.

Observe the current final output for the owned part, boundary or assembly through the viewer-verification procedure. Cover opposing views, readable detail and use distance, rest, intermediate states, supported extrema, return and relevant shape-motion combinations. Inspect the part in its assembled context, using beauty or clay and the structural pass that can expose the suspected failure. A joint owner observes the joined pair; an assembly owner observes the assembly. A transport or numerical helper carries no independent whole-render obligation.

Keep the observation's source revision, inputs, views, actual results and limits in the owning issue or review record. A declaration's answer identifies its observation responsibility and the supported result; a list of views in a tag proves no observation. Missing, stale, unavailable or occluded output remains unverified. State accepted defects as named ceilings and leave unsupported completion claims unanswered. Reobserve the affected result and shared neighbors when an input, source or consumer changes invalidate that evidence.

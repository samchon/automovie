# Modularization

A named part makes a change local, and a group makes its members move and change together. Crafted, recovered, generated and found forms are structured alike, because a form's source does not change how it belongs to an assembly.

## Parts and groups

Split an asset into fine named parts and group them as the object is assembled and moves. A part owns its shape, and a group references its members instead of copying their shapes, so an edit leaves no second definition behind.

A group is a node with children: its frame is its subtree's pivot, and its rotation limit is the subtree's range of motion. Put the frame on the real axis, such as a hinge, and link across branches with a driver, never a second parent, so each transform has one owner. A rigid member moves through its transform; a deforming one needs the [rig](rigging.md) its performance requires.

## Frames and connections

Place each member relative to its parent, so a change to the parent carries the assembly with it. Keep one unit and one frame inside a declaration and convert only where declarations meet, in one named step, because repeated conversions hide which coordinates a formula consumes.

Define each connection once, with its intended continuity, contact or clearance, for both parts to consume, because two independently authored boundaries can agree in one pose and separate when a dimension or motion changes.

## Source modules

Organize authoring modules by part and group responsibility, reusing one definition for repeated and mirrored members. Keep each shape or placement rule with its owner, and give shared dimensions, frames, curves and surfaces one owner too. Dependent modules consume those definitions and derive their geometry, construction and attachments from the actual generating definitions, never from independent approximations, so a local edit leaves no neighbor or diagnostic describing an old shape.

A source-module boundary need not cut the rendered surface. Keep logical parts, source controls, generating streams and surface charts distinct, and map a logical member to the subdomains that realize it instead of copying geometry to keep its name. Parts sewn along a shared boundary take their material coordinates and binding from one owner through their chart maps, while parts in coincident contact can keep separate material sheets.

An edit follows the actual dependency graph: coupled constraints can reach several regions, while unchanged inputs may reuse equivalent prepared work. A shape or chart change invalidates the bindings that depend on it, and a changed joint or rest frame also invalidates the inverse binds under [Rigging](rigging.md); a surface repartition alone creates no joint and changes no unaffected bone.

Comments keep the premises and reasons that the modules' calculations do not show, so a later agent sees why the parts fit before changing them. Write them as the project's development skill requires, under the [documentation skill](../documentation/SKILL.md)'s writing rules.

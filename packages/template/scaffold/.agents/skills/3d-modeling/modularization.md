# Modularization

A named part makes a change local; a group makes its members move and change together. This structure applies to crafted forms, rebuilt diffusion output, and generated meshes placed directly, because their source does not change how they belong to an assembly.

## Parts And Groups

Split an asset into fine named parts and group them as the object is assembled and moves. A part owns its shape; a group references its members rather than copying their shapes, so editing a member cannot leave a second definition behind.

For placement and motion, a group is a node with children: its frame is the pivot of its subtree and its rotation limit is the subtree's range of motion. Put the frame on the real axis, such as a hinge, and link across branches with a driver, never a second parent, so a member's transform has one owner.

## Frames And Connections

Express each member's placement relative to its parent so a change to the parent carries the assembly together. Keep one unit and one frame inside a declaration, converting only where declarations meet, in one named step; repeated conversions obscure which coordinates a formula consumes.

Define each connection once for both parts to consume, including its intended continuity, contact or clearance. Two independently authored boundaries can agree in one pose and separate when a dimension or motion changes.

## Source Modules

Organize authoring modules by part and group responsibility, reusing one definition for repeated members. Keep shape or placement rules with their owner and have dependent modules consume that definition, so an agent can read and change one responsibility without reconstructing the whole asset.

A source-module boundary need not cut the rendered surface. Put shared dimensions, frames, curves and surfaces with one owner, and derive dependent geometry, construction and attachments from their actual generating definitions rather than independent approximations; otherwise a local edit can leave a neighbor or diagnostic describing an old shape.

## Explanation

Modular code exposes the dependency graph, while comments preserve the premises and reasons that its calculations alone do not show. Apply [Meaningful documentation](../contracts/common.md#meaningful-documentation) to the public contracts and implementation, using the [documentation skill](../documentation/SKILL.md)'s writing rules, so a later agent can follow why the parts fit before changing them.

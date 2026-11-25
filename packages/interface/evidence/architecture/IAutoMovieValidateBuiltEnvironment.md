# src/architecture/IAutoMovieValidateBuiltEnvironment.ts#IAutoMovieValidateBuiltEnvironment.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Validate the graph, geometry references, and spatial topology of a building. Member documentation states the supplied records, units and absence meanings used by validateBuiltEnvironment.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A typed building is not proof of valid references or numeric geometry; validateBuiltEnvironment collects those domain violations under its documented container premises.

## @evidence contracts/development/design.md#principled-representation

environment supplies the canonical building graph in world metres; validation resolves its authored identities, geometry and operating-state constraints without rewriting the graph.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidateBuiltEnvironment.IProps, used by validateBuiltEnvironment. Its environment members carry this operation's declared inputs or results; imported domain records keep their existing definitions.

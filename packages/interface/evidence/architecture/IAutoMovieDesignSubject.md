# src/architecture/IAutoMovieDesignSubject.ts#IAutoMovieDesignSubject

## @evidence contracts/development/design.md#principled-representation

Coherence requires unique nonblank subject id, nonblank graph name and null or digest spelling. Binding is exact id-set membership in published building-unit/element/space/boundary/opening/connector ids, compiled model ids and current production asset-use consumer ids. Graph labels are not matched to a typed publisher, so membership does not establish source family, unique cross-graph ownership or byte provenance; build review performs binding outside design-only scope when compiled shots exist.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An id plus an open graph name is the whole coupling, so a new graph opts into lineage by publishing ids rather than by widening this type or importing the lineage module.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unpublished ids are refused at build rather than ignored; the remaining gap is that an imported subject's digest is authored and not compared with the asset manifest, which the `digest` documentation states.

## @evidence contracts/development/common.md#meaningful-documentation

States why the record is graph-agnostic, exactly which published ids a subject may bind to, when a digest is required and when it must be null, and that the digest is unverified against the manifest.

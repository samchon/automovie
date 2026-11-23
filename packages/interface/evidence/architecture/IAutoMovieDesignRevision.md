# src/architecture/IAutoMovieDesignRevision.ts#IAutoMovieDesignRevision

## @evidence contracts/development/design.md#principled-representation `validateDesignLineage` requires unique non-blank ids, a parent that resolves, a lowercase `sha256:` hex digest, and an acyclic parent chain found by depth-first search; staleness compares a derived artifact's stamp with the lineage head by id.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A revision is an id, one optional parent, and a digest, enough to name a state and its predecessor without carrying the source text or a version-control model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Digest spelling does not authenticate source bytes or enforce immutable records; callers own preserving a revision's meaning. Multiple roots and a head with recorded descendants are allowed, and one parent cannot express a merge. The gate does not prove the head is a unique newest leaf or that every revision reaches it.

## @evidence contracts/development/common.md#meaningful-documentation

States that the digest is authored and unverified, that several roots are allowed, that merges are unrepresentable, and what a null parent means.

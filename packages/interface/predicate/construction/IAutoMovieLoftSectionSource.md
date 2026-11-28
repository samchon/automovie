# src/construction/IAutoMovieLoftSectionSource.ts#IAutoMovieLoftSectionSource.ISource

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes original scalar geometry from saved coefficient rows and states their ordering and update lifetime.

## @evidence contracts/development/design.md#principled-representation

SectionSource.retain records the scalar source and per-layer copies. Validate uses binary lookup for the bracketed stations and throws if a present source or matching layer binding is malformed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record reuses prepared view input data. Its snapshots bind the legacy compatibility rows without duplicating the scalar evaluator.

# src/construction/IAutoMovieLoftSectionSource.ts#IAutoMovieLoftSectionSource.ISource.kind

## @evidence contracts/development/common.md#meaningful-documentation

The comment defines the selected owner and preserves invalid-present behavior.

# src/construction/IAutoMovieLoftSectionSource.ts#IAutoMovieLoftSectionSource.ISource.data

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies what the native reader obtains from the prepared source.

# src/construction/IAutoMovieLoftSectionSource.ts#IAutoMovieLoftSectionSource.ISource.rows

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the ordering and stable data required by binary lookup and equality checks.

# src/construction/IAutoMovieLoftSectionSource.ts#IAutoMovieLoftSectionSource.IEndpoint

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies who prepares the pair, the receiving chart and the later equality premise.

## @evidence contracts/development/design.md#principled-representation

SectionSource.bind admits the field variant before copying it independently to field and snapshot and recording layer rows. Endpoint compares that family and layer binding before use.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The endpoint reuses the family and coefficient binding representations. The continuation owner handles orientation into the receiving chart.

# src/construction/IAutoMovieLoftSectionSource.ts#IAutoMovieLoftSectionSource.IEndpoint.kind

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the ownership attached to an endpoint.

# src/construction/IAutoMovieLoftSectionSource.ts#IAutoMovieLoftSectionSource.IEndpoint.field

## @evidence contracts/development/common.md#meaningful-documentation

The comment states when a source must already have been oriented.

# src/construction/IAutoMovieLoftSectionSource.ts#IAutoMovieLoftSectionSource.IEndpoint.binding

## @evidence contracts/development/common.md#meaningful-documentation

The comment names the actual layer values the endpoint reader compares.

# src/construction/IAutoMovieLoftSectionSource.ts#IAutoMovieLoftSectionSource.IEndpoint.snapshot

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains why the family is retained twice.

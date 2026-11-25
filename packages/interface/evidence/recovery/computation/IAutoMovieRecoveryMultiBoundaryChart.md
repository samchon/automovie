# src/recovery/computation/IAutoMovieRecoveryMultiBoundaryChart.ts#IAutoMovieRecoveryMultiBoundaryChart.Input

## @evidence contracts/development/common.md#meaningful-documentation

Private physical positions in millimetres; returned positions include fan duplicates. Private oriented incidence; returned triangles address the cut disk vertices.

## @evidence contracts/development/design.md#principled-representation

Private physical positions in millimetres; returned positions include fan duplicates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

RecoveryAtlasObservationChart, RecoveryFeatureChartPreparation, RecoveryMultiBoundaryChart share IAutoMovieRecoveryMultiBoundaryChart's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared observation and coefficient identities remain separate from source coverage and numerical qualification.

# src/recovery/computation/IAutoMovieRecoveryMultiBoundaryChart.ts#IAutoMovieRecoveryMultiBoundaryChart.Result

## @evidence contracts/development/common.md#meaningful-documentation

Private physical positions in millimetres; returned positions include fan duplicates. Private oriented incidence; returned triangles address the cut disk vertices.

## @evidence contracts/development/design.md#principled-representation

Private physical positions in millimetres; returned positions include fan duplicates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

RecoveryAtlasObservationChart, RecoveryFeatureChartPreparation, RecoveryMultiBoundaryChart share IAutoMovieRecoveryMultiBoundaryChart's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Actual source edges selected by the private connecting cut forest.

# src/recovery/computation/IAutoMovieRecoveryMultiBoundaryChart.ts#IAutoMovieRecoveryMultiBoundaryChart.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Cut a qualified genus-zero observation into a disk while preserving original physical vertices and area. Invalid boundary cycles, unsupported topology or nonrepresentable cuts throw; inputs remain borrowed and the returned disk owns its duplicated fans.

## @evidence contracts/development/design.md#principled-representation

The existing source, query and result records preserve physical identity and explicit topology qualification.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The runtime operation and its callers share the same input and result owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unsupported incidence remains explicit and no source address becomes reconstructed geometry.

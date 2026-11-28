# src/construction/IAutoMovieConstructionPortField.ts#IAutoMovieConstructionPortField.IField

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies both kinds of bounds, derivative coordinate and shared constant capability.

## @evidence contracts/development/design.md#principled-representation

PortField.periodic uses the cubic control hull for value bounds and checks each span's derivative quadratic at endpoints and interior extrema for slope bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A single field representation supplies exact values, derivatives and the bounds needed by port and ribbon admission.

# src/construction/IAutoMovieConstructionPortField.ts#IAutoMovieConstructionPortField.IField.at

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the returned tuple and derivative axis.

# src/construction/IAutoMovieConstructionPortField.ts#IAutoMovieConstructionPortField.IField.bounds

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains the bound source and whole-cycle scope.

# src/construction/IAutoMovieConstructionPortField.ts#IAutoMovieConstructionPortField.IField.slopes

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the derivative scale and required extrema.

# src/construction/IAutoMovieConstructionPortField.ts#IAutoMovieConstructionPortField.IField.range

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the interval-specific bound and whole-cycle fallback.

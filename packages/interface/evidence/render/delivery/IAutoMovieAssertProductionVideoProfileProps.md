# src/render/delivery/IAutoMovieAssertProductionVideoProfileProps.ts#IAutoMovieAssertProductionVideoProfileProps

## @evidence contracts/development/design.md#principled-representation

Parsing and encoding remain host operations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

assertProductionVideoProfile exchanges expected, actual; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Parsing and encoding remain host operations.

## @evidence contracts/development/common.md#meaningful-documentation

Required H.264 delivery profile and observed MP4 video facts. assertProductionVideoProfile refuses mismatched raster, rate, brand, matrix, pixel aspect or color metadata. The prose and members document how assertProductionVideoProfile interprets and admits these values.

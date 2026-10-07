/**
 * Source stage files that hold topology, UV, skin weights, address maps and
 * the frozen neck cut, and no neutral coordinate or endpoint delta. An
 * authoring stage that only moves vertices or edits endpoint rows leaves
 * every one of them byte-identical.
 */
export const HUMAN_SOURCE_STAGE_STRUCTURE_FILES: readonly string[] = [
  "root-parent-triangles.i32",
  "root-corner-uv.f64",
  "root-weights.json",
  "head-indices.i32",
  "head-uv.f64",
  "head-weights.json",
  "head-parents.i32",
  "head-samples.i32",
  "head-material-regions.json",
  "body-indices.i32",
  "body-uv.f64",
  "body-weights.json",
  "body-parents.i32",
  "body-samples.i32",
  "native-to-source.i32",
  "source-to-native.i32",
  "original-face-to-head.i32",
  "original-head-cell-to-head.i32",
  "frozen-cut.json",
];

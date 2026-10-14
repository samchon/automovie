import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";

/**
 * Six signed half-space planes for the caller's axis-aligned box bounds.
 *
 * @evidence contracts/testing.md#behavioral-verification Existing room-visibility cases exercise interior, exterior and overlapping cells built with these planes; assertions belong to those cases, not this input helper.
 * @evidence contracts/testing.md#independent-expectations Each maximum uses the positive unit-axis normal and each minimum its negative, so containment follows directly from the supplied axis bounds.
 * @evidence contracts/testing.md#distinguishing-cases Returns all six planes unchanged for any numeric input, including reversed or malformed bounds; it performs no geometry admission or repair, leaving refusal semantics to consumers.
 * @evidence contracts/testing.md#execution-ownership Numerical fixture construction only, with fresh plane objects and no native mesh, host, file or discovered test registration.
 */
export const boxCell: (props: { id: string; min: [number, number, number]; max: [number, number, number]; }) => IAutoMovieBuiltEnvironment["spaces"][number]["cells"][number] = (props: {
  id: string;
  min: [number, number, number];
  max: [number, number, number];
}): IAutoMovieBuiltEnvironment["spaces"][number]["cells"][number] => ({
  id: props.id,
  planes: [
    { normal: { x: 1, y: 0, z: 0 }, offset: props.max[0] },
    { normal: { x: -1, y: 0, z: 0 }, offset: -props.min[0] },
    { normal: { x: 0, y: 1, z: 0 }, offset: props.max[1] },
    { normal: { x: 0, y: -1, z: 0 }, offset: -props.min[1] },
    { normal: { x: 0, y: 0, z: 1 }, offset: props.max[2] },
    { normal: { x: 0, y: 0, z: -1 }, offset: -props.min[2] },
  ],
});

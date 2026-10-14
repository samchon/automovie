/** Bytes per component for each glTF component type. */
export const COMPONENT_BYTES: ReadonlyMap<number, number> = new Map<
  number,
  number
>([
  [5120, 1],
  [5121, 1],
  [5122, 2],
  [5123, 2],
  [5125, 4],
  [5126, 4],
]);

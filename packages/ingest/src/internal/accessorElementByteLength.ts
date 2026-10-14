import { COMPONENT_BYTES } from "./COMPONENT_BYTES";
import { SHAPE_COMPONENTS } from "./SHAPE_COMPONENTS";

/**
 * Compute glTF accessor element storage including matrix-column padding.
 *
 * @evidence contracts/common.md#principled-implementation Component byte width and logical shape count define dense size; MAT2/MAT3 narrow components pad each column to four bytes.
 * @evidence contracts/common.md#clear-and-simple-design One sizing owner serves dense, sparse and reader stride defaults so storage alignment rules have one representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Padded matrix cases are glTF layout contracts rather than fixture corrections; shape/type admission is a required caller premise.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes logical component count from physical bytes and names the column-alignment cases.
 * @evidence contracts/performance.md#efficient-algorithms Fixed shape lookup and at most three padding branches require constant time without reading elements.
 * @evidence contracts/performance.md#reuse-equivalent-work All accessor consumers reuse equivalent storage sizing from the same two fixed vocabulary tables.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function owns no arrays, byte views or retained state and returns one scalar size.
 * @author Samchon
 */
export const accessorElementByteLength: (componentType: number, shape: string) => number = (
  componentType: number,
  shape: string,
): number => {
  const component: number = COMPONENT_BYTES.get(componentType)!;
  if (shape === "MAT2" && component === 1) return 8;
  if (shape === "MAT3" && component === 1) return 12;
  if (shape === "MAT3" && component === 2) return 24;
  return component * SHAPE_COMPONENTS[shape]!;
};

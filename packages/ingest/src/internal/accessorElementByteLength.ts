import { COMPONENT_BYTES } from "./COMPONENT_BYTES";
import { SHAPE_COMPONENTS } from "./SHAPE_COMPONENTS";

/** Compute glTF accessor element storage including matrix-column padding. */
export function accessorElementByteLength(
  componentType: number,
  shape: string,
): number {
  const component: number = COMPONENT_BYTES.get(componentType)!;
  if (shape === "MAT2" && component === 1) return 8;
  if (shape === "MAT3" && component === 1) return 12;
  if (shape === "MAT3" && component === 2) return 24;
  return component * SHAPE_COMPONENTS[shape]!;
}

import {
  SUBSURFACE_TEXTURE_SIZE
} from "../../../../../packages/render/src/scene/subsurfaceShading/SUBSURFACE_TEXTURE_SIZE";
import {
  subsurfaceTable
} from "../../../../../packages/render/src/scene/subsurfaceShading/internal/subsurfaceTable";
import { TestValidator } from "@nestia/e2e";

/** Tolerance of the closed-form first row. */
const ROW_TOLERANCE: number = 1e-12;

/**
 * `subsurfaceTable` tabulates wrapped-Gaussian blurred cosine lighting.
 *
 * Scenarios:
 *
 * 1. It has one row per blur step and one column per cosine step.
 * 2. Row 0 has no blur, so entry `i` is `max(0, 2i/(n-1) - 1)`.
 * 3. Every entry lies in `[0, 1]`, and a blurred row lights the dark side: its
 *    first entry (the cosine of -1) is above 0.
 */
export function test_render_scene_subsurface_table(): void {
  const table: number[][] = subsurfaceTable();
  const { cosines, blurs }: { cosines: number; blurs: number } =
    SUBSURFACE_TEXTURE_SIZE;
  TestValidator.equals("rows", table.length, blurs);
  TestValidator.equals(
    "columns",
    table.every((row: number[]): boolean => row.length === cosines),
    true,
  );
  TestValidator.predicate(
    "unblurred row",
    table[0]!.every(
      (value: number, i: number): boolean =>
        Math.abs(value - Math.max(0, (2 * i) / (cosines - 1) - 1)) <
        ROW_TOLERANCE,
    ),
  );
  TestValidator.predicate(
    "range",
    table.every((row: number[]): boolean =>
      row.every((value: number): boolean => value >= 0 && value <= 1),
    ),
  );
  TestValidator.predicate("dark side lit", table[blurs - 1]![0]! > 0);
}
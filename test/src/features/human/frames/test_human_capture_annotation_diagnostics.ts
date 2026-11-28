import { NodeCanvasCamera as Camera } from "../../../reference-conics/render/NodeCanvasCamera";
import { NodeCanvasRaster as Raster } from "../../../reference-conics/render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "../../../reference-conics/render/NodeCanvasTypes";

/**
 * A returned mesh does not collapse unavailable, empty and nonempty diagnostic evidence.
 *
 * Scenarios:
 * 1. The same returned-mesh scene displays unknown, zero and two diagnostics differently.
 * 2. Repeated equal evidence produces identical PNG bytes.
 * 3. Diagnostic evidence does not change rasterized triangle work or annotation-free PNG bytes.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual raster boundary with literal diagnostic counts; pairwise PNG differences expose a dropped or invented diagnostic state.
 * @evidence contracts/development/testing.md#independent-expectations A literal triangle, camera and label isolate the three input states of unknown evidence, zero diagnostics and two diagnostics. Expected pairwise differences apply to the annotation, with equal-state repeats and unannotated PNG equality as controls.
 * @evidence contracts/development/common.md#meaningful-documentation Unknown, zero and two diagnostics produce distinguishable annotations. Equal input repeats and annotation-free scene comparisons isolate those changes.
 */
export function test_human_capture_annotation_diagnostics(): void {
  const failures: string[] = [];

  /** Collect all diagnostic-caption failures in one gate result. */
  const check: (value: boolean, message: string) => void = (
    value: boolean,
    message: string,
  ): void => {
    if (!value) failures.push(message);
  };
  const points: N.Point[] = [[0, 0, 0], [0, 1, 0], [0, 0, 1]];
  const camera: N.Camera = Camera.fit("front", points, 640, 320);
  const mesh: N.Mesh = {
    id: "literal-triangle",
    positions: points.flat(),
    indices: [0, 1, 2],
    colour: [0.6, 0.6, 0.6],
  };
  const counts: readonly (number | null)[] = [null, 0, 2];
  const annotated: ReturnType<typeof Raster.render>[] = [];
  const plain: Buffer[] = [];
  for (const diagnosticCount of counts) {
    const observation: N.Observation = { stage: "clay", realization: "mesh-returned", diagnosticCount };
    const rendered: ReturnType<typeof Raster.render> = Raster.render(camera, [mesh], [], "depth", "same literal scene", undefined, "fixture", observation);
    annotated.push(rendered);
    const repeated: Buffer = Raster.render(camera, [mesh], [], "depth", "same literal scene", undefined, "fixture", observation).png;
    check(rendered.png.equals(repeated), "equal diagnostic evidence changed PNG bytes");
    plain.push(Raster.render({ ...camera, annotations: false }, [mesh], [], "depth", "same literal scene", undefined, "fixture", observation).png);
  }
  for (let a: number = 0; a < annotated.length; a++) {
    check(annotated[a]!.pixels.surface > 0, "literal scene drew no triangle");
    check(annotated[a]!.pixels.surface === annotated[0]!.pixels.surface, "diagnostic count changed rasterized triangle work");
    check(plain[a]!.equals(plain[0]!), "diagnostic evidence changed an annotation-free PNG");
    for (let b: number = a + 1; b < annotated.length; b++)
      check(!annotated[a]!.png.equals(annotated[b]!.png), "annotation collapsed diagnostic counts " + String(counts[a]) + " and " + String(counts[b]));
  }
  if (failures.length > 0) throw new Error(failures.join("\n"));
}

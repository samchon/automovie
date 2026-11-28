import { NodeCanvasCamera as Camera } from "../../../reference-conics/render/NodeCanvasCamera";
import { NodeCanvasRaster as Raster } from "../../../reference-conics/render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "../../../reference-conics/render/NodeCanvasTypes";

/**
 * The displayed pass and the run's realization evidence independently change the annotation.
 *
 * Scenarios:
 * 1. Reference and raw passes distinguish an unrequested realization from a returned mesh.
 * 2. Reference, raw loft, original curves and clay remain distinct within the same realized run.
 * 3. An unspecified diagnostic does not claim that realization was unrequested.
 * 4. Changing only observation evidence leaves the decoded scene body and annotation-free PNG unchanged.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the existing in-process rasterizer and PNG decoder with one literal triangle; different evidence must produce different annotated PNGs while the same scene body remains identical.
 * @evidence contracts/development/testing.md#independent-expectations The same literal triangle and camera hold the decoded body constant while displayed stage and mesh-return evidence change. Expected inequalities compare annotation bytes and the annotation-free fixture supplies a passing counterpart.
 * @evidence contracts/development/common.md#meaningful-documentation Stage, returned-mesh state and omitted diagnostics produce distinguishable annotations on the same triangle, whose decoded body is checked separately.
 */
export async function test_human_capture_annotation_modes(): Promise<void> {
  const failures: string[] = [];

  /** Collect every caption phenomenon before the shared gate reports this cause. */
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
  const observations: readonly N.Observation[] = [
    { stage: "reference", realization: "not-requested", diagnosticCount: null },
    { stage: "reference", realization: "mesh-returned", diagnosticCount: 0 },
    { stage: "raw-loft-curves", realization: "mesh-returned", diagnosticCount: 0 },
    { stage: "curves", realization: "mesh-returned", diagnosticCount: 0 },
    { stage: "clay", realization: "mesh-returned", diagnosticCount: 0 },
    { stage: "raw-loft-curves", realization: "not-requested", diagnosticCount: null },
  ];
  const annotated: ReturnType<typeof Raster.render>[] = [];
  const plain: Buffer[] = [];
  for (const observation of observations) {
    annotated.push(Raster.render(camera, [mesh], [], "depth", "same literal scene", undefined, "fixture", observation));
    plain.push(Raster.render({ ...camera, annotations: false }, [mesh], [], "depth", "same literal scene", undefined, "fixture", observation).png);
  }
  for (let a: number = 0; a < annotated.length; a++) {
    check(annotated[a]!.pixels.surface > 0, "literal scene drew no triangle");
    check(plain[0]!.equals(plain[a]!), "observation changed an annotation-free PNG");
    for (let b: number = a + 1; b < annotated.length; b++)
      check(!annotated[a]!.png.equals(annotated[b]!.png), "annotation ignored independent pass/run states " + a + " and " + b);
  }
  const unspecified: ReturnType<typeof Raster.render> = Raster.render(camera, [mesh], [], "depth", "same literal scene", undefined, "fixture");
  check(!unspecified.png.equals(annotated[0]!.png), "unspecified run evidence looked like an explicit unrequested realization");
  const original: Awaited<ReturnType<typeof Raster.decodePng>> = await Raster.decodePng(unspecified.png);
  let colouredBody: number = 0;
  for (let y: number = 90; y < camera.height - 32; y++)
    for (let x: number = 16; x < camera.width - 16; x++) {
      const at: number = 4 * (y * camera.width + x);
      if (original.pixels[at] !== 238 || original.pixels[at + 1] !== 241 || original.pixels[at + 2] !== 245) colouredBody++;
    }
  check(colouredBody > 0, "the independent body region contained no scene pixels");
  for (const rendered of annotated) {
    const decoded: Awaited<ReturnType<typeof Raster.decodePng>> = await Raster.decodePng(rendered.png);
    let equal: boolean = true;
    for (let y: number = 90; y < camera.height - 32; y++) {
      const offset: number = 4 * (y * camera.width + 16);
      const length: number = 4 * (camera.width - 32);
      const before: Buffer = Buffer.from(original.pixels.buffer, original.pixels.byteOffset + offset, length);
      const after: Buffer = Buffer.from(decoded.pixels.buffer, decoded.pixels.byteOffset + offset, length);
      if (!before.equals(after)) equal = false;
    }
    check(equal, "annotation changed the decoded scene body");
  }
  if (failures.length > 0) throw new Error(failures.join("\n"));
}

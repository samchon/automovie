import { AutoMovieSolidVector as Vec } from "@automovie/engine";
import type {
  IAutoMovieHumanDigitNails,
  IAutoMovieHumanNail,
} from "@automovie/interface";

import { FamilyConicCaptureFrame as Frame } from "./FamilyConicCaptureFrame";
import { FamilyConicMpfbNailCapture as Capture } from "./FamilyConicMpfbNailCapture";
import type { FamilyConicMpfbNailJoin as Join } from "./FamilyConicMpfbNailJoin";
import { NodeCanvasCamera as Camera } from "./render/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/** Matched clay of the actual neutral digit before and after its nail. */
export namespace FamilyConicNeutralNailCapture {
  /** Hold the anatomy and camera fixed for each full and close comparison. */
  export async function write(
    out: string,
    made: IAutoMovieHumanDigitNails.IMade,
    exterior: Join.IExterior,
    frame: IAutoMovieHumanNail.IFrame,
  ) {
    const name: string = made.original.name;
    const { positions, indices } = Capture.realize(made.original).mesh;
    const colour: N.Mesh["colour"] = [0.64, 0.65, 0.67];
    const original: N.Mesh = { id: name, positions, indices, colour };
    const candidate: N.Mesh[] = Capture.shades(
      exterior,
      made.nail.plate.name,
      colour,
    );
    const lateral: N.Point | null = Vec.unit(
      Vec.cross(frame.dorsal, frame.distal),
    );
    if (lateral === null)
      throw new Error("The neutral nail camera is singular");
    const clay: N.Point[] = Camera.indexedPoints([original, ...candidate]);
    const close: N.Point[] = [
      ...Camera.indexedPoints([candidate[1]!]),
      Vec.scale(frame.origin, 1 / 1000),
    ];
    const results = [];
    for (const [view, back] of [
      ["dorsal", frame.dorsal],
      ["lateral", lateral],
    ] as const)
      for (const [crop, points] of [
        ["clay", clay],
        ["close", close],
      ] as const) {
        const camera: N.Camera = Camera.fitAnnotated(
          `${view}.${crop}`,
          back,
          frame.distal,
          points,
          600,
          600,
        );
        const files = [];
        for (const [label, meshes] of [
          ["original", [original]],
          ["attached", candidate],
        ] as const)
          files.push(
            await Frame.write(
              null,
              out,
              `${name}.${camera.name}.${label}.png`,
              camera,
              [...meshes],
              [],
              "depth",
              "Neutral distal nail study",
              label,
              name,
              undefined,
              label === "original"
                ? "Actual neutral source"
                : "Neutral source with nail",
            ),
          );
        results.push({ camera, files });
      }
    return results;
  }
}

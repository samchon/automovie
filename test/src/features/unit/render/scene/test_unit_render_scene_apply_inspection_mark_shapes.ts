import type { IAutoMovieMark } from "@automovie/interface";
import {
  type IAutoMovieInspectionHandle,
  applyAutoMovieInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";
import type { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import type { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";

import { InspectionScene } from "../../../internal/InspectionScene";
import { compileMaterialShaderSource } from "../../../internal/compileMaterialShaderSource";

/**
 * Each of the four mark shapes is built into screen-space line and point
 * objects at the given positions, in its kind's colour, at the requested width,
 * and a malformed mark is refused.
 *
 * Scenarios:
 *
 * 1. An open and a closed polyline, two segments and one arrow in world space give
 *    one line object of two, three, two and five segments at the authored ends,
 *    the arrow's head four lines from its tip back a quarter of its length and
 *    out an eighth on two perpendicular axes, every segment in its kind's
 *    colour, a line material four pixels wide whose resolution is the size
 *    `resize` was given; two points give one points object at the authored
 *    places, twelve pixels across and not attenuated.
 * 2. A polyline of one place, segments of an odd count of ends, arrows with more
 *    origins than vectors, coordinates that are not triples, a non-finite
 *    coordinate and a points mark without a point are each refused naming the
 *    mark's path, leaving the scene's children as they were.
 * 3. Without x-ray the line shader is patched to lead both ends toward the eye
 *    after they reach view space, and the points shader after its projection;
 *    with x-ray neither is patched.
 */
export function test_unit_render_scene_apply_inspection_mark_shapes(): void {
  // 1. Every shape.
  const marks: IAutoMovieMark[] = [
    InspectionScene.mark("wire/trace", "trace", 0x112233, {
      type: "polyline",
      points: [0, 0, 0, 1, 0, 0, 1, 1, 0],
      closed: false,
    }),
    InspectionScene.mark("wire/ring", "ring", 0x445566, {
      type: "polyline",
      points: [0, 0, 1, 1, 0, 1, 0, 1, 1],
      closed: true,
    }),
    InspectionScene.mark("wire/pieces", "pieces", 0x778899, {
      type: "segments",
      points: [0, 0, 2, 0, 1, 2, 5, 5, 5, 6, 5, 5],
    }),
    InspectionScene.mark("wire/push", "push", 0xaabbcc, {
      type: "arrows",
      origins: [0, 0, 0],
      vectors: [2, 0, 0],
    }),
    InspectionScene.mark("wire/places", "places", 0x13579b, {
      type: "points",
      points: [1, 2, 3, -1, -2, -3],
    }),
  ];
  const stage: THREE.Scene = InspectionScene.scene(
    InspectionScene.quad("panel"),
  );
  const handle: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: stage,
    request: InspectionScene.ask({
      marks: ["trace", "ring", "pieces", "push", "places"],
      stroke: 4,
    }),
    marks,
  });
  const lines: LineSegments2[] = InspectionScene.strokes(stage);
  TestValidator.equals("one line object", lines.length, 1);
  const ends: number[] = InspectionScene.segments(lines[0]!).flat();
  InspectionScene.close(
    "every segment end",
    ends,
    [
      // open polyline
      0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0,
      // closed polyline
      0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1,
      // segments
      0, 0, 2, 0, 1, 2, 5, 5, 5, 6, 5, 5,
      // arrow: shaft, then the head
      0, 0, 0, 2, 0, 0, 2, 0, 0, 1.5, 0, 0.25, 2, 0, 0, 1.5, 0, -0.25, 2, 0, 0,
      1.5, -0.25, 0, 2, 0, 0, 1.5, 0.25, 0,
    ],
  );
  TestValidator.equals(
    "every segment takes its kind's colour",
    InspectionScene.colors(lines[0]!),
    [
      ...new Array<number>(2).fill(0x112233),
      ...new Array<number>(3).fill(0x445566),
      ...new Array<number>(2).fill(0x778899),
      ...new Array<number>(5).fill(0xaabbcc),
    ],
  );
  handle.resize(640, 360);
  TestValidator.equals(
    "the line is four pixels wide at the resized target",
    [
      InspectionScene.material(lines[0]!).linewidth,
      InspectionScene.material(lines[0]!).worldUnits,
      InspectionScene.material(lines[0]!).resolution.toArray(),
    ],
    [4, false, [640, 360]],
  );
  const places: THREE.Points[] = InspectionScene.dots(stage);
  TestValidator.equals(
    "two points in their kind's colour",
    InspectionScene.points(places[0]!),
    [
      { at: [1, 2, 3], color: 0x13579b },
      { at: [-1, -2, -3], color: 0x13579b },
    ],
  );
  const dot: THREE.PointsMaterial = places[0]!.material as THREE.PointsMaterial;
  TestValidator.equals(
    "a point is three strokes across and not attenuated",
    [places.length, dot.size, dot.sizeAttenuation],
    [1, 12, false],
  );
  handle.restore();

  // 2. Malformed marks.
  const malformed: [string, IAutoMovieMark.Shape][] = [
    ["one place", { type: "polyline", points: [0, 0, 0], closed: false }],
    ["odd ends", { type: "segments", points: [0, 0, 0, 1, 0, 0, 2, 0, 0] }],
    [
      "more origins",
      { type: "arrows", origins: [0, 0, 0, 1, 1, 1], vectors: [1, 0, 0] },
    ],
    ["not triples", { type: "points", points: [0, 0] }],
    ["no point", { type: "points", points: [] }],
  ];
  for (const [title, shape] of malformed) {
    const before: number = stage.children.length;
    try {
      applyAutoMovieInspection({
        scene: stage,
        request: InspectionScene.ask({ marks: ["bad"] }),
        marks: [InspectionScene.mark(`odd/${title}`, "bad", 0x123456, shape)],
      });
      TestValidator.predicate(`${title} is refused`, false);
    } catch (error) {
      TestValidator.predicate(
        `${title} is refused naming the mark`,
        error instanceof Error && error.message.includes(`odd/${title}`),
      );
    }
    TestValidator.equals(
      `${title} leaves the scene`,
      stage.children.length,
      before,
    );
  }

  // 3. Depth lead.
  const compiled: (xray: boolean) => string[] = (xray: boolean): string[] => {
    const scene: THREE.Scene = InspectionScene.scene();
    const applied: IAutoMovieInspectionHandle = applyAutoMovieInspection({
      scene,
      request: InspectionScene.ask({ marks: ["**"], xray }),
      marks: [marks[0]!, marks[4]!],
    });
    const line: LineMaterial = InspectionScene.strokes(scene)[0]!.material;
    const out: string[] = [
      compileMaterialShaderSource(line, line).vertexShader,
      compileMaterialShaderSource(
        InspectionScene.dots(scene)[0]!.material,
        THREE.ShaderLib.points,
      ).vertexShader,
    ];
    applied.restore();
    return out;
  };
  const [line, points]: string[] = compiled(false);
  TestValidator.predicate(
    "the line shader leads both ends toward the eye",
    line!.includes("start.xyz -= ( isOrthographic") &&
      line!.includes("end.xyz -= ( isOrthographic") &&
      line!.indexOf("start.xyz -=") >
        line!.indexOf("vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );"),
  );
  TestValidator.predicate(
    "the points shader leads its position after projection",
    points!.includes("mvPosition.xyz -= ( isOrthographic"),
  );
  TestValidator.predicate(
    "x-ray shaders are not patched",
    compiled(true).every(
      (text: string): boolean => !text.includes("isOrthographic ?"),
    ),
  );
}

import { parseAutoMovieInspectionView } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `parseAutoMovieInspectionView` reads the film camera, a fixed camera
 * "x,y,z:tx,ty,tz" with `@ortho=<m>` and `@up=x,y,z`, or a named view with
 * `@ortho`, `@follow`, `@focus=<pattern>` and `@flagged`.
 *
 * Scenarios:
 *
 * 1. "film" is the film camera.
 * 2. "0,5,0:0,0,0@up=0,0,-1@ortho=0.004" is a fixed camera from (0, 5, 0) to the
 *    origin with 0.004 m per pixel and up (0, 0, -1).
 * 3. "front@flagged@ortho" is front, orthographic, focused on findings;
 *    "right@follow@focus=hero/arm/*" focuses on that pattern.
 * 4. Refused: an empty view, a non-number or overflowing coordinate, a short
 *    triple, a camera at its target, a zero or blank scale, an up along the
 *    sight or not a number, a repeated switch, both focus switches, a fixed
 *    switch on a name and "film@ortho".
 */
export function test_render_scene_parse_inspection_view(): void {
  TestValidator.equals("film", parseAutoMovieInspectionView("film"), {
    type: "film",
  });
  TestValidator.equals(
    "a fixed camera",
    parseAutoMovieInspectionView("0,5,0:0,0,0@up=0,0,-1@ortho=0.004"),
    {
      type: "fixed",
      position: { x: 0, y: 5, z: 0 },
      target: { x: 0, y: 0, z: 0 },
      metresPerPixel: 0.004,
      up: { x: 0, y: 0, z: -1 },
    },
  );
  TestValidator.equals(
    "a named view",
    parseAutoMovieInspectionView("front@flagged@ortho"),
    {
      type: "named",
      name: "front",
      orthographic: true,
      follow: false,
      focus: { type: "flagged" },
    },
  );
  TestValidator.equals(
    "a focus pattern",
    parseAutoMovieInspectionView("right@follow@focus=hero/arm/*"),
    {
      type: "named",
      name: "right",
      orthographic: false,
      follow: true,
      focus: { type: "pattern", pattern: "hero/arm/*" },
    },
  );
  for (const text of [
    "",
    "a,0,0:0,0,0",
    "1e999,0,0:0,0,0",
    "0,0:0,0,0",
    "1,1,1:1,1,1",
    "0,5,0:0,0,0@ortho=0",
    "0,5,0:0,0,0@ortho=",
    "0,5,0:0,0,0@up=0,1,0",
    "0,5,0:0,0,0@up=x,0,1",
    "front@ortho@ortho",
    "front@flagged@focus=a",
    "front@up=0,1,0",
    "film@ortho",
  ])
    TestValidator.error(`"${text}" is refused`, (): unknown =>
      parseAutoMovieInspectionView(text),
    );
}

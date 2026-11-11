import type { IAutoMovieConstructionCurve } from "@automovie/engine";
import {
  type IAutoMovieInspectionHandle,
  type IAutoMovieSceneRaster,
  type IAutoMovieViewerSubjectBounds,
  applyAutoMovieInspection,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionStage } from "../internal/InspectionStage";

/**
 * An inspection applied to a scene isolates what its request selects, shades
 * it, marks its curves and defects, and reports what the colours mean.
 *
 * Scenarios:
 *
 * 1. Of two quads, `parts` naming one draws only that one and frames its
 *    box, `hide` naming one draws only the other, `hide` wins over `parts`,
 *    and a child named by `parts` is drawn while its unselected parent is
 *    not.
 * 2. With surfaces off a quad disappears while its asked section curve is
 *    drawn in the section colour and its unasked guide curve is not, the
 *    curve follows the quad after an update, a curve named by `parts` is
 *    drawn without its surface, and with surfaces on the curve is drawn over
 *    the quad it lies on.
 * 3. The clay shade draws a quad in the clay grey under full ambient light
 *    and darker under half, and the faces shade draws a front in grey and a
 *    back in maroon with a legend counting the shaded surfaces that are
 *    selected and visible, and with `wire` draws the edges of a quad turned
 *    away in the front grey around an empty interior.
 * 4. Asking for open edges on a quad draws its four boundary edges in the
 *    open colour with a legend counting four, the marks follow the quad
 *    after an update, a kind that is not found adds no legend entry, and the
 *    marks are gone after the restore.
 * 5. The pose shade on a quad and two bones, with `parts` naming the quad,
 *    draws the link between the bones over black in place of the quad, the
 *    link and the bounds follow a moved bone after an update, and the restore
 *    draws the quad again.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Applies the public inspection to actual three.js scenes and reads the rasterizer's pixels and the handle's legend, selection and bounds.
 * @evidence contracts/development/testing.md#independent-expectations Expected pixels follow from authored positions and sizes under the stage's fixed camera and from the documented palette, and expected legends from the authored curves and the quad's four boundary edges.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts selected against unselected objects, a child against its parent, asked against unasked curves, surfaces off against on, two light levels, front against back, a wire edge against the interior it leaves, a defect kind that is found against one that is not, and a bone link before a move against after it. What an inspection changes through materials and puts back belongs to `test_viewer_inspection_restore`.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scenes on the shared `InspectionStage` fixture and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Of two quads, parts naming one draws only that one and frames its box).
 */
export function test_viewer_inspection_apply(): void {
  const red: number[] = InspectionStage.RED;
  const green: number[] = InspectionStage.GREEN;
  const blue: number[] = InspectionStage.BLUE;

  // 1. Isolation.
  const [duo]: [THREE.Scene, THREE.Mesh, THREE.Mesh] = InspectionStage.pair();
  TestValidator.equals(
    "both quads are drawn at first",
    InspectionStage.sides(duo),
    [red, green],
  );
  const only: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: duo,
    request: InspectionStage.ask({ parts: ["left"] }),
  });
  TestValidator.equals(
    "parts draws the named quad alone",
    InspectionStage.sides(duo),
    [red, blue],
  );
  TestValidator.equals("and selects its path", only.selected, ["left"]);
  const framed: IAutoMovieViewerSubjectBounds | null = only.bounds();
  TestValidator.predicate(
    `the bounds are the named quad's box: ${JSON.stringify(framed)}`,
    framed !== null &&
      [
        framed.min.x + 1.7,
        framed.min.y + 0.5,
        framed.min.z,
        framed.max.x + 0.7,
        framed.max.y - 0.5,
        framed.max.z,
      ].every((error: number): boolean => Math.abs(error) <= 1e-9),
  );
  only.restore();
  TestValidator.equals(
    "both quads are drawn again",
    InspectionStage.sides(duo),
    [red, green],
  );
  const without: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: duo,
    request: InspectionStage.ask({ hide: ["left"] }),
  });
  TestValidator.equals(
    "hide draws the other quad alone",
    InspectionStage.sides(duo),
    [blue, green],
  );
  TestValidator.equals("and selects the other path", without.selected, [
    "right",
  ]);
  without.restore();
  const narrowed: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: duo,
    request: InspectionStage.ask({ parts: ["*t"], hide: ["right"] }),
  });
  TestValidator.equals("hide wins over parts", InspectionStage.sides(duo), [
    red,
    blue,
  ]);
  TestValidator.equals("in the selection too", narrowed.selected, ["left"]);
  narrowed.restore();
  const body: THREE.Mesh = InspectionStage.quad("body", 0xff0000, -1.2, 1);
  body.add(InspectionStage.quad("hand", 0x00ff00, 2.4, 1));
  const limbs: THREE.Scene = InspectionStage.scene(body);
  const child: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: limbs,
    request: InspectionStage.ask({ parts: ["hand"] }),
  });
  TestValidator.equals(
    "a selected child is drawn without its unselected parent",
    InspectionStage.sides(limbs),
    [blue, green],
  );
  TestValidator.equals("under its own path", child.selected, ["body/hand"]);
  child.restore();
  const whole: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: limbs,
    request: InspectionStage.ask({ parts: ["body"] }),
  });
  TestValidator.equals(
    "a selected parent brings what is beneath it",
    [InspectionStage.sides(limbs), whole.selected],
    [
      [red, green],
      ["body", "body/hand"],
    ],
  );
  whole.restore();

  // 2. Surfaces off and construction curves: a 1 m ring whose top edge is pixel row 26, and a rail on pixel row 40.
  const ring: IAutoMovieConstructionCurve = InspectionStage.curve(
    "ring",
    "section",
    true,
    [-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0],
  );
  const rail: IAutoMovieConstructionCurve = InspectionStage.curve(
    "rail",
    "guide",
    false,
    [-0.5, -0.8, 0, 0.5, -0.8, 0],
  );
  const panel: THREE.Mesh = InspectionStage.quad("panel", 0xff0000);
  const form: THREE.Scene = InspectionStage.scene(panel);
  const bare: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: form,
    request: InspectionStage.ask({ surface: false, curves: ["section"] }),
    constructions: [{ parent: panel, curves: [ring, rail] }],
  });
  const lines: number[][] = InspectionStage.column(form, [26, 32, 40]);
  InspectionStage.near(
    "the asked section curve is drawn",
    lines[0]!,
    [89, 160, 244],
  );
  TestValidator.equals(
    "the surface and the unasked guide curve are not",
    lines.slice(1),
    [blue, blue],
  );
  TestValidator.equals("the legend counts the drawn curve", bare.legend, [
    { label: "section curve", color: 0x59a0f4, count: 1 },
  ]);
  TestValidator.equals("objects are selected before curves", bare.selected, [
    "panel",
    "panel/ring",
    "panel/rail",
  ]);
  panel.position.y = 0.5;
  bare.update();
  const raised: number[][] = InspectionStage.column(form, [20, 26]);
  InspectionStage.near(
    "after an update the curve follows the quad",
    raised[0]!,
    [89, 160, 244],
  );
  TestValidator.equals("and has left its old row", raised[1]!, blue);
  bare.restore();
  panel.position.y = 0;
  const lone: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: form,
    request: InspectionStage.ask({
      parts: ["rail"],
      curves: ["section", "guide"],
    }),
    constructions: [{ parent: panel, curves: [ring, rail] }],
  });
  const picked: number[][] = InspectionStage.column(form, [26, 32, 40]);
  InspectionStage.near(
    "a curve named by parts is drawn",
    picked[2]!,
    [89, 203, 137],
  );
  TestValidator.equals(
    "without its surface or its sibling curve",
    [picked[0]!, picked[1]!, lone.selected, lone.legend],
    [
      blue,
      blue,
      ["panel/rail"],
      [{ label: "guide curve", color: 0x59cb89, count: 1 }],
    ],
  );
  lone.restore();
  const over: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: form,
    request: InspectionStage.ask({ curves: ["section"] }),
    constructions: [{ parent: panel, curves: [ring, rail] }],
  });
  const laid: number[][] = InspectionStage.column(form, [26, 32]);
  InspectionStage.near(
    "a curve on a drawn surface is drawn over it",
    laid[0]!,
    [89, 160, 244],
  );
  TestValidator.equals("and the surface is drawn around it", laid[1]!, red);
  over.restore();

  // 3. Clay and faces shades.
  const clay = (intensity: number): number[] => {
    const lit: THREE.Scene = InspectionStage.scene(
      InspectionStage.quad("slab", 0xff0000),
      new THREE.AmbientLight(0xffffff, intensity),
    );
    const handle: IAutoMovieInspectionHandle = applyAutoMovieInspection({
      scene: lit,
      request: InspectionStage.ask({ shade: "clay" }),
    });
    const pixel: number[] = InspectionStage.at(
      InspectionStage.draw(lit),
      32,
      32,
    );
    handle.restore();
    return pixel;
  };
  InspectionStage.near(
    "clay under full ambient light is the clay grey",
    clay(Math.PI),
    [189, 189, 189],
    2,
  );
  InspectionStage.near(
    "clay under half the light is darker",
    clay(Math.PI / 2),
    [138, 138, 138],
    2,
  );
  const [faced, front, back]: [THREE.Scene, THREE.Mesh, THREE.Mesh] =
    InspectionStage.pair();
  back.rotation.y = Math.PI;
  const unseen: THREE.Mesh = InspectionStage.quad("unseen", 0xffffff, 0, 1);
  unseen.visible = false;
  faced.add(unseen);
  const authored: THREE.Material | THREE.Material[] = front.material;
  const faces: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: faced,
    request: InspectionStage.ask({ shade: "faces" }),
  });
  const shaded: number[][] = InspectionStage.sides(faced);
  InspectionStage.near(
    "a front is drawn in the front grey",
    shaded[0]!,
    [176, 176, 176],
  );
  InspectionStage.near(
    "a back is drawn in the back maroon",
    shaded[1]!,
    [139, 26, 26],
  );
  TestValidator.equals(
    "the legend counts the visible shaded surfaces",
    faces.legend,
    [
      { label: "surface front", color: 0xb0b0b0, count: 2 },
      { label: "surface back", color: 0x8b1a1a, count: 2 },
    ],
  );
  TestValidator.predicate(
    "the shade replaces the material while applied",
    front.material !== authored,
  );
  faces.restore();
  TestValidator.predicate(
    "and gives the authored material back",
    front.material === authored,
  );
  const partial: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: faced,
    request: InspectionStage.ask({ shade: "faces", parts: ["left"] }),
  });
  TestValidator.equals(
    "the legend counts only selected surfaces",
    partial.legend.map((entry: { count: number }): number => entry.count),
    [1, 1],
  );
  partial.restore();
  const hollow: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: faced,
    request: InspectionStage.ask({ shade: "faces", surface: false }),
  });
  TestValidator.equals(
    "with surfaces off there is no surface legend",
    hollow.legend,
    [],
  );
  hollow.restore();
  // A quad turned away whose top edge is pixel row 20.
  const turned: THREE.Mesh = InspectionStage.quad("turned", 0xff0000, 0, 2.075);
  turned.rotation.y = Math.PI;
  const edged: THREE.Scene = InspectionStage.scene(turned);
  const wired: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: edged,
    request: InspectionStage.ask({ shade: "faces", wire: true }),
  });
  const border: number[][] = InspectionStage.column(edged, [20, 26]);
  InspectionStage.near(
    "a wire edge of a surface turned away is drawn in the front grey",
    border[0]!,
    [176, 176, 176],
  );
  TestValidator.equals("around an empty interior", border[1]!, blue);
  wired.restore();

  // 4. Defect marks.
  const open: THREE.Mesh = InspectionStage.quad("open", 0xffffff);
  const torn: THREE.Scene = InspectionStage.scene(open);
  const marks: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: torn,
    request: InspectionStage.ask({ defects: ["open"] }),
  });
  TestValidator.equals("a quad has four open edges", marks.legend, [
    { label: "open edge", color: 0xff3b30, count: 4 },
  ]);
  TestValidator.equals(
    "the marks are one more child of the scene",
    torn.children.length,
    2,
  );
  const edges: IAutoMovieSceneRaster = InspectionStage.draw(torn);
  InspectionStage.near(
    "the top edge is marked",
    InspectionStage.at(edges, 32, 20),
    [255, 59, 48],
  );
  InspectionStage.near(
    "the left edge is marked",
    InspectionStage.at(edges, 20, 32),
    [255, 59, 48],
  );
  TestValidator.equals(
    "the surface between is unmarked",
    InspectionStage.at(edges, 32, 32),
    [255, 255, 255],
  );
  open.position.x = 0.5;
  marks.update();
  const moved: IAutoMovieSceneRaster = InspectionStage.draw(torn);
  InspectionStage.near(
    "after an update the left edge mark has moved",
    InspectionStage.at(moved, 26, 32),
    [255, 59, 48],
  );
  TestValidator.equals(
    "and has left its old column",
    InspectionStage.at(moved, 20, 32),
    blue,
  );
  marks.restore();
  TestValidator.equals(
    "the restore removes the marks",
    [
      torn.children.length,
      InspectionStage.at(InspectionStage.draw(torn), 32, 20),
    ],
    [1, blue],
  );
  const absent: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: torn,
    request: InspectionStage.ask({ defects: ["degenerate"] }),
  });
  TestValidator.equals(
    "a kind that is not found adds no entry",
    absent.legend,
    [],
  );
  absent.restore();

  // 5. Pose: a hip bone on pixel (32, 32) and a knee bone a metre above it, so their link runs up the middle column.
  const hip: THREE.Bone = new THREE.Bone();
  hip.position.set(0.05, -0.05, 0);
  const knee: THREE.Bone = new THREE.Bone();
  knee.position.set(0, 1, 0);
  hip.add(knee);
  const rigged: THREE.Scene = InspectionStage.scene(
    InspectionStage.quad("skin", 0xff0000),
    hip,
  );
  const posed: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene: rigged,
    request: InspectionStage.ask({ shade: "pose", parts: ["skin"] }),
  });
  const standing: IAutoMovieSceneRaster = InspectionStage.draw(rigged);
  TestValidator.equals(
    "the pose shade draws the bone link whatever parts names",
    InspectionStage.at(standing, 32, 26),
    [255, 255, 255],
  );
  TestValidator.equals(
    "over black in place of the quad",
    InspectionStage.at(standing, 26, 38),
    [0, 0, 0],
  );
  knee.position.set(1, 0, 0);
  posed.update();
  const bent: IAutoMovieSceneRaster = InspectionStage.draw(rigged);
  TestValidator.equals(
    "after an update the link follows the moved bone",
    [InspectionStage.at(bent, 38, 32), InspectionStage.at(bent, 32, 26)],
    [
      [255, 255, 255],
      [0, 0, 0],
    ],
  );
  const reach: IAutoMovieViewerSubjectBounds | null = posed.bounds();
  TestValidator.predicate(
    `and the bounds are the moved link's: ${JSON.stringify(reach)}`,
    reach !== null &&
      [
        reach.min.x - 0.05,
        reach.min.y + 0.05,
        reach.min.z,
        reach.max.x - 1.05,
        reach.max.y + 0.05,
        reach.max.z,
      ].every((error: number): boolean => Math.abs(error) <= 1e-6),
  );
  posed.restore();
  TestValidator.equals(
    "the restore draws the quad again",
    InspectionStage.at(InspectionStage.draw(rigged), 38, 32),
    red,
  );
}

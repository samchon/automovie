import type { IAutoMovieMark } from "@automovie/engine";
import { applyAutoMovieInspection } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * Two kinds in one picture never share a colour and no kind takes a colour the picture reserves: a clash is refused naming both, before the scene changes, and a clash between kinds that are not drawn together is no clash.
 *
 * Scenarios:
 *
 * 1. Kinds `joint` and `contact` in one colour are refused, and the message names both kinds and the colour.
 * 2. The same two kinds with only `joint` asked are accepted, because only one is drawn.
 * 3. A kind in the flag colour is refused naming the flag; a kind in the clay grey is refused under the clay shade naming it and accepted under the beauty shade; a kind in the faces shade's back colour is refused under that shade.
 * 4. Two marks of one kind that disagree on colour or label are refused naming the kind.
 * 5. A supplied kind in a measured kind's colour, the open edge red, is refused when both are drawn.
 * 6. Every refusal leaves the scene's children and the quad's material as they were.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Applies the public inspection with marks whose colours collide and reads the refusal messages and the scene's children and material.
 * @evidence contracts/development/testing.md#independent-expectations The reserved colours are the palette's documented values, and the expected refusals follow from the colour law the inspection documents.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts kinds drawn together against kinds of which one is drawn, each reserved colour under the shade that reserves it against a shade that does not, a kind against itself, and supplied against measured kinds. A flagged mark's own colour belongs to `test_inspection_mark_flag`.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scene and marks and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Kinds joint and contact in one colour are refused, and the message names both kinds and the colour).
 */
export function test_inspection_mark_color_law(): void {
  const panel: THREE.Mesh = InspectionScene.quad("panel");
  const material: THREE.Material | THREE.Material[] = panel.material;
  const stage: THREE.Scene = InspectionScene.scene(panel);
  const dot = (
    path: string,
    kind: string,
    color: number,
    label: string = kind,
  ): IAutoMovieMark =>
    InspectionScene.mark(
      path,
      kind,
      color,
      { type: "points", points: [0, 0, 0] },
      { label },
    );
  const refused = (
    title: string,
    marks: IAutoMovieMark[],
    changes: Parameters<typeof InspectionScene.ask>[0],
    named: string[],
  ): void => {
    try {
      applyAutoMovieInspection({
        scene: stage,
        request: InspectionScene.ask(changes),
        marks,
      });
      TestValidator.predicate(`${title} is refused`, false);
    } catch (error) {
      const message: string = error instanceof Error ? error.message : "";
      TestValidator.predicate(
        `${title} is refused naming ${named.join(", ")}: ${message}`,
        named.every((name: string): boolean => message.includes(name)),
      );
    }
    TestValidator.predicate(
      `${title} leaves the scene`,
      stage.children.length === 1 && panel.material === material,
    );
  };
  const accepted = (
    marks: IAutoMovieMark[],
    changes: Parameters<typeof InspectionScene.ask>[0],
  ): void => {
    applyAutoMovieInspection({
      scene: stage,
      request: InspectionScene.ask(changes),
      marks,
    }).restore();
  };

  // 1. Two kinds, one colour.
  const pair: IAutoMovieMark[] = [
    dot("panel/knee", "joint", 0x123456),
    dot("panel/push", "contact", 0x123456),
  ];
  refused("two kinds in one colour", pair, { marks: ["joint", "contact"] }, [
    "joint",
    "contact",
    "123456",
  ]);

  // 2. Only one of them drawn.
  accepted(pair, { marks: ["joint"] });

  // 3. Reserved colours.
  refused(
    "the flag colour",
    [dot("panel/knee", "joint", 0xff00ff)],
    { marks: ["joint"] },
    ["joint", "flag"],
  );
  refused(
    "the clay grey under clay",
    [dot("panel/knee", "joint", 0xbdbdbd)],
    { marks: ["joint"], shade: "clay" },
    ["joint", "clay"],
  );
  accepted([dot("panel/knee", "joint", 0xbdbdbd)], { marks: ["joint"] });
  refused(
    "the back colour under faces",
    [dot("panel/knee", "joint", 0x8b1a1a)],
    { marks: ["joint"], shade: "faces" },
    ["joint", "back"],
  );

  // 4. One kind, two entries.
  refused(
    "one kind in two colours",
    [dot("panel/a", "joint", 0x111111), dot("panel/b", "joint", 0x222222)],
    { marks: ["joint"] },
    ["joint"],
  );
  refused(
    "one kind under two labels",
    [
      dot("panel/a", "joint", 0x111111, "knee"),
      dot("panel/b", "joint", 0x111111, "elbow"),
    ],
    { marks: ["joint"] },
    ["joint"],
  );

  // 5. A supplied kind against a measured one.
  refused(
    "a supplied kind in the open edge red",
    [dot("panel/knee", "joint", 0xff3b30)],
    { marks: ["joint", "defect/open"] },
    ["joint", "defect/open"],
  );
}

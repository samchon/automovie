import { TestValidator } from "@nestia/e2e";

import { FigurePoster } from "../../src/baked/FigurePoster";
import { PropShapes } from "../../src/baked/PropShapes";
import type { IPlaygroundRefusal } from "../../src/playground/structures/IPlaygroundRefusal";
import { SCENES } from "../../src/scenes/SCENES";
import type { IScene } from "../../src/scenes/structures/IScene";
import { TakeCompute } from "../../src/takes/package/TakeCompute";
import type { ITake } from "../../src/takes/structures/ITake";

/**
 * A still is a fixed drawing of its take: the same take gives the same text,
 * every performer is drawn in its own colour, and a placed prop is outlined.
 *
 * Scenarios:
 * 1. The dance circle's still is an SVG of the poster's size on the viewport ground, and drawing it twice gives the same text.
 * 2. Each of its three performers' colours is in the still, so the key pose draws every figure.
 * 3. A scene that places objects outlines each object's meshes as closed paths in their own colours, and the still without the shapes has none of those paths.
 */
export function test_website_figure_poster(): void {
  const take = (id: string): { scene: IScene; take: ITake } => {
    const scene: IScene = SCENES.find((s: IScene): boolean => s.id === id)!;
    const made: ITake | IPlaygroundRefusal = TakeCompute.take(scene.composition!, 6);
    if (!("track" in made)) throw new Error(`${id} was refused: ${made.message}`);
    return { scene, take: made };
  };

  // 1. A fixed SVG.
  const dance = take("dance-circle");
  const still: string = FigurePoster.draw(dance.take, { view: dance.scene.camera.view });
  TestValidator.predicate(
    "an SVG of the poster's size on the viewport ground",
    still.startsWith(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FigurePoster.WIDTH} ${FigurePoster.HEIGHT}"`,
    ) && still.includes(`fill="${FigurePoster.COLOUR.ground}"`),
  );
  TestValidator.equals(
    "the same take draws the same still",
    FigurePoster.draw(dance.take, { view: dance.scene.camera.view }),
    still,
  );

  // 2. Every performer in its colour.
  TestValidator.predicate(
    "each performer's colour",
    FigurePoster.COLOUR.figures
      .slice(0, dance.take.figures.length)
      .every((colour: string): boolean => still.includes(`stroke="${colour}"`)),
  );

  // 3. Props outlined.
  const placed = take("stuck-sled");
  const shapes: PropShapes.IShape[] = PropShapes.of(placed.scene.composition!.objects ?? []);
  TestValidator.predicate(
    "the scene places objects with meshes",
    shapes.length !== 0 && shapes.every((s: PropShapes.IShape): boolean => s.parts.length !== 0),
  );
  const outlined: string = FigurePoster.draw(placed.take, {
    view: placed.scene.camera.view,
    props: shapes,
  });
  const bare: string = FigurePoster.draw(placed.take, { view: placed.scene.camera.view });
  const closed = (text: string): number => (text.match(/Z" fill="#/g) ?? []).length;
  TestValidator.predicate(
    "outlined meshes are closed filled paths",
    closed(outlined) > 0 && closed(bare) === 0,
  );
}

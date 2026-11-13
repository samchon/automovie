// The bake's check: plan without posing, and list what the packages refuse.
import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import type { IPlaygroundComposition } from "../src/playground/structures/IPlaygroundComposition";
import { SCENES } from "../src/scenes/SCENES";
import { SceneTake } from "../src/scenes/SceneTake";
import { SceneStatus } from "../src/scenes/package/SceneStatus";
import { BakeSetup } from "./BakeSetup";

/** Planning the scenes, or single actions, without posing them. */
export namespace BakeCheck {
  const { options } = BakeSetup;

  /** Plan each named action alone on one standing person with no parameters, and say whether the package plans it, refuses it in its own words, or fails in its code. */
  const rows = (): void => {
    for (const name of options.rows) {
      const composition: IPlaygroundComposition = {
        version: 1,
        seed: "row",
        performers: [
          {
            subject: "a",
            body: "m1",
            x: 0,
            z: 0,
            yaw: 0,
            proficiency: "trained",
            actions: [
              { name: "stand", params: { seconds: 0.3 } },
              { name, params: {} },
            ],
          },
        ],
        mutuals: [],
      };
      try {
        PlaygroundPerformance.build(composition);
        console.log(`${name}: plans`);
      } catch (error) {
        const refusal: boolean =
          typeof error === "object" && error !== null && "axis" in error;
        console.log(
          `${name}: ${refusal ? "refuses" : "fails in the package"}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  };

  /** Plan the first take of every scene that plays, without posing it, and list every refusal and every scene that waits. */
  export const check = (): void => {
    if (options.rows.length !== 0) return rows();
    const refused: string[] = [];
    for (const scene of SCENES) {
      if (options.only.length !== 0 && !options.only.includes(scene.id))
        continue;
      const status: SceneStatus.Status = SceneStatus.of(scene);
      if (status.kind !== "plays") {
        console.log(
          `${scene.id}: ${status.kind}${status.kind === "waits" ? ` for ${status.missing.join(", ")}` : ""}`,
        );
        continue;
      }
      const t0: number = Date.now();
      try {
        const built: PlaygroundPerformance.IBuilt = PlaygroundPerformance.build(
          SceneTake.apply(scene.composition!, scene.takes[0]!),
        );
        const planned: number = (Date.now() - t0) / 1000;

        // A few poses of each figure, spread over the film, show what posing
        // will cost and which figure costs most.
        const costs: string[] = built.figures.map(
          (figure: PlaygroundPerformance.IFigure): string => {
            const started: number = performance.now();
            for (let k: number = 1; k <= 4; k++)
              built.performance.pose(
                figure.subject,
                (built.performance.duration * k) / 5,
              );
            return `${figure.subject} ${((performance.now() - started) / 4).toFixed(0)} ms`;
          },
        );
        console.log(
          `${scene.id}: plans, ${built.performance.duration.toFixed(1)} s of film, planned in ${planned.toFixed(1)} s; a pose: ${costs.join(", ")}`,
        );
      } catch (error) {
        // Printed at once as well, so a check stopped halfway keeps its findings.
        const line: string = `${scene.id}: refused: ${error instanceof Error ? error.message : String(error)}`;
        console.log(line);
        refused.push(line);
      }
    }
    if (refused.length !== 0) throw new Error(refused.join("\n"));
  };
}

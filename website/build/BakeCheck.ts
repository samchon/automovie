// The bake's check: plan every take, pose a few frames of each scene's first
// take for their cost, and list what the packages refuse.
import { PlaygroundPerformance } from "../src/playground/package/PlaygroundPerformance";
import type { IPlaygroundComposition } from "../src/playground/structures/IPlaygroundComposition";
import { SCENES } from "../src/scenes/SCENES";
import { SceneTake } from "../src/scenes/SceneTake";
import { SceneStatus } from "../src/scenes/package/SceneStatus";
import type { IScene } from "../src/scenes/structures/IScene";
import { BakeSetup } from "./BakeSetup";

/** Planning the scenes, or single actions, without baking their tracks. */
export namespace BakeCheck {
  /** The parsed command line. */
  const options: BakeSetup.IOptions = BakeSetup.options;

  /** Plan each named action alone on one standing person with no parameters, and say whether the package plans it, refuses it in its own words, or fails in its code. */
  const rows: () => void = (): void => {
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

  /** Plan every take of every scene that plays or is marked refused, sampling the first take's poses for their cost, and list every refusal, every scene that waits, and every take of a marked scene that plans. */
  export const check: () => void = (): void => {
    if (options.rows.length !== 0) return rows();
    const refused: string[] = [];
    for (const scene of SCENES) {
      if (options.only.length !== 0 && !options.only.includes(scene.id))
        continue;
      const status: SceneStatus.Status = SceneStatus.of(scene);
      if (!SceneStatus.bakes(status)) {
        console.log(
          `${scene.id}: ${status.kind}${status.kind === "waits" ? ` for ${status.missing.join(", ")}` : ""}`,
        );
        continue;
      }
      // Every take is planned, since another seed, other bodies or other
      // skill can refuse what the scene itself plans; the first take's
      // poses are sampled for their cost.
      scene.takes.forEach((take: IScene.ITake, index: number): void => {
        const t0: number = Date.now();
        try {
          const built: PlaygroundPerformance.IBuilt =
            PlaygroundPerformance.build(
              SceneTake.apply(scene.composition!, take),
            );
          const planned: number = (Date.now() - t0) / 1000;

          // A take of a marked scene that plans is told as the bake tells it.
          if (scene.refusedUntil !== undefined)
            console.log(BakeSetup.outlived(scene, index, take.label));
          if (index !== 0) {
            console.log(
              `${scene.id} take ${index} (${take.label}): plans, planned in ${planned.toFixed(1)} s`,
            );
            return;
          }

          // A few poses of each figure, spread over the film, show what
          // posing will cost and which figure costs most.
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
          // A refusal its record expects until an issue lands is reported,
          // not counted against the check.
          if (scene.refusedUntil !== undefined) {
            console.log(
              `${scene.id}${index === 0 ? "" : ` take ${index} (${take.label})`}: refused until #${scene.refusedUntil}: ${error instanceof Error ? error.message : String(error)}`,
            );
            return;
          }
          // Printed at once as well, so a check stopped halfway keeps its findings.
          const line: string = `${scene.id}${index === 0 ? "" : ` take ${index} (${take.label})`}: refused: ${error instanceof Error ? error.message : String(error)}`;
          console.log(line);
          refused.push(line);
        }
      });
    }
    if (refused.length !== 0) throw new Error(refused.join("\n"));
  };
}

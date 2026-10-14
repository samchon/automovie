import { IHumanBuildHost } from "./IHumanBuildHost";
import { publishHumanBuild } from "./publishHumanBuild";

/**
 * Compile the ordinary Node and browser outputs in one owned stage before
 * publication.
 *
 * Failure in either pass leaves the current runtime untouched. Disposal errors
 * accompany the original failure rather than hiding it.
 */
export async function runHumanBuild(host: IHumanBuildHost): Promise<void> {
  const stage: string = host.createStage();
  const failures: unknown[] = [];
  try {
    await host.compile(stage, "node");
    await host.compile(stage, "browser");
    publishHumanBuild(host, stage);
  } catch (error) {
    failures.push(error);
  }
  try {
    host.discardStage(stage);
  } catch (error) {
    failures.push(error);
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1)
    throw new AggregateError(
      failures,
      "Human compilation or publication failed, and stage disposal also failed.",
    );
}

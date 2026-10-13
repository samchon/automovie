import { publishHumanBuild } from './publishHumanBuild.mjs';

/**
 * Compile the ordinary Node and browser outputs in one owned stage before
 * publication. Failure in either pass leaves the current runtime untouched.
 * Disposal errors accompany the original failure rather than hiding it.
 *
 * @param {import('./IHumanBuildHost').IHumanBuildHost} host
 * @returns {Promise<void>}
 *
 * @evidence contracts/common.md#principled-implementation Sequential ordinary compiler passes establish both variants before publication mutates runtime output.
 * @evidence contracts/common.md#clear-and-simple-design One stage and one publication owner define the lifetime; the host supplies compiler and filesystem effects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Compiler failures propagate without fallback to old output, and cleanup cannot replace the original diagnostic.
 */
export async function runHumanBuild(host) {
  const stage = host.createStage();
  const failures = [];
  try {
    await host.compile(stage, 'node');
    await host.compile(stage, 'browser');
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
    throw new AggregateError(failures, 'Human compilation or publication failed, and stage disposal also failed.');
}

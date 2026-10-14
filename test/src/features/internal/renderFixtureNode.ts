import type { IAutoMovieScene } from "@automovie/interface";
import { renderFixtureIdentity } from "./renderFixtureIdentity";

/**
 * One scene node borrowing the fixture's identity transform and supplied model id.
 *
 * @evidence contracts/testing.md#behavioral-verification sceneFixture stages these actual records for the existing semantic-mask, material and budget units; those tests own the assertions.
 * @evidence contracts/testing.md#independent-expectations The requested id/model and explicit null motion/pose are authored input, independent of measured render attribution or palette output.
 * @evidence contracts/testing.md#distinguishing-cases Every call creates a new node but retains the same transform object; identifiers are passed through without admission, normalization or copied model geometry.
 * @evidence contracts/testing.md#execution-ownership Internal numerical fixture helper behind existing sceneFixture consumers, with no dynamic case, Three resource or real host.
 */
export const renderFixtureNode: (id: string, model: string) => IAutoMovieScene["nodes"][number] = (id: string, model: string): IAutoMovieScene["nodes"][number] => ({
  id,
  model,
  transform: renderFixtureIdentity,
  motion: null,
  pose: null,
});

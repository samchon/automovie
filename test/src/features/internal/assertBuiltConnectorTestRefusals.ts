import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieConnectorSection,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtConnectorTestRefusalPaths as refusalPaths } from "./builtConnectorTestRefusalPaths";

/** Run the existing 23 connector mutations in authored order against fresh levels graphs.
 *
 * Each local mutation pairs an authored malformed field with its literal expected validation path. builtConnectorTestRefusalPaths owns graph construction and the actual validateBuiltEnvironment call; this part checks path membership, permitting other violations and imposing no message or diagnostic-order oracle. The discoverable connector unit calls this synchronous assertion part directly; this helper registers no tests and starts no process, renderer or native build.
 */
export const assertBuiltConnectorTestRefusals: () => void = (): void => {
  const malformed: Array<
    readonly [string, (value: IAutoMovieBuiltEnvironment) => void, string]
  > = [
    [
      "both section spellings at once",
      (value: IAutoMovieBuiltEnvironment): IAutoMovieConnectorSection[] =>
        (value.connectors[3]!.sections = [
          { at: 0, width: 1, clearHeight: 2 },
          { at: 1, width: 1, clearHeight: 2 },
        ]),
      "$input.connectors[3].sections",
    ],
    [
      "neither section spelling",
      (value: IAutoMovieBuiltEnvironment): void => {
        delete value.connectors[3]!.width;
        delete value.connectors[3]!.clearHeight;
      },
      "$input.connectors[3].width",
    ],
    [
      "a constant width with no clear height",
      (value: IAutoMovieBuiltEnvironment): boolean =>
        delete value.connectors[3]!.clearHeight,
      "$input.connectors[3].clearHeight",
    ],
    [
      "a constant clear height with no width",
      (value: IAutoMovieBuiltEnvironment): boolean =>
        delete value.connectors[3]!.width,
      "$input.connectors[3].width",
    ],
    [
      "a one-station varying section",
      (value: IAutoMovieBuiltEnvironment): IAutoMovieConnectorSection[] =>
        (value.connectors[1]!.sections = [{ at: 0, width: 1, clearHeight: 2 }]),
      "$input.connectors[1].sections",
    ],
    [
      "a varying section that does not begin at 0",
      (value: IAutoMovieBuiltEnvironment): number =>
        (value.connectors[1]!.sections![0]!.at = 0.1),
      "$input.connectors[1].sections[0].at",
    ],
    [
      "a varying section that does not end at 1",
      (value: IAutoMovieBuiltEnvironment): number =>
        (value.connectors[1]!.sections![2]!.at = 0.9),
      "$input.connectors[1].sections[2].at",
    ],
    [
      "a varying section that does not advance",
      (value: IAutoMovieBuiltEnvironment): number =>
        (value.connectors[1]!.sections![1]!.at = 0),
      "$input.connectors[1].sections[1].at",
    ],
    [
      "a non-finite section station",
      (value: IAutoMovieBuiltEnvironment): number =>
        (value.connectors[1]!.sections![1]!.at = Number.NaN),
      "$input.connectors[1].sections[1].at",
    ],
    [
      "a zero section width",
      (value: IAutoMovieBuiltEnvironment): number =>
        (value.connectors[1]!.sections![1]!.width = 0),
      "$input.connectors[1].sections[1].width",
    ],
    [
      "a zero section clear height",
      (value: IAutoMovieBuiltEnvironment): number =>
        (value.connectors[1]!.sections![1]!.clearHeight = 0),
      "$input.connectors[1].sections[1].clearHeight",
    ],
    [
      "one facing too few",
      (value: IAutoMovieBuiltEnvironment): IAutoMovieQuaternion | undefined =>
        value.connectors[0]!.orientations!.pop(),
      "$input.connectors[0].orientations",
    ],
    [
      "a facing that is not a unit quaternion",
      (value: IAutoMovieBuiltEnvironment): IAutoMovieQuaternion =>
        (value.connectors[0]!.orientations![2] = {
          x: 0,
          y: 0,
          z: 0,
          w: 0.5,
        }),
      "$input.connectors[0].orientations[2]",
    ],
    [
      "a repeated route station",
      (
        value: IAutoMovieBuiltEnvironment,
      ): IAutoMovieBuiltEnvironment["connectors"][number]["route"][number] =>
        (value.connectors[3]!.route[1] = { ...value.connectors[3]!.route[0]! }),
      "$input.connectors[3].route[1]",
    ],
    [
      "a slope outside the quarter turn",
      (value: IAutoMovieBuiltEnvironment): number =>
        (value.connectors[2]!.slope = 2),
      "$input.connectors[2].slope",
    ],
    [
      "a non-finite slope",
      (value: IAutoMovieBuiltEnvironment): number =>
        (value.connectors[2]!.slope = Number.NaN),
      "$input.connectors[2].slope",
    ],
    [
      "a slope the route contradicts",
      (value: IAutoMovieBuiltEnvironment): number =>
        (value.connectors[2]!.slope = Math.PI / 6),
      "$input.connectors[2].slope",
    ],
    [
      "a fractional step count",
      (value: IAutoMovieBuiltEnvironment): number =>
        (value.connectors[3]!.steps!.count = 15.5),
      "$input.connectors[3].steps.count",
    ],
    [
      "no steps at all",
      (value: IAutoMovieBuiltEnvironment): number =>
        (value.connectors[3]!.steps!.count = 0),
      "$input.connectors[3].steps.count",
    ],
    [
      "a zero step rise",
      (value: IAutoMovieBuiltEnvironment): number =>
        (value.connectors[3]!.steps!.rise = 0),
      "$input.connectors[3].steps.rise",
    ],
    [
      "a zero step going",
      (value: IAutoMovieBuiltEnvironment): number =>
        (value.connectors[3]!.steps!.run = 0),
      "$input.connectors[3].steps.run",
    ],
    [
      "steps that do not climb their own route",
      (value: IAutoMovieBuiltEnvironment): number =>
        (value.connectors[3]!.steps!.rise = 0.25),
      "$input.connectors[3].steps.rise",
    ],
    [
      "steps that do not run their own route",
      (value: IAutoMovieBuiltEnvironment): number =>
        (value.connectors[3]!.steps!.run = 0.35),
      "$input.connectors[3].steps.run",
    ],
  ];
  malformed.forEach(
    ([name, mutate, path]: readonly [
      string,
      (value: IAutoMovieBuiltEnvironment) => void,
      string,
    ]): void =>
      TestValidator.equals(
        `${name} is refused at ${path}`,
        refusalPaths(mutate).includes(path),
        true,
      ),
  );
};

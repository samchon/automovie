import { AutoMovieHumanHandVector } from "../AutoMovieHumanHandVector";
import { AutoMovieHumanHandMap } from "../AutoMovieHumanHandMap";

export namespace AutoMovieHumanArmLawData {
  export const {
    across,
    cross,
    dot,
    hull,
    mean,
    norm,
    scale,
    smooth,
    smoother,
    sub,
    unit,
    TWO_PI,
  }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;

  export const { handPoint }: typeof AutoMovieHumanHandMap = AutoMovieHumanHandMap;
}

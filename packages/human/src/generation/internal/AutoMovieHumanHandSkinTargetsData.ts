import { AutoMovieHumanHandMap } from "../AutoMovieHumanHandMap";
import { AutoMovieHumanHandFingers } from "../AutoMovieHumanHandFingers";
import { AutoMovieHumanHandPalm } from "../AutoMovieHumanHandPalm";
import { AutoMovieHumanHandDigitChain } from "../AutoMovieHumanHandDigitChain";
import { AutoMovieHumanHandEvents } from "../AutoMovieHumanHandEvents";
import { AutoMovieHumanHandSolve } from "../AutoMovieHumanHandSolve";

export namespace AutoMovieHumanHandSkinTargetsData {
  export const { handPoint }: typeof AutoMovieHumanHandMap = AutoMovieHumanHandMap;

  export const { digitsOf }: typeof AutoMovieHumanHandFingers =
    AutoMovieHumanHandFingers;

  export const { palmOf }: typeof AutoMovieHumanHandPalm = AutoMovieHumanHandPalm;

  export const { fingerOf }: typeof AutoMovieHumanHandDigitChain =
    AutoMovieHumanHandDigitChain;

  export const { events }: typeof AutoMovieHumanHandEvents = AutoMovieHumanHandEvents;

  export const { solve }: typeof AutoMovieHumanHandSolve = AutoMovieHumanHandSolve;
}

import type { AutoMovieArchetypeStageBladeProp } from "../AutoMovieArchetypeStageBladeProp";
import type { IAutoMovieArchetypeBand } from "../../core";
import { AutoMovieArchetypeBand } from "../../core";

/*
 * Overall display length is measured along the prop's long axis.
 */
export const UNITS: Readonly<Record<AutoMovieArchetypeStageBladeProp.Dimension, "m">> = {
  length: "m",
};

/*
 * Admitted digital display lengths.
 */
export const LENGTH: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
  0.55,
  1.45,
  "Authored digital display scale for padded blade props.",
  true,
);

/*
 * Each display profile gives its default length in metres, and the relative
 * locations and sizes of its visual features. They are authored silhouettes.
 */
export const PROFILES = {
  foil: {
    length: 0.95,
    grip: 0.17,
    shaft: 0.011,
    guard: 0.046,
    color: "#c1b1e8",
  },
  epee: {
    length: 1.02,
    grip: 0.17,
    shaft: 0.017,
    guard: 0.073,
    color: "#acd3ea",
  },
  sabre: {
    length: 0.96,
    grip: 0.17,
    shaft: 0.018,
    guard: 0.058,
    color: "#edbf9b",
  },
  shinai: {
    length: 1.16,
    grip: 0.26,
    shaft: 0.021,
    guard: 0.047,
    color: "#d6ae73",
  },
  longsword: {
    length: 1.16,
    grip: 0.24,
    shaft: 0.029,
    guard: 0.082,
    color: "#b9b3ce",
  },
} as const satisfies Record<
  AutoMovieArchetypeStageBladeProp.Kind,
  {
    length: number;
    grip: number;
    shaft: number;
    guard: number;
    color: string;
  }
>;

import type {} from "../../IAutoMovieHumanFaceHair";

/** Forward the existing IAutoMovieHumanFaceHair.Region API to its sole canonical interface without defining another field record. */
declare module "../../IAutoMovieHumanFaceHair" {
  namespace IAutoMovieHumanFaceHair {
    /** Existing qualified type name; fields and their contracts are owned by the canonical Region interface. */
    export type Region = import("../Region").Region;
  }
}

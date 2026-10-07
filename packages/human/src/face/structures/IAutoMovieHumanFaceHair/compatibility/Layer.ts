import type {} from "../../IAutoMovieHumanFaceHair";

/** Forward the existing IAutoMovieHumanFaceHair.Layer API to its sole canonical interface without defining another field record. */
declare module "../../IAutoMovieHumanFaceHair" {
  namespace IAutoMovieHumanFaceHair {
    /** Existing qualified type name; fields and their contracts are owned by the canonical Layer interface. */
    export type Layer = import("../Layer").Layer;
  }
}

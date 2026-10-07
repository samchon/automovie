import type {} from "../../IAutoMovieHumanFaceSkinRelief";

/** Forward the existing IAutoMovieHumanFaceSkinRelief.Regions API to its sole canonical interface without defining another field record. */
declare module "../../IAutoMovieHumanFaceSkinRelief" {
  namespace IAutoMovieHumanFaceSkinRelief {
    /** Existing qualified type name; fields and their contracts are owned by the canonical Regions interface. */
    export type Regions = import("../Regions").Regions;
  }
}

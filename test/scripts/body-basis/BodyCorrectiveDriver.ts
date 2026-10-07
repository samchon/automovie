import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

/** One admitted corrective driver: clinical ramp, shape channel or TT kernel. */
export type BodyCorrectiveDriver = NonNullable<IAutoMovieHumanBodyBasis["correctives"]>[number]["inputs"][number];

import type { IAutoMovieHumanArmF1Lines } from "@automovie/interface";

/*
 * Quarter shoulders in the order lateral-posterior, posterior-medial,
 * medial-anterior, anterior-lateral, held inside [0.02, 0.98].
 */
export const q = (
  lp: number,
  pm: number,
  ma: number,
  al: number,
): IAutoMovieHumanArmF1Lines.IShoulders => {
  const hold = (x: number): number => Math.min(0.98, Math.max(0.02, x));
  return {
    lateralPosterior: hold(lp),
    posteriorMedial: hold(pm),
    medialAnterior: hold(ma),
    anteriorLateral: hold(al),
  };
};

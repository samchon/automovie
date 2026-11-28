import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/**
 * Four ordered values in the ViewPart quarter layout. Guide quantities use +u,
 * +v, −u, −v. Arc quantities use the quarter beginning at each corresponding
 * guide.
 */
export type IAutoMovieQuarters<T> = IAutoMovieViewPart.IQuarters<T>;

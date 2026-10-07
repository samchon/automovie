/**
 * One endpoint of one published surface that a producer derives from the
 * edited neutral as a whole, so any of its rows may differ.
 *
 * @author Samchon
 */
export interface IHumanSourceRederivedEndpoint {
  /** Which person view holds the surface. */
  view: "head" | "body";

  /** Surface ID in that view's basis. */
  surface: string;

  /** Endpoint name. */
  endpoint: string;
}

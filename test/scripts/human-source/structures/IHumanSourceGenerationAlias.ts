/**
 * A published face control that names the same upstream macro quantity as a
 * body control and is therefore not defined a second time: `from` is the face
 * channel or corrective, `to` the body one that now owns it, `endpoints` maps
 * each face endpoint to the body endpoint at the body's node, and `note`
 * records any node the face had used differently.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationAlias {
  kind: "channel" | "corrective";
  from: string;
  to: string;
  endpoints: Record<string, string>;
  note: string;
}

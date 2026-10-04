/**
 * A named gap the generation leaves open on purpose: what is not represented,
 * how large it measured per endpoint (metres, endpoint at weight one), which
 * issues own closing it, and why no value was invented in its place.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationGap {
  subject: string;
  quantity: string;
  sizes: Record<string, number>;
  owners: string[];
  reason: string;
}

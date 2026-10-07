/**
 * One channel-side driver of a combination corrective, the part of a published
 * corrective input that identifies which combination it answers for.
 *
 * @author Samchon
 */
export interface IHumanSourceChannelSide {
  channel: string;
  side: string;
}

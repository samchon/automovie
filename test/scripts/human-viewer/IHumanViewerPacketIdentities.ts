/**
 * The identities read from a large JSON packet without parsing it.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the packet id and the member ids.
 * @author Samchon
 */
export interface IHumanViewerPacketIdentities {
  /** The packet's top-level `id`. */
  id: string;

  /** For each top-level member whose value is an object opening with an `id` string, that id. */
  members: Record<string, string>;
}

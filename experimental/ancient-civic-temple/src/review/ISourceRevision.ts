
/** Git state of the production directory. */
export interface ISourceRevision {
  /** Last commit that changed the production path. */
  commit: string;
  /** Whether the working tree differs from that commit. */
  dirty: boolean;
}

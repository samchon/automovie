/**
 * One acquired upstream source's preserved content, license and container facts.
 * The normal TS importer rechecks actual file and license bytes against the
 * pinned lock. Historical download state is retained, not newly claimed.
 *
 * @author Samchon
 */
export interface IHumanSourceAcquisitionSource {
  name: string;
  status?: string;
  downloaded?: boolean;
  archiveSha256?: string;
  contentSha256?: string;
  licenses?: Record<string, string | null>;
  archiveMatchesLock?: boolean;
}

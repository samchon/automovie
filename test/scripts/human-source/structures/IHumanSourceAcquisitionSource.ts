/** One source as `prepare-mpfb-profile.py` observed it in a work directory. */
export interface IHumanSourceAcquisitionSource {
  name: string;
  status?: string;
  downloaded?: boolean;
  archiveSha256?: string;
  contentSha256?: string;
  licenses?: Record<string, string | null>;
  archiveMatchesLock?: boolean;
}

/** Plain admitted metadata used only during one authority conversion pass. */
export interface IAutoMovieRecoveryAuthorityRecord {
  /**
   * Own plain metadata field; authority conversion checks its concrete binding
   * shape before reading geometry or identity.
   */
  [key: string]: unknown;
}

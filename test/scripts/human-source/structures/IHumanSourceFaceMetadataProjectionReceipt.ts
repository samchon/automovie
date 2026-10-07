/** Byte identity and exact preserved domains of a candidate head projection. */
export interface IHumanSourceFaceMetadataProjectionReceipt {
  generation: string;
  face: string;
  originalHeadSha256: string;
  metadataFaceSha256: string;
  preservedFaceContentSha256: string;
  outputHeadSha256: string;
  outputHeadBytes: number;
  qualification: string;
}

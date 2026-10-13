/**
 * Media type under which a guide deliverable publishes a semantic-mask sidecar.
 *
 * A mask picture is unreadable without the palette that names its colours, so
 * the sidecar travels beside the frames as its own declared medium rather than
 * as generic JSON, and the probe parses and self-verifies it like any other
 * delivered byte stream.
 */
export const AUTOMOVIE_SEMANTIC_MASK_MEDIA_TYPE =
  "application/vnd.automovie.semantic-mask+json";

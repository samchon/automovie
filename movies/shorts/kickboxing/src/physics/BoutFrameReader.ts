import type { AutoMoviePhysicalPlayback } from "@automovie/engine";

/** The public in-memory Cache and decoded Playback share this exact read surface; neither display path solves another body. */
export type BoutFrameReader = Pick<
  AutoMoviePhysicalPlayback,
  | "identity"
  | "duration"
  | "rate"
  | "contacts"
  | "recovery"
  | "ownership"
  | "ownershipAt"
  | "at"
>;

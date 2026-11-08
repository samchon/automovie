import type { DuelActorFrame } from "./DuelActorFrame";

/**
 * The current body state that the cross-body contact owner actually consumes.
 * @evidence contracts/common.md#implementation-and-ownership Contact changes clinical pose/FK and records its own grip diagnostics; it does not own or rewrite support requests, placement, camera or action timing. The runtime merges this result with the complete original actor sample.
 * @evidence contracts/common.md#authoring-interface Supply a real current public pose/output and current-frame grip/contact records. World placement belongs to the already placed actor. This bounded port permits actual lifecycle tests without fabricated unused support/solver packets.
 */
export type DuelContactFrame = Pick<DuelActorFrame, "pose" | "output" | "gripError" | "contacts">;

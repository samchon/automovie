

/**
 * The clockwise boundary of the measured facial patch as vertex identities of
 * the shared face, starting at the forehead. The identities are the face's own:
 * duplicating their coordinates would leave the jaw and temples disconnected
 * under subdivision. Shared by `portraitCranialChinHeight` and
 * `appendPortraitCranium`.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Resolves chin-relative cranial envelopes against the resident face boundary.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Shares the actual cranial attachment datum between control interpretation and construction.
 * @author Samchon
 */
// Clockwise boundary of the measured facial patch, starting at the forehead.
// These identities are shared with the face; duplicating their coordinates
// would leave the jaw and temples disconnected under subdivision.
export const portraitFacialOvalVertices = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109,
];

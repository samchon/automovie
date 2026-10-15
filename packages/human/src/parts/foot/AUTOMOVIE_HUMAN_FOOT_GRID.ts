/**
 * The fixed connectivity of the foot cage, the same for every person.
 *
 * The cage is built like a shoe. An upper, a grid of `columns` by `rows` vertices, covers the dorsum, the sides above the plantar border and the back of the heel, and opens the ankle ring as a hole of two by two faces. A sole of the same size covers the plantar surface. A rim of one face row joins the upper's boundary to the sole's all round: along the medial and lateral borders, around the back of the heel, and across the front, where every other face is the root of a toe and the faces between are the interdigital webs. Each toe is a tube of four sides with `toeStations.length` stations, closed at its tip by one quad.
 *
 * Columns run from the medial border (0) to the lateral border, rows from the back of the heel (0) to the roots of the toes. Nine face columns across the front give the five toes and four webs; ten face rows put three rows behind the ankle hole, for the calcaneal tendon and the heel, and five in front, for the instep and the dorsum. Around the hole the grid's lines turn, so the loops nearest the ankle encircle it, the edge loops that ankle flexion folds, while the loops in front run across the dorsum. The four hole corners are valence 5 and the four heel corners of the upper and the sole valence 3, both where the surface curves strongly anyway (the malleolar and tendon region, the rounded heel); the web corners at the toe roots are valence 5, the pattern that expands a palm into digits (OpenSubdiv documentation, "Modeling Tips"). Each toe gets a station at the proximal and distal interphalangeal joints so flexion has loops to fold on.
 */
export const AUTOMOVIE_HUMAN_FOOT_GRID = {
  /** Vertex columns of the upper and the sole, medial to lateral. */
  columns: 10,

  /** Vertex rows of the upper and the sole, heel to toes. */
  rows: 11,

  /** First face column of the ankle hole; the hole spans two. */
  holeColumn: 3,

  /** First face row of the ankle hole; the hole spans two. */
  holeRow: 3,

  /** Number of toes, one per even face column across the front. */
  toes: 5,

  /**
   * Toe stations as fractions of each toe's length from its metatarsophalangeal joint centre to its tip: the base of the free toe, the proximal interphalangeal joint (the hallux's interphalangeal joint), the middle phalanx, the distal interphalangeal joint, the distal pad and the tip.
   */
  toeStations: [0.5, 0.62, 0.72, 0.82, 0.91, 0.975],
} as const;

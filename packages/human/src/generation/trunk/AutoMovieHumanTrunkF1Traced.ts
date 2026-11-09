import type { AutoMovieHumanTrunkViewMounds } from "./AutoMovieHumanTrunkViewMounds";

/**
 * f1's trunk traced from her own sections (step 1 of the owner's method,
 * 2026-11-08 17:00: "trace her"): the height tables S00's mounds carry over
 * its wall, read on her exact horizontal cuts of the registered reference,
 * and her mid-sagittal crotch line. Every table is a reading of her skin
 * against S00's wall WITHOUT reliefs, along the mound's own axis (the
 * relief's motion), so wall plus relief lies on her skin at every grid point
 * (`node:trunk-measure --reliefs`, receipt
 * `.shots/f1_trunk2/reliefs-2026-11-08T08-18-38-657Z/reliefs.json`).
 * The tables fade to zero over their outer two spacings
 * (`AutoMovieHumanTrunkMound`), so each window ends where her residual over
 * the wall is near zero: a window cropped on a large residual drew its fade
 * as a crease (render trunk-2026-11-08T08-10-38-440Z: down the breast's
 * lateral side, across the upper chest at 1385, a plate over the pelvis
 * front).
 *
 * Because each table is read over that wall, the wall under them is held:
 * the tape sites inside a table's window keep the shoulder their tape solved
 * on it ({@link FROZEN}); their tapes are then checks of wall plus relief.
 */
export namespace AutoMovieHumanTrunkF1Traced {
  /**
   * The shoulders held under the tables, the values f1's tapes solved on the
   * wall the tables were read over (the waist below; render trunk-2026-11-08T07-06-14-584Z,
   * manifest `sites`, and render-1707's `sites` for 1040): hip 991.4 at 886,
   * iliac 934.8 at 940, top hip 858.2 at 993 and her hull 761.8 at 1040
   * (under the buttock and thigh-root windows), underbust 760.5 at 1205 and
   * chest 856.8 at 1255 (under the breast window).
   */
  export const FROZEN: Record<string, number> = {
    hip: 0.5100148680148913,
    iliac: 0.4035679546776634,
    "top hip": 0.3523029555788307,
    "below the waist (navel level)": 0.4650811643462738,
    // The natural waist (her least girth 673.6 at 1100), under the thigh-root window since it reaches 1105
    // (render trunk-2026-11-08T08-26-19-926Z, manifest `sites`).
    waist: 0.44744591692234437,
    underbust: 0.37711290081403054,
    chest: 0.5614189319736826,
  };

  /**
   * f1's taut-tape girths at two more levels: her trunk loop's convex hull at
   * 1040 (761.8; S00 read 746.0, 15.8 short, the horizontal band below the
   * waist; held, {@link FROZEN}) and at 1165 (728.1; S00 read 712.2; solved)
   * (render trunk-2026-11-08T07-06-14-584Z, manifest `comparison`, heights
   * 1039.9 and 1164.9).
   */
  export const TAPES: { site: string; y: number; girth: number }[] = [
    { site: "below the waist (navel level)", y: 1040.0, girth: 761.8 },
    { site: "lower ribs", y: 1165.0, girth: 728.1 },
  ];

  /**
   * The breast (right; the left mirrors it) with the upper chest and the
   * shoulder bar's front up to 1440, and the flank behind it: her skin over
   * S00's wall along the breast's axis (apex phase 0.4318, wall radius 120.8
   * at the bust level 1255), rows every 10 mm from 1190 to 1440, columns
   * every 10 mm of arc from 50 medial (the midline) to 160 lateral. Read as
   * is: the breast itself (20 mm at the apex column), the upper chest 17 to
   * 36 mm outside the wall from 1300 to 1390 (her pectoral and anterior
   * axillary fold over the conic wall's lean front quarter), the shoulder
   * cap at the bar's tip (23 to 29 mm at 1390, 10 to 17 at 1400, 100 to 130
   * lateral), and the flank under the arm up to 28 mm inside the wall (1215
   * to 1275, 80 to 110 lateral). Corrected by eye: from 1280 up, the columns
   * 140 to 160 (behind the lateral line) read the arm or nothing (37.7, -38.1,
   * -62.3, blanks: the axis line from there misses her trunk or meets the
   * arm), so they repeat the 130 column; from 1296 to 1395 they lie inside
   * the shoulder port, which the arm owns.
   */
  export const BREAST: AutoMovieHumanTrunkViewMounds.ITable = {
    v: [-65, -55, -45, -35, -25, -15, -5, 5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 115, 125, 135, 145, 155, 165, 175, 185],
    a: [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160],
    h: [
      [-1.1, 0.4, 2.3, 3.4, 3.8, 3.8, 3.5, 3.2, 2.9, 2.4, 1.9, 1.1, 0, -1.6, -3.6, -5.8, -7.7, -8.6, -7.6, -4.3, -0.3, 3.7],
      [-0.8, 0.6, 2.2, 2.9, 3, 2.8, 2.7, 2.5, 2.3, 1.9, 1.4, 0.4, -1.3, -3.2, -5.4, -7.9, -9.9, -10.6, -8.9, -5, -0.5, 4],
      [-0.5, 0.7, 1.9, 2.2, 2.3, 2.5, 2.9, 3.8, 3.9, 3, 1.1, -1, -3.3, -5.8, -7.7, -10.4, -12.6, -12.5, -9.9, -5.4, -0.7, 4],
      [-0.4, 0.9, 2, 2.4, 3.3, 6.6, 9.7, 10.9, 10.8, 9.4, 6.5, 1.4, -4.3, -8.4, -11.1, -13.7, -15.8, -14.7, -11.1, -6.1, -1.1, 3.4],
      [-0.6, 1, 2.5, 4.6, 10.2, 13.8, 15.7, 16.3, 15.7, 13.9, 10.8, 5, -3.5, -10.7, -15.2, -18.9, -19.2, -16.5, -11.9, -6.5, -1.4, 2.4],
      [-1.4, 0.7, 3.9, 10.3, 15.3, 18, 19.1, 18.9, 17.6, 15.3, 11.5, 5.6, -3, -13.6, -20.5, -23.5, -22.2, -17.8, -12.2, -6.5, -1.5, 1.8],
      [-2.5, 0.5, 7.1, 14.2, 17.7, 19.6, 20.2, 19.7, 18.1, 15.2, 10.5, 4.7, -4.1, -17.8, -25.1, -27, -23.9, -18.2, -12.1, -6.3, -1.2, 2.5],
      [-3.2, 0.6, 9.3, 15.4, 18.2, 19.8, 20.3, 19.7, 17.8, 14.2, 9.5, 4, -4.6, -21.3, -27, -28.1, -24.4, -18.6, -12.4, -6.7, -1.7, 3.1],
      [-3.9, 0.8, 9.2, 14.7, 17.6, 19.2, 19.7, 19, 17, 13.6, 9.5, 4.6, -3.3, -17.2, -25, -26.8, -23.4, -18.3, -12.5, -7.2, -2, 3.5],
      [-4.5, 0.5, 8.4, 13.3, 16.1, 17.9, 18.6, 18.1, 16.6, 14.2, 10.9, 6.9, 0.8, -8.5, -18.8, -22.3, -20.5, -16.4, -10, -10, -10, -10],
      [-4.4, 0.3, 7.4, 12.2, 15.2, 17, 17.9, 18, 17.4, 16.1, 14.1, 11.3, 7.3, 2.9, -2.4, -10.3, -13.8, -9.5, 6.2, 6.2, 6.2, 6.2],
      [-2.7, 1.5, 7.7, 12, 15, 17, 18.4, 19, 19.2, 19, 18.2, 16.7, 14.8, 12.9, 12, 10.2, 2.9, 5, 22, 22, 22, 22],
      [-1, 2.6, 7.8, 11.7, 14.9, 17.1, 18.8, 20.1, 21, 21.5, 21.5, 21.3, 20.7, 20.4, 20.8, 21.5, 22.7, 27, 36.9, 36.9, 36.9, 36.9],
      [-1.6, 1.4, 6, 9.9, 13.4, 16, 18.2, 20.1, 21.6, 22.8, 23.8, 24.4, 24.9, 25.5, 26.6, 28.3, 31.6, 36.5, 46, 46, 46, 46],
      [-1.6, 1.2, 5.6, 9.5, 13, 15.9, 18.5, 20.8, 22.8, 24.6, 26.1, 27.4, 28.3, 29.4, 30.8, 33.2, 36.6, 42.1, 50.6, 50.6, 50.6, 50.6],
      [-0.9, 1.8, 5.9, 9.8, 13.2, 16.2, 18.8, 21.2, 23.6, 25.9, 27.8, 29.4, 30.6, 31.8, 33.3, 35.9, 39.8, 45.5, 53.1, 53.1, 53.1, 53.1],
      [-1, 1.8, 6, 9.9, 13.1, 15.9, 18.3, 20.6, 23.1, 25.5, 27.6, 29.4, 30.8, 32, 33.6, 36.4, 40.8, 46.7, 53.5, 53.5, 53.5, 53.5],
      [-1, 1.9, 6, 9.6, 12.6, 15.1, 17.2, 19.2, 21.2, 23.4, 25.4, 27.1, 28.4, 29.7, 31.1, 34.1, 39.7, 45.8, 51.7, 51.7, 51.7, 51.7],
      [-0.8, 2, 5.7, 9, 11.6, 13.6, 15.2, 16.7, 18.2, 19.9, 21.4, 22.8, 23.9, 24.5, 25.3, 29.1, 36.2, 42.8, 47.2, 47.2, 47.2, 47.2],
      [-1.3, 0.9, 4.4, 7.5, 9.8, 11.2, 12.3, 13.2, 14.3, 15.3, 16.2, 16.8, 17, 16.3, 15.6, 21.1, 30.8, 37.2, 39.2, 39.2, 39.2, 39.2],
      [-1.1, 0.6, 3.4, 6.7, 8.8, 9.9, 10.5, 11, 11.5, 11.9, 12, 11.4, 9.9, 7, 4.8, 11.4, 22.6, 28.8, 26.3, 26.3, 26.3, 26.3],
      [-2.5, -0.7, 2.2, 4.4, 6.1, 6.6, 6.7, 6.7, 7, 7, 7.2, 5.9, 3.8, 0.3, -2.9, -0.4, 9.9, 16.8, 11.3, 11.3, 11.3, 11.3],
      [-1.2, 0.6, 4, 5.4, 5.7, 5.5, 5.4, 5.3, 4.8, 4.1, 3.3, 2.2, 1.6, 0.4, -0.9, -1.8, -1.4, 1.6, 5.9, 5.9, 5.9, 5.9],
      [-0.2, 1.2, 3.7, 5.4, 5.8, 5.4, 5.2, 5.2, 4.9, 4.2, 3.1, 1.7, 0.8, -0.2, -1.2, -1.8, -2, -2.1, -1.9, -1.9, -1.9, -1.9],
      [-0.7, 0.1, 1.3, 2.7, 3.4, 3.5, 3.4, 3.2, 2.9, 2.2, 1, -0.2, -1.5, -2.5, -3.3, -3.2, -2.5, -1.6, -0.7, -0.7, -0.7, -0.7],
      [-0.9, -0.8, -0.8, -0.6, -0.3, 0.1, 0.2, 0, -0.3, -0.9, -1.9, -3.1, -4.7, -6.2, -7.2, -7.5, -7, -5.8, -4, -4, -4, -4],
    ],
  };

  /**
   * The thigh root's front with the hip's front (right; the left mirrors
   * it): her skin over S00's wall along the thigh mound's axis (apex phase
   * 0.740, wall radius 117.1 on the open bottom 804.9), rows every 10 mm up
   * to 1105, columns every 10 mm of arc from 80 medial (7 mm short of the
   * midline) to 90 lateral (short of the buttock window at the lateral line);
   * receipt reliefs-2026-11-08T08-34-40-868Z. A window ending 20 mm medial of
   * the apex and at 1065 left a recessed strip between the two windows (render
   * trunk-2026-11-08T08-26-19-926Z, pair.front): its medial border sat in her
   * groin concavity (-3 to -8) and its top row read -5. Her thigh front stands
   * 24 to 34 mm outside the crotch ring (f1_leg's furrow reading: 125 from the
   * femur axis against the ring's 94.4). Corrected by eye: from 805 to 845 the
   * cells 30 to 80 mm medial read -26 to -88, her pubic notch between the
   * thighs, which the split's seam owns, so they repeat the 20-medial cell;
   * the umbilical pit's cell (1045, 80 medial, -5.2) is bridged (-0.6, between
   * its neighbours above and below); the bottom row is repeated 10 and 20 mm
   * below the open end, so the fade lies outside S00 and the ring the legs
   * start from keeps her value.
   */
  export const THIGH: AutoMovieHumanTrunkViewMounds.ITable = {
    v: [-19.9, -9.9, 0.1, 10.1, 20.1, 30.1, 40.1, 50.1, 60.1, 70.1, 80.1, 90.1, 100.1, 110.1, 120.1, 130.1, 140.1, 150.1, 160.1, 170.1, 180.1, 190.1, 200.1, 210.1, 220.1, 230.1, 240.1, 250.1, 260.1, 270.1, 280.1, 290.1, 300.1],
    a: [-80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
    h: [
      [5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 16.6, 24.5, 30.2, 33.4, 33.9, 32.1, 28.1, 22.5, 16, 9.3, 3.4],
      [5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 16.6, 24.5, 30.2, 33.4, 33.9, 32.1, 28.1, 22.5, 16, 9.3, 3.4],
      [5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 16.6, 24.5, 30.2, 33.4, 33.9, 32.1, 28.1, 22.5, 16, 9.3, 3.4],
      [4.6, 4.6, 4.6, 4.6, 4.6, 4.6, 4.6, 15.8, 23.5, 29.2, 32.5, 33.2, 31.5, 27.5, 22, 15.5, 8.7, 2.7],
      [2.9, 2.9, 2.9, 2.9, 2.9, 2.9, 2.9, 15, 22.7, 28.3, 31.7, 32.6, 31, 27.1, 21.6, 15.2, 8.3, 2.1],
      [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 13.3, 21.4, 27, 30.5, 31.5, 30, 26.3, 21.2, 15, 8.2, 1.9],
      [-2.6, -2.6, -2.6, -2.6, -2.6, -2.6, -2.6, 10.7, 18.9, 24.5, 28.2, 29.4, 28.2, 24.8, 20, 14.2, 7.8, 1.9],
      [-4.3, -5, -6.5, -8.6, -10.9, -12.1, -4.9, 5.4, 14.6, 20.5, 24.3, 25.8, 24.8, 21.8, 17.6, 12.4, 6.8, 1.4],
      [-0.8, -1.7, -3.1, -5, -6.8, -8.3, -6.4, 0.3, 8.1, 14.4, 18.6, 20.5, 20.1, 17.8, 14.4, 10.1, 5.6, 0.8],
      [-0.6, -1.3, -2.6, -4.2, -5.7, -7.2, -7.5, -4, 1.9, 7.3, 11.9, 14.3, 14.8, 13.6, 11.1, 8, 4.5, 0.3],
      [-0.5, -1.2, -2.2, -3.6, -5.1, -6.4, -7.2, -5.7, -2, 2.2, 6.5, 9.2, 10.7, 10.6, 9.1, 6.9, 3.9, -0.2],
      [-0.3, -0.8, -1.7, -2.9, -4.3, -5.4, -6.4, -5.9, -3.7, -0.6, 3, 5.9, 8.1, 9, 8.2, 6.5, 3.7, -0.4],
      [-0.2, -0.7, -1.5, -2.5, -3.7, -4.7, -5.5, -5.6, -4.2, -1.9, 1.1, 4, 6.7, 8.3, 8.1, 6.6, 3.8, -0.4],
      [-0.1, -0.5, -1.2, -2.2, -3.2, -4, -4.7, -4.8, -3.7, -1.9, 0.5, 3.3, 6.3, 8.3, 8.5, 6.9, 4.1, 0],
      [-0.1, -0.4, -1, -1.8, -2.6, -3.3, -3.8, -3.8, -2.9, -1.1, 1.1, 3.7, 6.6, 8.7, 9, 7.4, 4.4, 0.4],
      [-0.1, -0.3, -0.7, -1.3, -2, -2.5, -2.8, -2.7, -1.9, 0, 2.4, 4.8, 7.4, 9.2, 9.4, 7.7, 4.5, 0.6],
      [-0.2, -0.2, -0.5, -0.8, -1.2, -1.7, -1.8, -1.7, -0.9, 0.8, 3.3, 5.9, 8.3, 9.7, 9.6, 7.8, 4.5, 1],
      [-0.3, -0.1, -0.1, -0.2, -0.4, -0.7, -0.8, -0.6, 0, 1.4, 3.7, 6.4, 8.6, 9.8, 9.5, 7.5, 4.3, 1],
      [-0.1, 0.2, 0.5, 0.6, 0.4, 0.1, -0.1, 0, 0.5, 1.7, 3.7, 6, 8.2, 9.3, 8.7, 6.7, 3.8, 0.9],
      [0, 0.5, 0.9, 1, 0.9, 0.6, 0.2, 0.3, 0.7, 1.7, 3.4, 5.4, 7.3, 8.2, 7.6, 5.7, 3.1, 0.6],
      [0.1, 0.6, 1, 1.1, 0.9, 0.4, -0.1, -0.3, 0.2, 1.2, 2.6, 4.4, 5.9, 6.6, 6.1, 4.4, 2.4, 0.5],
      [0.1, 0.5, 0.8, 0.7, 0.2, -0.6, -1.3, -1.6, -1.2, 0, 1.3, 2.9, 4.2, 4.7, 4.2, 3, 1.6, 0.4],
      [0, 0.2, 0.3, 0, -0.8, -1.8, -2.8, -3.4, -3.1, -2, -0.5, 0.9, 2, 2.4, 2.1, 1.4, 0.6, 0],
      [0, 0.2, 0.2, -0.3, -1.3, -2.6, -4, -5.1, -5, -3.8, -2.1, -0.6, 0.5, 0.9, 0.7, 0.2, -0.1, -0.3],
      [0.7, 1.1, 1.3, 0.7, -0.5, -2.2, -4, -5.5, -5.8, -4.7, -3, -1.2, 0.1, 0.8, 0.8, 0.4, 0.1, -0.2],
      [0.3, 2, 3.2, 2.6, 1.3, -0.7, -2.9, -4.8, -5.6, -4.8, -3.2, -1.4, 0.1, 1.1, 1.5, 1.4, 1, 0.5],
      [-0.6, 2, 4, 4, 2.9, 0.8, -1.7, -3.9, -5.1, -4.5, -3, -1.3, 0.2, 1.4, 2.1, 2.2, 2, 1.1],
      [-1.5, 2.2, 4.3, 4.5, 3.4, 1.4, -1.2, -3.7, -5, -4.5, -3, -1.2, 0.3, 1.4, 2.2, 2.5, 2.3, 1.2],
      [-0.6, 1.9, 3.3, 3.6, 2.6, 0.6, -1.9, -4.4, -5.6, -5, -3.2, -1.3, 0.2, 1.3, 2.1, 2.4, 2, 0.8],
      [-0.4, 1.3, 2.4, 2.5, 1.5, -0.3, -2.6, -4.8, -5.8, -5, -3.1, -1.1, 0.3, 1.3, 2, 2.2, 1.7, 0.2],
      [-0.2, 1.2, 2.1, 2.1, 1.1, -0.5, -2.5, -4.2, -4.9, -4, -2.1, -0.5, 0.7, 1.6, 2.1, 2.2, 1.7, 0],
      [-0.2, 1, 2, 2.1, 1.3, -0.1, -1.7, -3, -3.5, -2.7, -1.1, 0.1, 1, 1.7, 2.1, 2.2, 1.7, 0.1],
      [-0.1, 1.1, 2.1, 2.3, 1.8, 0.7, -0.7, -2, -2.5, -1.9, -0.7, 0.1, 0.8, 1.2, 1.5, 1.6, 1.1, 0.1],
    ],
  };

  /**
   * The buttock (right; the left mirrors it) in the window of the law it
   * replaces (`AutoMovieHumanTrunkViewMounds`: apex at the buttock level 886,
   * phase 2.553, wall radius 125.8; from the cleft to the lateral line, from
   * the open bottom to the crest): her skin over S00's wall along the
   * buttock's axis, rows every 10 mm from 805 to 1045, columns every 10 mm
   * of arc from 55 medial to 125 lateral (positive toward the side). Her
   * buttock stands 30 mm out near the cleft and the law's lateral lobe stood
   * up to 9 mm outside her (render trunk-2026-11-08T07-06-14-584Z deviation:
   * -10 at 105 to 135 degrees, +17 at 165). Corrected by eye: from 805 to
   * 825 the cells nearest the cleft read -11 to -73 (the cleft running into
   * the perineum, which the split's seam owns) and repeat the first value
   * lateral of them; the bottom row is repeated 10 and 20 mm below the open
   * end.
   */
  export const BUTTOCK: AutoMovieHumanTrunkViewMounds.ITable = {
    v: [-101, -91, -81, -71, -61, -51, -41, -31, -21, -11, -1, 9, 19, 29, 39, 49, 59, 69, 79, 89, 99, 109, 119, 129, 139, 149, 159],
    a: [-55, -45, -35, -25, -15, -5, 5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 115, 125],
    h: [
      [-0.7, -0.7, -0.7, -0.7, -0.7, 5.9, 10.2, 13, 14.2, 14.3, 13.6, 11.6, 9.3, 6.1, 3.2, 0.8, -0.9, -1.3, 0.5],
      [-0.7, -0.7, -0.7, -0.7, -0.7, 5.9, 10.2, 13, 14.2, 14.3, 13.6, 11.6, 9.3, 6.1, 3.2, 0.8, -0.9, -1.3, 0.5],
      [-0.7, -0.7, -0.7, -0.7, -0.7, 5.9, 10.2, 13, 14.2, 14.3, 13.6, 11.6, 9.3, 6.1, 3.2, 0.8, -0.9, -1.3, 0.5],
      [4.4, 4.4, 4.4, 4.4, 10.5, 14.7, 16.9, 18.8, 18.9, 18.9, 17, 14.5, 11, 7.1, 3.3, 0.3, -1.7, -2.2, -0.4],
      [-3.4, -3.4, 8.2, 14.4, 18.5, 21, 22.6, 23.5, 23.4, 22.1, 19.9, 16.5, 12.3, 7.8, 3.2, -0.4, -2.5, -3.1, -1.3],
      [9.8, 9.8, 17.3, 21.4, 24.1, 25.9, 26.9, 26.8, 25.9, 24.3, 21.5, 17.8, 13.1, 7.7, 2.6, -1.2, -3.3, -3.6, -1.6],
      [8.5, 18.2, 23.1, 26, 27.9, 29, 29.1, 28.5, 27.3, 25, 21.9, 17.8, 12.4, 6.7, 1.4, -2.3, -4.2, -4, -1.6],
      [17.6, 23.6, 26.8, 28.6, 30.2, 30.6, 30.2, 29, 27.1, 24.5, 20.9, 16.1, 10.5, 4.5, -0.7, -4.1, -5.3, -4.4, -1.8],
      [22.2, 26.7, 29.1, 30.4, 31.2, 31.2, 30.1, 28.3, 25.9, 22.5, 18.4, 13.4, 7.6, 1.6, -3.4, -6.2, -6.7, -5.1, -2.1],
      [24.1, 27.8, 29.9, 30.9, 31.2, 30.6, 29, 26.9, 24, 20.1, 15.8, 10.3, 4.2, -1.5, -6, -8.1, -7.8, -5.7, -2.5],
      [23.7, 27.2, 29, 29.9, 30, 28.9, 27, 24.9, 21.7, 17.8, 12.9, 7.3, 1.5, -3.9, -7.8, -9.3, -8.5, -6.1, -2.8],
      [21.5, 24.9, 26.8, 27.8, 28, 26.8, 25.1, 22.7, 19.5, 15.6, 10.8, 5.4, -0.2, -5, -8.3, -9.5, -8.6, -6.3, -3],
      [18.1, 21.7, 23.9, 25.2, 25.3, 24.6, 23, 20.8, 17.8, 14, 9.5, 4.5, -0.6, -5, -7.9, -8.9, -8.2, -6, -2.9],
      [14.1, 17.9, 20.4, 21.8, 22.3, 22, 20.9, 18.9, 16.3, 12.9, 9, 4.5, -0.1, -4, -6.7, -7.8, -7.2, -5.4, -2.5],
      [9.4, 13.4, 16.2, 18.1, 19.1, 19.3, 18.7, 17.2, 15.1, 12.4, 8.9, 5.1, 1.2, -2.4, -5, -6.2, -6, -4.5, -2],
      [5.7, 9.2, 12.3, 14.6, 16.1, 16.7, 16.5, 15.6, 14.1, 11.9, 9.1, 5.9, 2.5, -0.7, -3.1, -4.4, -4.5, -3.4, -1.4],
      [3.4, 6.3, 9.1, 11.5, 13.2, 14.2, 14.4, 14, 13, 11.3, 9, 6.4, 3.5, 0.8, -1.5, -2.9, -3.1, -2.4, -0.8],
      [2.1, 4.1, 6.3, 8.6, 10.3, 11.5, 12.1, 12, 11.3, 10, 8.3, 6.1, 3.7, 1.3, -0.6, -1.9, -2.2, -1.7, -0.4],
      [1.2, 2.6, 4.1, 5.7, 7.3, 8.5, 9.3, 9.5, 9, 7.9, 6.5, 4.6, 2.6, 0.7, -0.8, -1.6, -1.8, -1.4, -0.4],
      [0.6, 1.4, 2.3, 3.3, 4.5, 5.6, 6.5, 6.8, 6.3, 5.5, 4, 2.4, 0.7, -0.6, -1.5, -2, -1.8, -1.1, -0.4],
      [0.2, 0.6, 1, 1.4, 2.1, 3, 3.8, 4.2, 4, 2.9, 1.8, 0.4, -1.1, -2.2, -2.7, -2.5, -1.7, -0.8, -0.2],
      [0.1, 0.3, 0.3, 0.4, 0.5, 1.1, 1.7, 2.3, 2.3, 1.7, 0.6, -1, -2.4, -3.4, -3.5, -2.9, -1.8, -0.6, 0],
      [0.1, 0.3, 0.2, 0, -0.3, -0.1, 0.5, 1, 1.3, 0.9, 0, -1.2, -2.6, -3.5, -3.7, -3.1, -1.9, -0.7, -0.1],
      [-0.1, 0.2, 0.2, -0.1, -0.5, -0.6, -0.3, 0.1, 0.5, 0.5, -0.1, -1.1, -2.2, -3.1, -3.5, -3.2, -2.2, -1.2, -0.6],
      [-0.6, 0.1, 0.5, 0.4, 0.1, -0.2, -0.1, 0.2, 0.5, 0.5, 0.1, -0.7, -1.7, -2.5, -3.1, -3.1, -2.5, -1.6, -0.8],
      [-1.1, 0, 0.7, 0.9, 0.8, 0.6, 0.6, 0.8, 0.9, 0.9, 0.7, 0, -0.8, -1.7, -2.4, -2.7, -2.5, -1.6, -0.4],
      [-2, -0.4, 0.7, 1.2, 1.5, 1.5, 1.5, 1.6, 1.7, 1.6, 1.3, 0.9, 0.2, -0.8, -1.7, -2.3, -2.4, -1.7, -0.1],
    ],
  };

  /**
   * The spinal groove, one hollow along the back midline: its depth at each
   * height is her spinous line (her exact mid-sagittal cut) ahead of S00's
   * posterior outline (the paraspinal extreme), render
   * trunk-2026-11-08T07-06-14-584Z manifest `comparison` (`back`, every 25
   * mm): 2.2 at 1040, 6.2 at 1065, 9.3 at 1090, 11.0 at 1115, 12.3 at 1140,
   * 12.5 at 1165, 10.9 at 1190, 9.6 at 1205, 9.2 at 1240, 10.2 at 1255, 12.8
   * at 1290, 15.2 at 1315, 15.8 at 1340, 15.0 at 1365, 13.3 at 1390, 5.3 at
   * 1415, nothing at 1020 and 1430. The two hollows it replaces (1075 and
   * 1300) left her 13 mm inside S00 at 1150 between them. Its half width
   * from her loops' fall-off beside the midline (15 degrees off it: 3 of 13
   * mm left at 1150, 1.5 of 10 at 1255, 10 of 15 at 1370): 42 mm up to 1260,
   * widening to 70 between the scapulae by 1340; across, `(1 - (a/w)^2)^3`.
   */
  export const GROOVE: AutoMovieHumanTrunkViewMounds.ITable & { station: number } = ((): AutoMovieHumanTrunkViewMounds.ITable & { station: number } => {
    const depth: [number, number][] = [
      [1010, 0],
      [1020, 0],
      [1040, 2.2],
      [1065, 6.2],
      [1090, 9.3],
      [1115, 11.0],
      [1140, 12.3],
      [1165, 12.5],
      [1190, 10.9],
      [1205, 9.6],
      [1240, 9.2],
      [1255, 10.2],
      [1290, 12.8],
      [1315, 15.2],
      [1340, 15.8],
      [1365, 15.0],
      [1390, 13.3],
      [1415, 5.3],
      [1430, 0],
      [1440, 0],
    ];
    const at = (y: number): number => {
      for (let i: number = 1; i < depth.length; ++i) if (y <= depth[i]![0]) return depth[i - 1]![1] + ((depth[i]![1] - depth[i - 1]![1]) * (y - depth[i - 1]![0])) / (depth[i]![0] - depth[i - 1]![0]);
      return 0;
    };
    const half = (y: number): number => (y <= 1260 ? 42 : y >= 1340 ? 70 : 42 + (28 * (y - 1260)) / 80);
    const station: number = 1230;
    const ys: number[] = Array.from({ length: 44 }, (_: unknown, k: number): number => 1010 + 10 * k);
    const a: number[] = Array.from({ length: 17 }, (_: unknown, k: number): number => -80 + 10 * k);
    return {
      station,
      v: ys.map((y: number): number => y - station),
      a,
      h: ys.map((y: number): number[] => a.map((x: number): number => -at(y) * Math.pow(Math.max(0, 1 - (x / half(y)) ** 2), 3))),
    };
  })();

  /**
   * The bottom turn's largest posterior offset, mm
   * (`AutoMovieHumanTrunkNeckTurn.floor`'s `inner`): her buttocks' extreme
   * behind the hip vertical at the buttock level, 132.9 (render
   * trunk-2026-11-08T07-06-14-584Z `comparison`, minX at 886), 5 % over for
   * the tilted planes' longer cut. The turn is then 150.9 mm long, from the
   * bottom station 831.3 (origin (-33.87, 837.48)) to level at 982.2.
   */
  export const FLOOR_INNER: number = 140;

  /**
   * S00's bottom band read on her exact cut by each turned section plane
   * (`node:trunk-band`, receipt `.shots/f1_trunk2/band-2026-11-08T08-49-23-563Z`):
   * per station (course arclength, mm) the midline's front and back
   * crossings along the plane's u (mm from the plane's origin), the half
   * breadth, and the right quarters' conic shoulder shares about the origin.
   * The bottom plane passes through her forks, so its front and back are the
   * forks' distances from the bottom origin (59.29 to the notch floor, 80.94
   * to the cleft's top). Corrected: the front share at 831 to 851 reads 0.95
   * to 1.00 (her thigh fronts fill the quarter's box: the front quarter there
   * runs from the notch floor straight across to the thighs), held at 0.95
   * inside the conic's open interval; the thigh table carries the lobes over
   * it. The 981.3 row is left out (0.9 mm under the turn's upper end).
   */
  export const BAND: { station: number; front: number; back: number; half: number; rhoFront: number; rhoBack: number }[] = [
    { station: 831.32, front: 59.29, back: -80.94, half: 191.3, rhoFront: 0.95, rhoBack: 0.51 },
    { station: 841.32, front: 70.03, back: -89.94, half: 190.25, rhoFront: 0.95, rhoBack: 0.489 },
    { station: 851.32, front: 80.95, back: -96.67, half: 189.07, rhoFront: 0.95, rhoBack: 0.476 },
    { station: 861.32, front: 90.74, back: -101.52, half: 187.64, rhoFront: 0.909, rhoBack: 0.471 },
    { station: 871.32, front: 98.36, back: -104.95, half: 185.81, rhoFront: 0.859, rhoBack: 0.472 },
    { station: 881.32, front: 103.95, back: -107.85, half: 183.58, rhoFront: 0.803, rhoBack: 0.476 },
    { station: 891.32, front: 107.61, back: -109.92, half: 181.16, rhoFront: 0.744, rhoBack: 0.483 },
    { station: 901.32, front: 109.04, back: -111.39, half: 178.75, rhoFront: 0.689, rhoBack: 0.491 },
    { station: 911.32, front: 109.59, back: -112.07, half: 176.51, rhoFront: 0.621, rhoBack: 0.5 },
    { station: 921.32, front: 110.08, back: -112.43, half: 174.36, rhoFront: 0.559, rhoBack: 0.508 },
    { station: 931.32, front: 111.09, back: -112.62, half: 172.26, rhoFront: 0.508, rhoBack: 0.514 },
    { station: 941.32, front: 112.32, back: -111.88, half: 170.23, rhoFront: 0.474, rhoBack: 0.519 },
    { station: 951.32, front: 113.79, back: -110.61, half: 168.43, rhoFront: 0.448, rhoBack: 0.523 },
    { station: 961.32, front: 115.53, back: -108.18, half: 166.56, rhoFront: 0.42, rhoBack: 0.526 },
    { station: 971.32, front: 117.32, back: -104.74, half: 164.37, rhoFront: 0.397, rhoBack: 0.531 },
    { station: 982.2, front: 118.99, back: -99.66, half: 161.62, rhoFront: 0.381, rhoBack: 0.538 },
  ];

  /**
   * Her mid-sagittal crotch line, world (X forward of the hip-centre
   * vertical, Y above the floor) in the median plane: the exact z = 0 cut of
   * her registered reference below 875, from the pubic notch's floor (19.2,
   * 811.2) under the crotch (lowest 804.9 at X -17.3) up the cleft to (-106.4,
   * 873.4), reduced by Douglas-Peucker within 0.5 mm (receipt
   * reliefs-2026-11-08T07-57-04-582Z `crotch`). The pelvis split's seam runs
   * along it from the front fork to the back fork.
   */
  export const CROTCH_LINE: [number, number][] = [
    [19.2, 811.2],
    [0.4, 806.2],
    [-8.5, 805.0],
    [-17.3, 804.9],
    [-36.9, 806.2],
    [-45.6, 808.7],
    [-53.8, 812.1],
    [-69.9, 822.3],
    [-77.4, 828.8],
    [-84.5, 836.3],
    [-97.2, 854.2],
    [-102.4, 863.7],
    [-106.4, 873.4],
  ];
}

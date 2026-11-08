type V3 = [number, number, number];

/**
 * f1's leg and foot 2D lines as absolute world points on her reference in
 * her own stance (the shank abducted, the feet as placed), world
 * calibration mm with +X forward, +Y up and Z negative on her left: the
 * owner's world-match step (2026-11-08). Each point is a silhouette point of
 * her surface in its view, placed by `NodeLegWorldTrace` and checked on her
 * clay in every view: the leg's at its levels (the sites' own and every
 * 30 mm between); the foot's sampled every 4 mm, each sample's free
 * coordinate the median of its neighbourhood (her mesh's saw-toothed slices
 * and hatching are single-sample steps), reduced to the fewest knots whose
 * natural cubic passes every sample within 0.5 mm. The leg's zero frames
 * take them through `AutoMovieHumanLegF1Rebase`.
 */
export namespace AutoMovieHumanLegF1World {
  /** Her bone landmarks in that stance: the hip centre (the trunk's hip port), the knee centre between the epicondyles' skin points, IM between the malleoli's tips. */
  export const LANDMARKS: Readonly<Record<"hip" | "knee" | "im", V3>> = { hip: [0.0, 889.0, -86.1], knee: [30.3, 490.0, -98.0], im: [13.3, 63.7, -136.7] };

  /** Her foot's course direction from IM: her sole's principal heading, pitched as the leg's course from IM to the toe-web pole. */
  export const COURSE: V3 = [157.6, -55.8, -20.2];

  /** Her front-ankle juncture: her surface on the ray from IM in the bisection plane of her shank and foot course, toward the bend's inner side (the talus' front). */
  export const JUNCTURE: V3 = [47.3, 86.9, -137.7];

  /** The leg's levels top down: a site's name, or an empty string between sites. */
  export const LEVELS: readonly string[] = ["gluteal furrow", "", "", "", "", "", "", "", "", "", "suprapatella", "midpatella", "", "", "", "", "calf maximum", "", "", "", "", "", "", "", "ankle minimum"];

  /** The leg's four lines, one point per level: front view lateral and medial, side view anterior and posterior. */
  export const LEG: Readonly<Record<"lateral" | "medial" | "anterior" | "posterior", readonly V3[]>> = {
    lateral: [
      [40.3, 775.6, -192.1],
      [40.1, 745.6, -191.0],
      [39.0, 715.6, -188.5],
      [37.2, 685.6, -184.9],
      [47.1, 655.6, -180.9],
      [43.5, 625.6, -176.3],
      [39.5, 595.6, -171.0],
      [25.8, 565.6, -165.3],
      [12.4, 535.6, -162.0],
      [6.7, 505.6, -161.5],
      [3.3, 490.4, -161.1],
      [-2.1, 468.4, -160.7],
      [-8.0, 445.6, -162.6],
      [-13.2, 415.6, -169.0],
      [-7.1, 385.6, -176.3],
      [-8.5, 355.6, -180.5],
      [-9.2, 343.0, -181.2],
      [-10.3, 325.6, -181.3],
      [-13.0, 295.6, -180.2],
      [-7.3, 265.6, -177.9],
      [-9.4, 235.6, -175.4],
      [-2.0, 205.6, -172.2],
      [-0.7, 175.6, -169.3],
      [2.2, 145.6, -165.1],
      [4.9, 120.7, -161.7],
    ],
    medial: [
      [33.6, 775.6, -10.8],
      [22.9, 745.6, -12.1],
      [23.0, 715.6, -14.9],
      [23.3, 685.6, -19.0],
      [23.4, 655.6, -24.8],
      [23.4, 625.6, -30.8],
      [22.8, 595.6, -35.1],
      [21.9, 565.6, -38.2],
      [20.4, 535.6, -41.4],
      [17.5, 505.6, -44.7],
      [15.6, 490.4, -46.9],
      [13.1, 468.4, -51.9],
      [10.4, 445.6, -59.2],
      [-2.3, 415.6, -68.0],
      [-12.5, 385.6, -71.6],
      [-13.8, 355.6, -71.3],
      [-14.5, 343.0, -71.3],
      [-15.7, 325.6, -71.7],
      [-12.1, 295.6, -75.2],
      [-11.8, 265.6, -81.9],
      [-8.3, 235.6, -88.5],
      [-10.0, 205.6, -94.0],
      [-9.6, 175.6, -99.2],
      [-7.6, 145.6, -104.5],
      [-3.2, 120.7, -108.5],
    ],
    anterior: [
      [134.1, 775.6, -107.8],
      [133.0, 745.6, -109.2],
      [130.4, 715.6, -109.9],
      [126.2, 685.6, -110.5],
      [120.7, 655.6, -110.9],
      [114.1, 625.6, -110.1],
      [106.7, 595.6, -96.9],
      [98.5, 565.6, -98.6],
      [91.8, 535.6, -101.5],
      [85.8, 505.6, -113.4],
      [82.1, 490.4, -106.6],
      [74.4, 468.4, -116.2],
      [65.1, 445.6, -111.5],
      [51.2, 415.6, -122.1],
      [46.8, 385.6, -131.9],
      [45.9, 355.6, -134.8],
      [45.4, 343.0, -135.7],
      [44.5, 325.6, -136.5],
      [42.2, 295.6, -137.3],
      [39.4, 265.6, -138.1],
      [36.3, 235.6, -139.4],
      [33.9, 205.6, -140.6],
      [33.1, 175.6, -141.2],
      [34.3, 145.6, -134.6],
      [37.7, 120.7, -134.8],
    ],
    posterior: [
      [-62.5, 767.6, -99.2],
      [-56.2, 745.6, -100.7],
      [-52.3, 715.6, -102.7],
      [-51.7, 685.6, -102.7],
      [-51.2, 655.6, -101.5],
      [-49.3, 625.6, -100.6],
      [-45.7, 595.6, -100.7],
      [-41.1, 565.6, -101.8],
      [-37.7, 535.6, -103.5],
      [-38.3, 505.6, -114.9],
      [-39.7, 490.4, -115.6],
      [-41.5, 468.4, -116.9],
      [-46.7, 445.6, -118.5],
      [-55.5, 415.6, -120.0],
      [-62.3, 385.6, -121.1],
      [-66.5, 355.6, -122.8],
      [-67.2, 343.0, -123.9],
      [-66.9, 325.6, -125.8],
      [-63.7, 295.6, -129.5],
      [-58.8, 265.6, -132.7],
      [-53.8, 235.6, -136.0],
      [-49.4, 205.6, -130.5],
      [-45.6, 175.6, -131.6],
      [-41.9, 145.6, -131.7],
      [-39.0, 120.7, -131.2],
    ],
  };

  /** The foot's lines from the heel to the ball: from above the lateral and medial outlines and from the side the dorsal profile by station along +X; the heel's back by height. */
  export const FOOT: Readonly<Record<"lateral" | "medial" | "dorsal" | "heel", readonly V3[]>> = {
    lateral: [
      [-42.0, 19.0, -151.1],
      [-34.0, 13.8, -159.9],
      [-26.0, 13.5, -165.3],
      [-14.0, 12.7, -170.4],
      [30.0, 14.3, -180.6],
      [50.0, 11.9, -188.4],
      [70.0, 9.4, -195.9],
      [82.0, 11.7, -199.5],
      [94.0, 0.7, -199.2],
    ],
    medial: [
      [-42.0, 21.2, -125.7],
      [-38.0, 21.2, -121.5],
      [-26.0, 13.7, -115.0],
      [-14.0, 13.5, -113.0],
      [-6.0, 20.5, -112.7],
      [-2.0, 20.3, -112.5],
      [6.0, 77.7, -108.2],
      [14.0, 74.8, -106.5],
      [22.0, 73.8, -107.2],
      [30.0, 61.7, -109.4],
      [38.0, 30.6, -109.8],
      [50.0, 35.5, -111.2],
      [66.0, 32.4, -113.2],
      [82.0, 29.9, -115.9],
      [94.0, 23.7, -117.1],
    ],
    dorsal: [
      [38.0, 76.6, -155.5],
      [50.0, 76.9, -147.7],
      [58.0, 74.3, -135.6],
      [62.0, 70.5, -136.3],
      [70.0, 65.3, -140.2],
      [94.0, 53.9, -140.2],
    ],
    heel: [
      [-39.0, 4.0, -141.3],
      [-42.7, 8.0, -142.8],
      [-45.4, 16.0, -142.4],
      [-45.6, 24.0, -141.9],
      [-41.6, 44.0, -139.4],
      [-38.4, 60.0, -136.3],
    ],
  };
}

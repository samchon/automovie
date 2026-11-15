/**
 * The Metropolitan Museum's records of the armour pieces `createArmour` reads, by kind and object id, as the museum gives them (H, W, D, Wt.; https://collectionapi.metmuseum.org/public/collection/v1/objects/{id}): height, width and depth in centimetres and weight in grams, each kind's pieces in the order the producer takes its default from, first.
 *
 * Written here from the records, so the armour specs check the producer against the museum rather than against its own table. A cuirass's 22359 states no depth, taken as its width; a mail shirt's records state none, taken as a chest's 62 cm; cuirass 23084 weighs its breastplate's 3112 g and its backplate's 2340 g together.
 */
export const ARMOUR_RECORDS: Readonly<
  Record<
    string,
    Readonly<Record<string, readonly [number, number, number, number]>>
  >
> = {
  openHelmet: {
    met26453: [24.1, 28.6, 33.7, 2984],
    met25388: [26.7, 23.5, 39.37, 2769],
  },
  closedHelmet: {
    met23232: [29.2, 21.6, 28.6, 2749],
    met26508: [29.8, 22.2, 33.7, 2656],
  },
  brimmedHelmet: {
    met26512: [27, 23.81, 34.3, 1449],
    met21972: [25.4, 23.2, 33.5, 1701],
  },
  cuirass: {
    met22359: [36.2, 30.5, 30.5, 4536],
    met23084: [37.5, 37.5, 19.5, 3112 + 2340],
  },
  mail: {
    met34324: [91.5, 143, 62, 9071.9],
    met22415: [84, 132, 62, 9869],
    met633538: [86.4, 144.8, 62, 7520.6],
    met27635: [81, 137, 62, 5562],
  },
  gauntlet: {
    met23255: [29.4, 14.6, 15.9, 793.8],
    met23256: [21, 12.7, 12.4, 300.5],
    met23199: [26.7, 12.7, 11.1, 581.2],
  },
  vambrace: {
    met24896: [21, 11.4, 8.9, 351],
    met35850: [46.1, 16.8, 13.2, 1089],
  },
  greave: {
    met22970: [35.3, 12.7, 11.4, 669],
    met22276: [38.3, 11.7, 14.3, 854],
  },
};

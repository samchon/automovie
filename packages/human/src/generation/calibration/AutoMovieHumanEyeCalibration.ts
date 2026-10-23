import type { IAutoMovieHumanBodyRegion } from "../IAutoMovieHumanBodyRegion";

/**
 * Eye apertures of the f1 calibration specimen: the lid margins.
 *
 * Emitted by `fitEyeCalibration.ts` from the open-piece endpoints of a dense
 * horizontal observation of the original head skin, which is open at the
 * palpebral fissures. The generator removes the skin over each margin by
 * world position, so the eyeballs show through the fissures.
 */
export const AutoMovieHumanEyeCalibration: IAutoMovieHumanBodyRegion = {
  name: "eye",
  chains: [],
  events: [],
  poles: [],
  trims: [],
  apertures: [{"name":"eye.left","order":8,"coefficients":[102.0896,-0.5567,-2.2279,0.4254,1.0993,2.2009,-0.5799,0.4308,-0.3134,1.4001,-0.1701,0.2721,-0.508,0.6564,-0.2263,0.1176,-0.502,1591.7063,-0.5135,-5.2815,0.0412,1.2628,0.4877,-1.1877,-0.2089,0.4801,0.2581,-0.5751,-0.0857,0.047,0.2537,-0.2992,0.0627,0.0594,27.7907,-11.7015,0.865,1.3375,-0.551,-2.2269,0.0679,0.0624,0.6615,-1.1627,-0.1546,-0.3989,0.6197,-0.3427,0.1259,-0.2091,0.4987],"forward":[1,0,0],"depth":4},{"name":"eye.right","order":8,"coefficients":[102.0061,0.9234,-0.0035,2.074,0.7855,0.8026,-0.6184,1.432,0.4029,1.3644,-0.8897,1.0056,0.4418,1.4567,-0.4985,0.3594,0.122,1592.1539,-0.3723,-3.8937,1.0751,0.9173,0.1156,-1.068,0.2977,0.7729,0.1127,-0.5041,-0.1599,0.4669,0.0691,-0.4678,-0.1356,0.0999,-23.0698,10.7022,-0.5508,-4.0114,2.2651,3.9225,-0.7894,-0.8609,0.2839,1.7733,0.0208,0.2411,-0.6562,1.2063,0.2806,0.4111,-0.4473],"forward":[1,0,0],"depth":4}],
  eyes: [{"side":"left","centre":[90.005,1593.811,31.364],"radius":14.593},{"side":"right","centre":[91.366,1594.414,-31.345],"radius":14.327}],
};

/** Zero-argument environment entry for the read-only source derivation probe. */
import { createTempleEnvironment } from "../spaces/environment";

export const buildTempleForDerivation = () => createTempleEnvironment().environment;

/** Zero-argument environment entry for the read-only source derivation probe. */
import { createTempleEnvironment } from "../spaces/createTempleEnvironment";

export const buildTempleForDerivation = () => createTempleEnvironment().environment;

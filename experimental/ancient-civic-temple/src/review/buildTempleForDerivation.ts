import { createTempleEnvironment } from "../spaces/createTempleEnvironment";

/** Zero-argument environment entry for the read-only source derivation probe. */
export const buildTempleForDerivation = () => createTempleEnvironment().environment;

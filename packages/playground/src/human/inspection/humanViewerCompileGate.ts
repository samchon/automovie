import { createHumanViewerCompileGate } from "@automovie/viewer/human/inspection/createHumanViewerCompileGate";

/**
 * One compile-withdrawal gate shared by this application's transform and
 * resident server. Importing this owner initializes one instance; configuration
 * and server composition borrow it instead of creating competing gate states.
 *
 */
export const humanViewerCompileGate = createHumanViewerCompileGate();

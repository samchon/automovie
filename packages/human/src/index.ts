/**
 * Public entry of `@automovie/human`: the person class, its input documents, the converter contract and default, admission, and the part and junction contracts that part generators implement.
 */
export * from "./human/AutoMovieHuman";
export * from "./human/AUTOMOVIE_HUMAN_PART_GENERATORS";
export * from "./human/IAutoMovieHumanPartGenerators";

export * from "./structures/AutoMovieHumanActionUnit";
export * from "./structures/AutoMovieHumanHairColor";
export * from "./structures/AutoMovieHumanIrisColor";
export * from "./structures/AutoMovieHumanPopulation";
export * from "./structures/AutoMovieHumanSex";
export * from "./structures/IAutoMovieHumanAppearance";
export * from "./structures/IAutoMovieHumanExpression";
export * from "./structures/IAutoMovieHumanIdentity";
export * from "./structures/IAutoMovieHumanPose";
export * from "./structures/IAutoMovieHumanTraits";

export * from "./measure/AutoMovieHumanAdmissionError";
export * from "./measure/AutoMovieHumanConverter";
export * from "./measure/IAutoMovieHumanConverter";
export * from "./measure/IAutoMovieHumanLandmarks";
export * from "./measure/IAutoMovieHumanMeasurements";
export * from "./measure/IAutoMovieHumanSkeletalMeasurements";
export * from "./measure/measureAutoMovieHumanLandmarks";
export * from "./measure/validateAutoMovieHumanIdentity";
export * from "./measure/validateAutoMovieHumanTraits";

export * from "./skeleton/IAutoMovieHumanSkeleton";
export * from "./skeleton/measureAutoMovieHumanSkeleton";

export * from "./junction/AUTOMOVIE_HUMAN_RINGS";
export * from "./junction/AUTOMOVIE_HUMAN_UV_LAYOUT";
export * from "./junction/AutoMovieHumanCageBuilder";
export * from "./junction/AutoMovieHumanDirection";
export * from "./junction/AutoMovieHumanJunction";
export * from "./junction/AutoMovieHumanJunctionSite";
export * from "./junction/AutoMovieHumanPart";
export * from "./junction/AutoMovieHumanSide";
export * from "./junction/IAutoMovieHumanCage";
export * from "./junction/IAutoMovieHumanJunction";
export * from "./junction/IAutoMovieHumanRing";
export * from "./junction/IAutoMovieHumanRingDefinition";
export * from "./junction/IAutoMovieHumanRingLayout";
export * from "./junction/IAutoMovieHumanSurfaceCoordinate";
export * from "./junction/layoutAutoMovieHumanRing";
export * from "./junction/meshAutoMovieHumanCage";

export * from "./parts/IAutoMovieHumanPartGenerator";

export * from "./rig/validateAutoMovieHumanExpression";
export * from "./rig/validateAutoMovieHumanPose";

export * from "./appearance/validateAutoMovieHumanAppearance";

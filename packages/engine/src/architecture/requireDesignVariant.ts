import {
  IAutoMovieDesignLineage,
  IAutoMovieDesignVariant,
} from "@automovie/interface";

/**
 * The design variant one id names, or a thrown `Error` naming both the lineage
 * and the missing id.
 *
 * The first variant declared under the id is returned; duplicate ids are a
 * contradiction `validateDesignLineage` refuses, not one this lookup
 * re-decides.
 *
 * @param lineage Lineage holding the variant.
 * @param variant Id of the variant to resolve.
 * @returns The lineage's own variant record, not a copy.
 */
export const requireDesignVariant: (
  lineage: IAutoMovieDesignLineage,
  variant: string,
) => IAutoMovieDesignVariant = (
  lineage: IAutoMovieDesignLineage,
  variant: string,
): IAutoMovieDesignVariant => {
  const found: IAutoMovieDesignVariant | undefined = lineage.variants.find(
    (entry: IAutoMovieDesignVariant): boolean => entry.id === variant,
  );
  if (found === undefined)
    throw new Error(
      `design lineage "${lineage.id}" has no design variant "${variant}"`,
    );
  return found;
};

# src/geometry/AutoMovieRecoveryScalarIndex.ts#AutoMovieRecoveryScalarIndex.create

## @evidence contracts/development/common.md#meaningful-documentation

Supply finite heights and integer vertex addresses. The returned cut includes both height endpoints. Its slab keeps flat faces strictly between the supplied bounds and returns original face IDs in ascending order.

## @evidence contracts/development/implementation.md#principled-implementation

The index reads every supplied height before using it and validates each face's three original vertex addresses. Each face stores its minimum and maximum height. Closed cut and strict slab queries compare those bounds with their finite scalar inputs. The scalar chart regression independently supplies one sloping face, one flat face and both interval endpoints.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each face range is evaluated once during preparation. The index sorts the original face IDs by minimum height and uses segment extrema to prune whole branches. Query work sorts only its retained face IDs. It stores no source positions or triangles in the returned closure.

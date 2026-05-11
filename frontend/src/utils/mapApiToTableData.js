/**
 * Extracts only the fields the table UI needs from the API response.
 * Keeps components decoupled from the raw backend shape.
 *
 * @param {object} apiResponse - Raw response from GET /api/analyze
 * @returns {{
 *   name: string,
 *   version: string|null,
 *   description: string|null,
 *   category: string|null,
 *   products: { name: string, description: string|null }[]
 * }[]}
 */
export function mapApiToTableData(apiResponse) {
  return (apiResponse?.technologies ?? []).map((tech) => {
    // Products are already ordered by priority in the API response, so index 0
    // is the primary recommendation and the rest are secondary.
    const rawProducts = tech?.hubspot?.products ?? [];
    return {
      name: tech?.name ?? "Unknown",
      // Only populated when the detection regex captured a version string.
      version: tech?.version ?? null,
      description: tech?.description ?? null,
      category: tech?.categories?.[0]?.name ?? null,
      products: rawProducts
        .filter((p) => p?.hubspotProduct)
        .map((p) => ({
          name: p.hubspotProduct,
          // Plain-English pitch for why this product fits — more useful in a
          // sales context than the action-oriented title field.
          description: p.description ?? null,
        })),
    };
  });
}

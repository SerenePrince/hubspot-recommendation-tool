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
 *   primaryProduct: string|null,
 *   recommendationTitle: string|null,
 *   additionalProducts: string[]
 * }[]}
 */
export function mapApiToTableData(apiResponse) {
  return (apiResponse?.technologies ?? []).map((tech) => {
    const products = tech?.hubspot?.products ?? [];
    return {
      name: tech?.name ?? "Unknown",
      // Only populated when the detection regex captured a version string.
      version: tech?.version ?? null,
      description: tech?.description ?? null,
      category: tech?.categories?.[0]?.name ?? null,
      primaryProduct: tech?.hubspot?.primaryProduct ?? null,
      recommendationTitle: products[0]?.title ?? null,
      // Products beyond the first, shown as secondary lines in the table.
      additionalProducts: products.slice(1).map((p) => p.name).filter(Boolean),
    };
  });
}

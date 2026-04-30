/**
 * Extracts only the fields the table UI needs from the API response.
 * Keeps components decoupled from the raw backend shape.
 *
 * @param {object} apiResponse - Raw response from GET /api/analyze
 * @returns {{ name: string, description: string|null, category: string|null, primaryProduct: string|null, recommendationTitle: string|null }[]}
 */
export function mapApiToTableData(apiResponse) {
  return (apiResponse?.technologies ?? []).map((tech) => ({
    name: tech?.name ?? "Unknown",
    description: tech?.description ?? null,
    category: tech?.categories?.[0]?.name ?? null,
    primaryProduct: tech?.hubspot?.primaryProduct ?? null,
    recommendationTitle: tech?.hubspot?.products?.[0]?.title ?? null,
  }));
}

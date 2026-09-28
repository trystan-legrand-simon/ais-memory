// Single source of truth for the API version prefix. Route handlers live
// under app/api/v1/*; every client-side fetch call should build its URL from
// this constant instead of hardcoding "/api/v1" so bumping the version, or
// running v1 and v2 side by side during a migration, is a one-line change.
export const API_BASE = "/api/v1";

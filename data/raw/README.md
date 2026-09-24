# Raw snapshots

Immutable exact response bytes captured before parsing, plus JSON manifests recording URL, method, request body, retrieval time, parser version, source identifier and SHA-256 hash. Written by `fetchSnapshot()` in `lib/ingestion/core.ts`.

These evidence files are retained, not ignored. Never edit an official response to correct a parser. Publish a new normalized result against the retained evidence. Deployments and backups must retain raw evidence as well as normalized snapshots; production object storage can replace the local filesystem without changing the data contract. `data/research/` contains separate ignored diagnostic downloads.

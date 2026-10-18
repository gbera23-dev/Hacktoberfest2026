export function ErrorMessage({ error }: { error: unknown }) {
  return <p className="error" role="alert">{error instanceof Error ? error.message : "Request failed"}</p>;
}


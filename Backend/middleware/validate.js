/**
 * Zod-based validation middleware factory.
 * Usage: validate(schema) where schema validates { body, query, params }.
 * Coerced/sanitised values are written back to req.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        // Drop the leading 'body' / 'query' / 'params' segment for cleaner output
        field: issue.path.slice(1).join(".") || issue.path.join("."),
        message: issue.message,
      }));
      return res.status(422).json({ success: false, errors });
    }

    // Write coerced values back so controllers see correct types
    if (result.data.body) Object.assign(req.body, result.data.body);
    if (result.data.query) Object.assign(req.query, result.data.query);
    if (result.data.params) Object.assign(req.params, result.data.params);

    next();
  };
}

export default validate;

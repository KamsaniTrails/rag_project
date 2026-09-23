/**
 * Retries an async function with exponential backoff, specifically
 * for OpenAI 429 "rate limit exceeded" errors (and transient 5xx errors).
 *
 * This is the missing piece that was causing "OpenAI API limit exceeded"
 * failures to bubble straight up to the user instead of being retried.
 */
async function withRetry(fn, { retries = 5, baseDelayMs = 1000 } = {}) {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status || err?.response?.status;
      const errorCode = err?.code || err?.error?.code;
      const errorType = err?.type || err?.error?.type;
      const message = err?.message || "";

      const isInvalidKey =
        status === 401 ||
        status === 403 ||
        message.includes("API_KEY_INVALID") ||
        message.includes("API key not valid") ||
        message.includes("Invalid API key") ||
        message.includes("API_KEY_MISSING");

      const isQuotaExhausted =
        errorCode === "credit_balance_exhausted" ||
        errorType === "insufficient_quota" ||
        message.includes("credit_balance_exhausted") ||
        message.includes("insufficient_quota") ||
        message.includes("no credits remaining") ||
        message.includes("RESOURCE_EXHAUSTED");

      // Auth errors and hard quota exhaustion should never be retried
      if (isInvalidKey || isQuotaExhausted) {
        throw err;
      }

      const isRateLimit = status === 429;
      const isTransient = status >= 500 && status < 600;

      attempt += 1;
      if (!(isRateLimit || isTransient) || attempt > retries) {
        throw err;
      }

      // Honor Retry-After header if OpenAI sends one, otherwise
      // exponential backoff with jitter.
      const retryAfterHeader = err?.headers?.["retry-after"];
      const retryAfterMs = retryAfterHeader
        ? Number(retryAfterHeader) * 1000
        : baseDelayMs * 2 ** (attempt - 1) + Math.random() * 250;

      console.warn(
        `OpenAI ${isRateLimit ? "rate limit" : "transient error"} hit (attempt ${attempt}/${retries}). ` +
          `Retrying in ${Math.round(retryAfterMs)}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
    }
  }
}

module.exports = { withRetry };

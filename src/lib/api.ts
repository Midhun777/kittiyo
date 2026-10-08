export interface ApiError {
  code: 'INVALID_CONTENT' | 'INVALID_CODE' | 'SHARE_NOT_FOUND' | 'RATE_LIMITED' | 'SERVER_ERROR' | 'NETWORK_ERROR';
  message: string;
}

export interface ShareResponse {
  code: string;
  expiresAt: number;
}

export interface RetrieveResponse {
  content: string;
  contentType: 'text' | 'url';
  expiresAt: number;
}

export class LabDropApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'LabDropApiError';
    this.code = code;
  }
}

/**
 * Creates a new share
 */
export async function createShare(content: string, contentType?: 'text' | 'url'): Promise<ShareResponse> {
  try {
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        contentType,
      }),
    });

    interface ApiResponsePayload {
      error?: { code: string; message: string };
    }
    const data = (await res.json().catch(() => null)) as (ApiResponsePayload & ShareResponse) | null;

    if (!res.ok) {
      const err = data?.error || {
        code: 'SERVER_ERROR',
        message: 'Something went wrong. Please try again.',
      };
      throw new LabDropApiError(err.code, err.message);
    }

    return data as ShareResponse;
  } catch (err) {
    if (err instanceof LabDropApiError) {
      throw err;
    }
    throw new LabDropApiError(
      'NETWORK_ERROR',
      'Unable to connect to the server. Check your connection and try again.'
    );
  }
}

/**
 * Retrieves a share by 4-digit code
 */
export async function retrieveShare(code: string): Promise<RetrieveResponse> {
  try {
    const res = await fetch('/api/retrieve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    interface ApiResponsePayload {
      error?: { code: string; message: string };
    }
    const data = (await res.json().catch(() => null)) as (ApiResponsePayload & RetrieveResponse) | null;

    if (!res.ok) {
      const err = data?.error || {
        code: 'SERVER_ERROR',
        message: 'Something went wrong. Please try again.',
      };
      throw new LabDropApiError(err.code, err.message);
    }

    return data as RetrieveResponse;
  } catch (err) {
    if (err instanceof LabDropApiError) {
      throw err;
    }
    throw new LabDropApiError(
      'NETWORK_ERROR',
      'Unable to connect to the server. Check your connection and try again.'
    );
  }
}

/**
 * Checks server health
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    return res.ok;
  } catch {
    return false;
  }
}

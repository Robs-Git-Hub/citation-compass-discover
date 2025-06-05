
// Input validation utilities for security
export class InputValidator {
  private static readonly MAX_QUERY_LENGTH = 500;
  private static readonly XSS_PATTERNS = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<[^>]*>/g
  ];

  static validateSearchQuery(query: string): { isValid: boolean; sanitized: string; error?: string } {
    if (!query || typeof query !== 'string') {
      return { isValid: false, sanitized: '', error: 'Query is required' };
    }

    // Check length
    if (query.length > this.MAX_QUERY_LENGTH) {
      return { 
        isValid: false, 
        sanitized: '', 
        error: `Query must be less than ${this.MAX_QUERY_LENGTH} characters` 
      };
    }

    // Sanitize input
    let sanitized = query.trim();
    
    // Remove potential XSS patterns
    this.XSS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Additional sanitization - remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    if (sanitized.length === 0) {
      return { isValid: false, sanitized: '', error: 'Invalid query format' };
    }

    return { isValid: true, sanitized };
  }
}

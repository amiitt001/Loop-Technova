import { describe, it, expect } from 'vitest';
import { sanitizeForSheets } from './sanitizers.js';

describe('sanitizeForSheets', () => {
    it('sanitizes strings starting with dangerous characters', () => {
        expect(sanitizeForSheets('=cmd')).toBe("'=cmd");
        expect(sanitizeForSheets('+cmd')).toBe("'+cmd");
        expect(sanitizeForSheets('-cmd')).toBe("'-cmd");
        expect(sanitizeForSheets('@cmd')).toBe("'@cmd");
        expect(sanitizeForSheets('\tcmd')).toBe("'\tcmd");
        expect(sanitizeForSheets('\rcmd')).toBe("'\rcmd");
    });

    it('returns safe strings as is', () => {
        expect(sanitizeForSheets('safe string')).toBe('safe string');
        expect(sanitizeForSheets('123')).toBe('123');
    });

    it('sanitizes arrays that stringify to dangerous values', () => {
        const dangerousArray = ['=cmd', 'arg'];
        // String(['=cmd', 'arg']) is "=cmd,arg".
        // So expected result is "'=cmd,arg".
        expect(sanitizeForSheets(dangerousArray)).toBe("'=cmd,arg");
    });

    it('preserves types for safe values (numbers, booleans, dates)', () => {
        expect(sanitizeForSheets(123)).toBe(123);
        expect(sanitizeForSheets(true)).toBe(true);
        const date = new Date();
        expect(sanitizeForSheets(date)).toBe(date);
    });

    it('handles null and undefined gracefully (preserves them)', () => {
        expect(sanitizeForSheets(null)).toBe(null);
        expect(sanitizeForSheets(undefined)).toBe(undefined);
    });

    it('sanitizes strings starting with whitespace followed by dangerous characters', () => {
        expect(sanitizeForSheets('  =cmd')).toBe("'  =cmd");
        expect(sanitizeForSheets('\n=cmd')).toBe("'\n=cmd");
        expect(sanitizeForSheets('\t@cmd')).toBe("'\t@cmd");
        expect(sanitizeForSheets('\r+cmd')).toBe("'\r+cmd");
        expect(sanitizeForSheets(' \t-cmd')).toBe("' \t-cmd");
    });
});

/**
 * Template parsing and rotation utilities for Instagram automation
 */

import type { TemplateVariables } from "./types";

/**
 * Parse templates from JSON string stored in database
 * Returns empty array if parsing fails or input is invalid
 */
export function parseTemplates(templatesJson: string): string[] {
  if (!templatesJson || templatesJson.trim() === "") {
    return [];
  }

  try {
    const templates = JSON.parse(templatesJson);
    if (!Array.isArray(templates)) {
      return [];
    }
    // Filter to only valid non-empty strings
    return templates.filter(
      (t): t is string => typeof t === "string" && t.trim() !== ""
    );
  } catch {
    return [];
  }
}

/**
 * Serialize templates array to JSON string for database storage
 */
export function serializeTemplates(templates: string[]): string {
  return JSON.stringify(templates.filter((t) => t.trim() !== ""));
}

/**
 * Select a template using round-robin rotation
 * @param templates - Array of template strings
 * @param index - Current rotation index (typically based on interaction count)
 * @returns Selected template, or empty string if no templates available
 */
export function selectTemplate(templates: string[], index: number): string {
  if (templates.length === 0) {
    return "";
  }
  // Use modulo to cycle through templates
  const selectedIndex = Math.abs(index) % templates.length;
  return templates[selectedIndex] ?? "";
}

/**
 * Interpolate variables into a template string
 * Supports: {{username}}, {{keyword}}, {{comment}}
 *
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object with variable values
 * @returns Interpolated string
 */
export function interpolateTemplate(
  template: string,
  variables: TemplateVariables
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key as keyof TemplateVariables];
    return value !== undefined ? value : match;
  });
}

/**
 * Check if a comment text contains any of the trigger keywords
 * Case-insensitive matching
 *
 * @param commentText - The comment text to check
 * @param keywordsString - Comma-separated keywords string
 * @returns The matched keyword, or null if no match
 */
export function matchKeyword(
  commentText: string,
  keywordsString: string
): string | null {
  if (!keywordsString || keywordsString.trim() === "") {
    return null;
  }

  const keywords = keywordsString
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k !== "");

  const lowerComment = commentText.toLowerCase();

  for (const keyword of keywords) {
    // Match whole word using word boundary-like logic
    // This prevents "boom" from matching "boomerang"
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i");
    if (regex.test(lowerComment)) {
      return keyword;
    }
  }

  return null;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Validate templates array - ensure all templates are non-empty strings
 */
export function validateTemplates(templates: unknown): templates is string[] {
  if (!Array.isArray(templates)) {
    return false;
  }
  return templates.every((t) => typeof t === "string" && t.trim() !== "");
}

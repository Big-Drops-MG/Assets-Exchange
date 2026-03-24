// Note: These tests use simplified versions of the extraction logic
// for unit testing. In production, use the actual GrammarService methods.

describe("Grammar Feedback Extraction", () => {
  describe("Phase 4.2 - Service Logic Scenarios", () => {
    describe("1️⃣ Multiple Grammar Issues", () => {
      it("should extract multiple grammar issues from corrections array", () => {
        const resultData = {
          corrections: [
            {
              original: "teh",
              correction: "the",
              category: "spelling",
            },
            {
              incorrect: "its",
              correct: "it's",
              category: "punctuation",
            },
          ],
          issues: [],
        };

        const feedback = extractGrammarFeedback(resultData);

        expect(feedback).toHaveLength(2);
        expect(feedback[0]).toMatchObject({
          category: "spelling",
          message: expect.stringContaining("teh"),
          originalText: "teh",
          suggestedText: "the",
          severity: "warning",
        });
        expect(feedback[1]).toMatchObject({
          category: "punctuation",
          message: expect.stringContaining("its"),
          originalText: "its",
          suggestedText: "it's",
          severity: "warning",
        });
      });

      it("should extract multiple grammar issues from issues array", () => {
        const resultData = {
          corrections: [],
          issues: [
            {
              text: "passive voice detected",
              message: "Consider using active voice",
              severity: "info",
            },
            {
              error_text: "run-on sentence",
              suggestion: "Break into shorter sentences",
              type: "style",
            },
          ],
        };

        const feedback = extractGrammarFeedback(resultData);

        expect(feedback).toHaveLength(2);
        expect(feedback[0]).toMatchObject({
          message: "Consider using active voice",
          severity: "info",
        });
        expect(feedback[1]).toMatchObject({
          category: "style",
          severity: "info",
        });
      });

      it("should extract issues from both corrections and issues arrays", () => {
        const resultData = {
          corrections: [
            {
              original: "teh",
              correction: "the",
            },
          ],
          issues: [
            {
              text: "passive voice",
              message: "Use active voice",
            },
          ],
        };

        const feedback = extractGrammarFeedback(resultData);

        expect(feedback).toHaveLength(2);
        expect(feedback[0].category).toBe("grammar_correction");
        expect(feedback[1].category).toBe("grammar_issue");
      });
    });

    describe("2️⃣ Zero Issues", () => {
      it("should return empty array when no corrections or issues found", () => {
        const resultData = {
          corrections: [],
          issues: [],
          status: "SUCCESS",
        };

        const feedback = extractGrammarFeedback(resultData);

        expect(feedback).toEqual([]);
      });

      it("should return empty array when corrections and issues are missing", () => {
        const resultData = {
          status: "SUCCESS",
          other_field: "value",
        };

        const feedback = extractGrammarFeedback(resultData);

        expect(feedback).toEqual([]);
      });

      it("should return empty array when resultData is empty object", () => {
        const resultData = {};

        const feedback = extractGrammarFeedback(resultData);

        expect(feedback).toEqual([]);
      });
    });

    describe("3️⃣ Unexpected Structure", () => {
      it("should handle corrections as object instead of array", () => {
        const resultData = {
          corrections: { error: "Invalid format" },
          issues: [],
        };

        const feedback = extractGrammarFeedback(resultData);

        expect(feedback).toEqual([]);
      });

      it("should handle issues as string instead of array", () => {
        const resultData = {
          corrections: [],
          issues: "not an array",
        };

        const feedback = extractGrammarFeedback(resultData);

        expect(feedback).toEqual([]);
      });

      it("should handle null resultData", () => {
        const resultData = null;

        const feedback = extractGrammarFeedback(resultData);

        expect(feedback).toEqual([]);
      });

      it("should handle resultData as string", () => {
        const resultData = "invalid";

        const feedback = extractGrammarFeedback(resultData);

        expect(feedback).toEqual([]);
      });

      it("should handle malformed correction items", () => {
        const resultData = {
          corrections: [
            null,
            "not an object",
            123,
            { valid: "correction", original: "teh", correction: "the" },
          ],
          issues: [],
        };

        const feedback = extractGrammarFeedback(resultData);

        expect(feedback).toHaveLength(1);
        expect(feedback[0].originalText).toBe("teh");
      });

      it("should handle correction items with missing required fields", () => {
        const resultData = {
          corrections: [
            { someField: "value" },
            { original: "teh", correction: "the" },
          ],
          issues: [],
        };

        const feedback = extractGrammarFeedback(resultData);

        expect(feedback).toHaveLength(1);
        expect(feedback[0].originalText).toBe("teh");
      });
    });

    describe("4️⃣ Field Normalization", () => {
      it("should normalize various original text field names", () => {
        const testCases = [
          { original: "teh", correction: "the" },
          { incorrect: "teh", correct: "the" },
          { wrong: "teh", fix: "the" },
          { error: "teh", replacement: "the" },
          { error_text: "teh", corrected_text: "the" },
          { original_text: "teh", corrected: "the" },
          { text: "teh", suggested: "the" },
          { before: "teh", after: "the" },
        ];

        testCases.forEach((testCase) => {
          const resultData = {
            corrections: [testCase],
            issues: [],
          };

          const feedback = extractGrammarFeedback(resultData);

          expect(feedback).toHaveLength(1);
          expect(feedback[0].originalText).toBe("teh");
          expect(feedback[0].suggestedText).toBe("the");
        });
      });

      it("should normalize various correction field names", () => {
        const testCases = [
          { original: "teh", correction: "the" },
          { original: "teh", corrected: "the" },
          { original: "teh", correct: "the" },
          { original: "teh", replacement: "the" },
          { original: "teh", suggested: "the" },
          { original: "teh", suggestion: "the" },
          { original: "teh", corrected_text: "the" },
          { original: "teh", after: "the" },
          { original: "teh", fix: "the" },
        ];

        testCases.forEach((testCase) => {
          const resultData = {
            corrections: [testCase],
            issues: [],
          };

          const feedback = extractGrammarFeedback(resultData);

          expect(feedback).toHaveLength(1);
          expect(feedback[0].suggestedText).toBe("the");
        });
      });

      it("should generate message when missing", () => {
        const resultData = {
          corrections: [
            { original: "teh", correction: "the" },
            { original: "bad", suggested: "good" },
          ],
          issues: [],
        };

        const feedback = extractGrammarFeedback(resultData);

        expect(feedback).toHaveLength(2);
        expect(feedback[0].message).toContain("teh");
        expect(feedback[0].message).toContain("the");
        expect(feedback[1].message).toContain("bad");
        expect(feedback[1].message).toContain("good");
      });

      it("should infer category when missing", () => {
        const resultData = {
          corrections: [{ original: "teh", correction: "the" }],
          issues: [{ text: "issue", message: "Fix this" }],
        };

        const feedback = extractGrammarFeedback(resultData);

        expect(feedback).toHaveLength(2);
        expect(feedback[0].category).toBe("grammar_correction");
        expect(feedback[1].category).toBe("grammar_issue");
      });

      it("should normalize severity values", () => {
        const resultData = {
          corrections: [
            { original: "teh", correction: "the", severity: "error" },
            { original: "bad", correction: "good", severity: "ERROR" },
            { original: "x", correction: "y", severity: "critical" },
            { original: "a", correction: "b", severity: "info" },
            { original: "c", correction: "d", severity: "INFORMATION" },
            { original: "e", correction: "f", severity: "warning" },
            { original: "g", correction: "h" },
          ],
          issues: [],
        };

        const feedback = extractGrammarFeedback(resultData);

        expect(feedback[0].severity).toBe("error");
        expect(feedback[1].severity).toBe("error");
        expect(feedback[2].severity).toBe("error");
        expect(feedback[3].severity).toBe("info");
        expect(feedback[4].severity).toBe("info");
        expect(feedback[5].severity).toBe("warning");
        expect(feedback[6].severity).toBe("warning");
      });

      it("should extract location information when available", () => {
        const resultData = {
          corrections: [
            {
              original: "teh",
              correction: "the",
              line: 5,
              column: 10,
              offset: 123,
            },
          ],
          issues: [],
        };

        const feedback = extractGrammarFeedback(resultData);

        expect(feedback).toHaveLength(1);
        expect(feedback[0].location).toEqual({
          line: 5,
          column: 10,
          offset: 123,
        });
      });
    });

    describe("5️⃣ Business Logic Wrapper", () => {
      it("should return null for non-completed tasks", () => {
        const resultData = {
          corrections: [{ original: "teh", correction: "the" }],
        };

        expect(
          extractGrammarFeedbackWithBusinessLogic(resultData, "pending")
        ).toBeNull();
        expect(
          extractGrammarFeedbackWithBusinessLogic(resultData, "processing")
        ).toBeNull();
        expect(
          extractGrammarFeedbackWithBusinessLogic(resultData, "failed")
        ).toBeNull();
      });

      it("should return null for completed tasks with no resultData", () => {
        expect(
          extractGrammarFeedbackWithBusinessLogic(null, "completed")
        ).toBeNull();
        expect(
          extractGrammarFeedbackWithBusinessLogic(undefined, "completed")
        ).toBeNull();
      });

      it("should return empty array for completed tasks with no issues", () => {
        const resultData = { corrections: [], issues: [] };

        const feedback = extractGrammarFeedbackWithBusinessLogic(
          resultData,
          "completed"
        );

        expect(feedback).toEqual([]);
      });

      it("should return array for completed tasks with issues", () => {
        const resultData = {
          corrections: [{ original: "teh", correction: "the" }],
          issues: [],
        };

        const feedback = extractGrammarFeedbackWithBusinessLogic(
          resultData,
          "completed"
        );

        expect(feedback).toHaveLength(1);
        expect(feedback?.[0].originalText).toBe("teh");
      });

      it("should return null when extraction throws error", () => {
        const resultData = {
          corrections: [{ original: "teh", correction: "the" }],
        };

        jest.spyOn(console, "error").mockImplementation(() => {});

        const spy = jest
          .spyOn(grammarFeedbackExtract, "extract")
          .mockImplementation(() => {
            throw new Error("Extraction failed");
          });

        const feedback = extractGrammarFeedbackWithBusinessLogic(
          resultData,
          "completed"
        );

        expect(feedback).toBeNull();

        spy.mockRestore();
        jest.restoreAllMocks();
      });
    });
  });
});

type GrammarFeedbackItem = {
  category?: string;
  message: string;
  severity?: "info" | "warning" | "error";
  originalText?: string;
  suggestedText?: string;
  location?: {
    line?: number;
    column?: number;
    offset?: number;
  };
};

type RawGrammarRow = {
  original?: string;
  incorrect?: string;
  wrong?: string;
  error?: string;
  error_text?: string;
  original_text?: string;
  text?: string;
  before?: string;
  correction?: string;
  corrected?: string;
  correct?: string;
  replacement?: string;
  suggested?: string;
  suggestion?: string;
  corrected_text?: string;
  after?: string;
  fix?: string;
  message?: string;
  category?: string;
  type?: string;
  severity?: string;
  line?: number;
  column?: number;
  offset?: number;
};

function extractGrammarFeedbackImpl(
  resultData: unknown
): GrammarFeedbackItem[] {
  if (!resultData || typeof resultData !== "object") {
    return [];
  }

  const data = resultData as Record<string, unknown>;
  const feedback: GrammarFeedbackItem[] = [];
  const corrections = Array.isArray(data.corrections) ? data.corrections : [];
  const issues = Array.isArray(data.issues) ? data.issues : [];

  const processItem = (
    item: unknown,
    source: "correction" | "issue"
  ): GrammarFeedbackItem | null => {
    if (!item || typeof item !== "object") {
      return null;
    }

    const row = item as RawGrammarRow;

    const originalText =
      row.original ||
      row.incorrect ||
      row.wrong ||
      row.error ||
      row.error_text ||
      row.original_text ||
      row.text ||
      row.before;

    const suggestedText =
      row.correction ||
      row.corrected ||
      row.correct ||
      row.replacement ||
      row.suggested ||
      row.suggestion ||
      row.corrected_text ||
      row.after ||
      row.fix;

    if (!originalText && !suggestedText && !row.message) {
      return null;
    }

    let message = row.message;
    if (!message) {
      if (originalText && suggestedText) {
        message = `"${originalText}" should be "${suggestedText}"`;
      } else if (originalText) {
        message = `Issue found: "${originalText}"`;
      } else if (suggestedText) {
        message = `Suggestion: "${suggestedText}"`;
      } else {
        message = "Grammar issue detected";
      }
    }

    let category = row.category || row.type;
    if (!category) {
      category =
        source === "correction" ? "grammar_correction" : "grammar_issue";
    }

    let severity: "info" | "warning" | "error" = "warning";
    if (row.severity) {
      const sev = String(row.severity).toLowerCase();
      if (sev === "error" || sev === "critical") {
        severity = "error";
      } else if (sev === "info" || sev === "information") {
        severity = "info";
      } else {
        severity = "warning";
      }
    } else {
      severity = source === "correction" ? "warning" : "info";
    }

    const location: NonNullable<GrammarFeedbackItem["location"]> = {};
    if (typeof row.line === "number") {
      location.line = row.line;
    }
    if (typeof row.column === "number") {
      location.column = row.column;
    }
    if (typeof row.offset === "number") {
      location.offset = row.offset;
    }

    return {
      category,
      message,
      severity,
      originalText: originalText || undefined,
      suggestedText: suggestedText || undefined,
      location: Object.keys(location).length > 0 ? location : undefined,
    };
  };

  for (const item of corrections) {
    const feedbackItem = processItem(item, "correction");
    if (feedbackItem) {
      feedback.push(feedbackItem);
    }
  }

  for (const item of issues) {
    const feedbackItem = processItem(item, "issue");
    if (feedbackItem) {
      feedback.push(feedbackItem);
    }
  }

  return feedback;
}

const grammarFeedbackExtract = {
  extract: extractGrammarFeedbackImpl,
};

function extractGrammarFeedback(resultData: unknown): GrammarFeedbackItem[] {
  return grammarFeedbackExtract.extract(resultData);
}

function extractGrammarFeedbackWithBusinessLogic(
  resultData: unknown,
  taskStatus: string
): GrammarFeedbackItem[] | null {
  if (taskStatus !== "completed") {
    return null;
  }

  if (!resultData || typeof resultData !== "object") {
    return null;
  }

  try {
    const feedback = extractGrammarFeedback(resultData);
    return feedback;
  } catch (error) {
    console.error(
      "[GrammarFeedback] Failed to extract feedback (parsing failed, returning null):",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

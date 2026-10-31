# Money is integer minor units; dates are ISO 8601; text is English

Money is held as integer minor units (satang), matching `tax-core`, to avoid floating-point drift. JSON carries decimal strings plus a currency (`"12345.67"`, `"THB"`). Dates are ISO 8601 Gregorian, never the Buddhist calendar. CLI text is English only; Thai free text in user data is preserved as UTF-8.

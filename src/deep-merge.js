/**
 * deepMerge deep merges two objects together.
 * @param {Record<string,any>} options
 * @param {Record<string,any>} [overrides]
 * @param {boolean} [lowerCase]
 * @returns {Partial<opts>}
 */
export function deepMerge(options, overrides, lowerCase) {
	if (Array.isArray(options)) return options.concat(overrides);

	let out = {};
	for (let opt in options) {
		const key = lowerCase ? opt.toLowerCase() : opt;
		out[key] = options[opt];
	}
	for (let override in overrides) {
		const key = lowerCase ? override.toLowerCase() : override;
		const value = overrides[override];
		out[key] =
			key in out && typeof value == 'object'
				? deepMerge(out[key], value, lowerCase || key === 'headers')
				: value;
	}

	return out;
}

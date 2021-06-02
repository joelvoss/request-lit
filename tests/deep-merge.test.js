import { deepMerge } from '../src/deep-merge';

describe('deepMerge', () => {
	it(`should concat two arrays`, () => {
		const arr1 = [1, 2, 3];
		const arr2 = [2, 4, 5];
		const merged = deepMerge(arr1, arr2);

		expect(merged).toEqual([1, 2, 3, 2, 4, 5]);
	});

	it(`should deep merge two objects`, () => {
		const obj1 = { a: { b: 2 }, c: 'test' };
		const obj2 = { a: { b: 10 }, d: 'merge' };
		const merged = deepMerge(obj1, obj2);

		expect(merged).toEqual({
			a: {
				b: 10,
			},
			c: 'test',
			d: 'merge',
		});
	});

	it(`should deep merge two objects and uppercase keys`, () => {
		const obj1 = { A: { B: 2 }, C: 'test' };
		const obj2 = { a: { b: 10 }, D: 'merge' };
		const merged = deepMerge(obj1, obj2, true);

		expect(merged).toEqual({
			a: {
				b: 10,
			},
			c: 'test',
			d: 'merge',
		});
	});
});

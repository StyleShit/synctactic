import { describe, expect, it, vi } from 'vitest';
import { sync } from '../sync';

describe('Syncmatic', () => {
	it('should subscribe to changes and sync on each change', () => {
		// Arrange.
		const eventEmitter = createEventEmitter();
		const syncFn = vi.fn();

		// Act.
		sync({
			subscribe: (cb) => eventEmitter.subscribe(cb),
			syncFn,
		});

		// Assert.
		expect(syncFn).toHaveBeenCalledTimes(0);

		// Act.
		eventEmitter.notify();

		// Assert.
		expect(syncFn).toHaveBeenCalledTimes(1);
	});

	it('should abort previous syncs', () => {
		// Arrange.
		const signals: AbortSignal[] = [];

		const eventEmitter = createEventEmitter();

		const syncFn = vi.fn((_signal: AbortSignal) => {
			signals.push(_signal);
		});

		sync({
			subscribe: (cb) => eventEmitter.subscribe(cb),
			syncFn,
		});

		// Act.
		eventEmitter.notify();
		eventEmitter.notify();

		// Assert.
		expect(syncFn).toHaveBeenCalledTimes(2);

		expect(signals[0]?.aborted).toBe(true);
		expect(signals[1]?.aborted).toBe(false);
	});

	it('should cleanup on sync stop', () => {
		// Arrange.
		const eventEmitter = createEventEmitter();

		const syncFn = vi.fn();

		const { unSync } = sync({
			subscribe: (cb) => eventEmitter.subscribe(cb),
			syncFn,
		});

		// Act.
		unSync();

		eventEmitter.notify();

		// Assert.
		expect(syncFn).not.toHaveBeenCalled();
	});

	it('should support force sync', () => {
		// Arrange.
		const eventEmitter = createEventEmitter();

		const syncFn = vi.fn();

		const { forceSync } = sync({
			subscribe: (cb) => eventEmitter.subscribe(cb),
			syncFn,
		});

		// Act.
		void forceSync();

		// Assert.
		expect(syncFn).toHaveBeenCalledTimes(1);
	});
});

function createEventEmitter() {
	const listeners = new Set<() => void>();

	return {
		subscribe(cb: () => void) {
			listeners.add(cb);

			return () => {
				listeners.delete(cb);
			};
		},
		notify() {
			listeners.forEach((cb) => {
				cb();
			});
		},
		getAll() {
			return listeners;
		},
	};
}

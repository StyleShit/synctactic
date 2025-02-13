import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { sync } from '../sync';

describe('Syncmatic', () => {
	beforeAll(() => {
		vi.useFakeTimers();
	});

	afterAll(() => {
		vi.useRealTimers();
	});

	it('should subscribe to changes and run a delayed sync on each change', () => {
		// Arrange.
		const eventEmitter = createEventEmitter();
		const syncFn = vi.fn();

		// Act.
		const { unSync } = sync({
			subscribe: (cb) => eventEmitter.subscribe(cb),
			syncFn,
			wait: 100,
		});

		// Assert.
		expect(syncFn).toHaveBeenCalledTimes(0);

		// Act.
		eventEmitter.notify();
		eventEmitter.notify();
		eventEmitter.notify();

		// Assert.
		expect(syncFn).not.toHaveBeenCalled();

		// Act.
		vi.runAllTimers();

		// Assert.
		expect(syncFn).toHaveBeenCalledTimes(1);

		// Cleanup.
		unSync();
	});

	it('should abort previous syncs', () => {
		// Arrange.
		const signals: AbortSignal[] = [];

		const eventEmitter = createEventEmitter();

		const syncFn = vi.fn((_signal: AbortSignal) => {
			signals.push(_signal);

			return sleep(500);
		});

		const { unSync } = sync({
			subscribe: (cb) => eventEmitter.subscribe(cb),
			syncFn,
			wait: 100,
		});

		// Act - Initiate a first sync.
		eventEmitter.notify();
		vi.advanceTimersByTime(100);

		// Act - Initiate a second sync that should abort the first sync.
		eventEmitter.notify();
		vi.advanceTimersByTime(100);

		// Assert.
		expect(syncFn).toHaveBeenCalledTimes(2);

		expect(signals[0]?.aborted).toBe(true);
		expect(signals[1]?.aborted).toBe(false);

		// Cleanup.
		unSync();
	});

	it('should block page unload when there is an active sync', () => {
		// Arrange.
		const eventEmitter = createEventEmitter();

		const syncFn = vi.fn(() => sleep(500));

		const { unSync } = sync({
			subscribe: (cb) => eventEmitter.subscribe(cb),
			syncFn,
			wait: 100,
			options: {
				notifyOnLeave: true,
			},
		});

		// Act - Initiate a sync.
		eventEmitter.notify();
		vi.advanceTimersByTime(100);

		// Act - Attempt to unload the page.
		const event = new Event('beforeunload');

		event.preventDefault = vi.fn();

		window.dispatchEvent(event);

		// Assert.
		// eslint-disable-next-line @typescript-eslint/unbound-method
		expect(event.preventDefault).toHaveBeenCalledTimes(1);

		// Cleanup.
		unSync();
	});

	it('should cleanup on sync stop', () => {
		// Arrange.
		const eventEmitter = createEventEmitter();

		const syncFn = vi.fn();

		const { unSync } = sync({
			subscribe: (cb) => eventEmitter.subscribe(cb),
			syncFn,
			wait: 100,
		});

		// Act.
		unSync();

		eventEmitter.notify();

		// Assert.
		expect(syncFn).not.toHaveBeenCalled();
	});

	it('should flush a pending sync on stop', () => {
		// Arrange.
		const eventEmitter = createEventEmitter();

		const syncFn = vi.fn(() => sleep(500));

		const { unSync } = sync({
			subscribe: (cb) => eventEmitter.subscribe(cb),
			syncFn,
			wait: 100,
		});

		// Act - Initiate a sync.
		eventEmitter.notify();

		// Act - Stop the sync.
		unSync();

		// Assert.
		expect(syncFn).toHaveBeenCalledTimes(1);
	});

	it('should support force sync', () => {
		// Arrange.
		const eventEmitter = createEventEmitter();

		const syncFn = vi.fn();

		const { forceSync, unSync } = sync({
			subscribe: (cb) => eventEmitter.subscribe(cb),
			syncFn,
			wait: 100,
		});

		// Act.
		forceSync();

		// Assert.
		expect(syncFn).toHaveBeenCalledTimes(1);

		// Cleanup.
		unSync();
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

function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

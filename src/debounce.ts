export function debounce<TArgs extends unknown[]>(
	fn: (...args: TArgs) => unknown,
	wait: number,
) {
	let timer: ReturnType<typeof setTimeout> | null = null;

	const cancel = () => {
		if (!timer) {
			return;
		}

		clearTimeout(timer);
		timer = null;
	};

	const flush = (...args: TArgs) => {
		cancel();

		fn(...args);
	};

	const run = (...args: TArgs) => {
		cancel();

		timer = setTimeout(() => {
			fn(...args);

			timer = null;
		}, wait);
	};

	const pending = () => !!timer;

	run.flush = flush;
	run.cancel = cancel;
	run.pending = pending;

	return run;
}

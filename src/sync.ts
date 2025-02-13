import { debounce } from './debounce';

export type SyncArgs = {
	subscribe: (cb: () => unknown) => () => void;
	syncFn: (signal: AbortSignal) => unknown;
	options: {
		wait: number;
	};
};

export function sync({ subscribe, syncFn, options }: SyncArgs) {
	let abortController: AbortController | null = null;

	const _sync = debounce(async () => {
		abortController?.abort();

		abortController = new AbortController();

		await syncFn(abortController.signal);
	}, options.wait);

	const unsubscribe = subscribe(_sync);

	const unSync = () => {
		if (_sync.pending()) {
			_sync.flush();
		}

		unsubscribe();
	};

	return {
		unSync,
		forceSync: _sync.flush,
	};
}

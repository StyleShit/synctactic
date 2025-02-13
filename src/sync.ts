import { debounce } from './debounce';

export type SyncArgs = {
	subscribe: (cb: () => unknown) => () => void;
	syncFn: (signal: AbortSignal) => unknown;
	options?: {
		wait?: number;
		notifyOnLeave?: boolean;
	};
};

export function sync({ subscribe, syncFn, options = {} }: SyncArgs) {
	const { notifyOnLeave = false, wait = 0 } = options;

	let isSyncing = false;
	let abortController: AbortController | null = null;

	const _sync = debounce(async () => {
		isSyncing = true;

		abortController?.abort();

		abortController = new AbortController();

		await syncFn(abortController.signal);

		isSyncing = false;
	}, wait);

	const flushIfNeeded = () => {
		if (_sync.pending()) {
			_sync.flush();
		}
	};

	const unsubscribe = subscribe(_sync);

	const onUnload = (e: BeforeUnloadEvent) => {
		if (isSyncing || _sync.pending()) {
			e.preventDefault();
		}

		flushIfNeeded();
	};

	if (notifyOnLeave) {
		window.addEventListener('beforeunload', onUnload);
	}

	const unSync = () => {
		flushIfNeeded();

		unsubscribe();

		window.removeEventListener('beforeunload', onUnload);
	};

	return {
		unSync,
		forceSync: _sync.flush,
	};
}

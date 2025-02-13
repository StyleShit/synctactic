import { debounce } from './debounce';

export type SyncArgs = {
	subscribe: (cb: () => unknown) => () => void;
	syncFn: (signal: AbortSignal) => unknown;
	wait: number;
	options?: {
		notifyOnLeave?: boolean;
	};
};

export function sync({ subscribe, syncFn, wait, options = {} }: SyncArgs) {
	const { notifyOnLeave } = options;

	let abortController: AbortController | null = null;
	let isSyncing = false;

	const _sync = debounce(async () => {
		isSyncing = true;

		abortController?.abort();

		abortController = new AbortController();

		await syncFn(abortController.signal);

		isSyncing = false;
	}, wait);

	const unsubscribe = subscribe(_sync);

	const onUnload = (e: BeforeUnloadEvent) => {
		if (isSyncing) {
			e.preventDefault();
		}
	};

	if (notifyOnLeave) {
		window.addEventListener('beforeunload', onUnload);
	}

	const unSync = () => {
		if (_sync.pending()) {
			_sync.flush();
		}

		unsubscribe();

		window.removeEventListener('beforeunload', onUnload);
	};

	return {
		unSync,
		forceSync: _sync.flush,
	};
}

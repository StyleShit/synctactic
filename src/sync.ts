export type SyncArgs = {
	subscribe: (cb: () => unknown) => () => void;
	syncFn: (signal: AbortSignal) => unknown;
};

export function sync({ subscribe, syncFn }: SyncArgs) {
	let abortController: AbortController | null = null;

	const _sync = async () => {
		abortController?.abort();

		abortController = new AbortController();

		await syncFn(abortController.signal);
	};

	const unsubscribe = subscribe(_sync);

	const unSync = () => {
		unsubscribe();
	};

	return {
		unSync,
		forceSync: _sync,
	};
}

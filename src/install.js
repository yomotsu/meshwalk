export let THREE; // bind on install

export const onInstallHandlers = [];
export function install( _THREE ) {

	if ( THREE && _THREE === THREE ) {

		console.error( '[THREE] already installed. `install` should be called only once.' );
		return;

	}

	THREE = _THREE;
	onInstallHandlers.forEach( ( handler ) => handler() );

}

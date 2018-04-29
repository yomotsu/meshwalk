export let THREE; // bind on install

export function install( _THREE ) {

	if ( THREE && _THREE === THREE ) {

		if ( process.env.NODE_ENV !== 'production' ) {

			console.error( '[THREE] already installed. `install` should be called only once.' );

		}

		return;

	}

	THREE = _THREE;

}


importScripts('/sodium.js')
let workerData;
function crackPin() {
	const pindata = workerData.pindata
	const start = workerData.start
	const salt = fromhex_chksum(pindata.salt);
	for (let i = start; i < start+100000; i++) {
		const pin = i.toString().padStart(6, '0')
		const hash = tohex_chksum(sodium.crypto_shorthash(pin, salt));
		if (hash === pindata.hash) {
			postMessage(pin);
		}
	}

	function tohex_chksum(data) {
		if (typeof data == 'string') data = sodium.from_string(data);
		return sodium.crypto_generichash(4, data, '', 'hex') + sodium.to_hex(data);
	}
	function fromhex_chksum(hex, format) {
		var chksum = hex.slice(0,8);
		var payload = sodium.from_hex(hex.slice(8));
		if (sodium.crypto_generichash(4, payload, '', 'hex') != chksum) return false;
		if (format == 'string') return sodium.to_string(payload);
		return payload;
	}
}

addEventListener('message', (evt) => {
    if (evt.data.workerData) {
        workerData = evt.data.workerData;
        crackPin();
    }
  });


// @ts-check

// declare global vars
// @ts-ignore
const importScripts = importScripts;
// @ts-ignore
const sodium = sodium;

importScripts("/sodium.js");

/**
 * @param {{
 *   pindata: {
 * 	   salt: string,
 *     hash: string
 *   },
 *   start: number
 * }} workerData
 */
function crackPin(workerData) {
  const pindata = workerData.pindata;
  const start = workerData.start;

  const salt = fromhex_chksum(pindata.salt);
  if (!salt) {
    throw new Error("Invalid salt");
  }

  for (let i = start; i < start + 100000; i++) {
    const pin = i.toString().padStart(6, "0");
    const hash = tohex_chksum(sodium.crypto_shorthash(pin, salt));
    if (hash === pindata.hash) {
      postMessage(pin);
    }
  }

  /**
   * @param {string} data
   * @returns {string}
   */
  function tohex_chksum(data) {
    if (typeof data == "string") data = sodium.from_string(data);
    return sodium.crypto_generichash(4, data, "", "hex") + sodium.to_hex(data);
  }

  /**
   * @param {string} hex
   * @returns {string | false}
   */
  function fromhex_chksum(hex) {
    const chksum = hex.slice(0, 8);
    const payload = sodium.from_hex(hex.slice(8));
    if (sodium.crypto_generichash(4, payload, "", "hex") != chksum) {
      return false;
    }
    return payload;
  }
}

addEventListener("message", (evt) => {
  if (evt.data.workerData) {
    crackPin(evt.data.workerData);
  }
});

importScripts('/sodium.js')
let workerData

async function crackRecoveryPhrase() {
  const rpdata = workerData.rpdata;
  while (true) {
    const recoveryPhrase = await generateRecoveryPhrase();
    salt1 = fromhex_chksum(rpdata.salt1);
    salt2 = fromhex_chksum(rpdata.salt2);
    var rphash = sodium.crypto_pwhash_scryptsalsa208sha256(
      16,
      sodium.crypto_pwhash_scryptsalsa208sha256(
        16,
        recoveryPhrase,
        salt1,
        4 /*sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE*/,
        33554432 /*sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE*/
      ),
      salt2,
      4 /*sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE*/,
      33554432 /*sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE*/
    );

    rphash = tohex_chksum(rphash);
    if (rphash == rpdata.hash) {
      if (debug) console.log("validatePassphrase - correct");
		return recoveryPhrase
    }
  }
  function tohex_chksum(data) {
    if (typeof data == "string") data = sodium.from_string(data);
    return sodium.crypto_generichash(4, data, "", "hex") + sodium.to_hex(data);
  }
  function fromhex_chksum(hex, format) {
    var chksum = hex.slice(0, 8);
    var payload = sodium.from_hex(hex.slice(8));
    if (sodium.crypto_generichash(4, payload, "", "hex") != chksum)
      return false;
    if (format == "string") return sodium.to_string(payload);
    return payload;
  }
}

addEventListener("message", (evt) => {
  if (evt.data.workerData) {
      workerData = evt.data.workerData;
      crackRecoveryPhrase();
  }
});


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function generateRecoveryPhrase() {
  var randomWord = async function (j) {
    var vowels = ["a", "e", "i", "o", "u"];
    var consts = [
      "b",
      "c",
      "d",
      "f",
      "g",
      "h",
      "j",
      "k",
      "l",
      "m",
      "n",
      "p",
      "qu",
      "r",
      "s",
      "t",
      "v",
      "w",
      "x",
      "y",
      "z",
      "tt",
      "ch",
      "sh",
    ];
    var len = 4;
    var word = "";
    var is_vowel = false;
    var arr;

    for (var i = 0; i < len; i++) {
      let letterFromParent = i === 0 && j === 0;
      if (is_vowel) arr = vowels;
      else arr = consts;
      is_vowel = !is_vowel;
      word +=
        arr[
          letterFromParent
            ? workerData.start
            : sodium.randombytes_random() % arr.length
        ];
      await sleep(0);
    }
    return word;
  };

  var rp = "";
  for (var i = 0; i < 6; i++) {
    rp += (await randomWord(i)) + (i == 5 ? "" : " ");
  }
  console.log(rp)

  return rp;
}

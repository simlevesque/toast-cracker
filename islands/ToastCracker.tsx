import { signal } from "@preact/signals";
import { Button } from "../components/Button.tsx";

declare const sodium: any;

const wallet = signal<undefined | Record<string, any>>(undefined);
const validHash = signal<undefined | boolean>(undefined);
const validWallet = signal<undefined | boolean>(undefined);
const pin = signal<undefined | any>(undefined);
const recoveryPhrase = signal<undefined | any>(undefined);

export default function ToastCracker() {
  const initialValue = "";

  return (
    <>
      <div
        class="gap-2 py-6"
        style="width: 100%;"
      >
        <p class="my-4 text-center">
          Paste backup here:
        </p>
        <textarea
          id="recovery"
          value={initialValue}
          style="width: 100%; min-height: 150px;"
        >
        </textarea>
      </div>

      <div class="gap-2 py-6">
        <Button
          type="submit"
          onClick={() => {
            crackWallet(document.getElementById("recovery")!.value);
          }}
        >
          Start
        </Button>
      </div>
      {wallet.value &&
        (
          <div class="gap-8 py-6">
            <p class="my-4 text-center">
              <b>
                Valid hash:{" "}
                <span
                  style={{
                    color: validHash.value ? "lightgreen" : "red",
                  }}
                >
                  {(validHash.value || false).toString()}
                </span>
              </b>
            </p>
            <p class="my-4 text-center">
              <b>
                Valid wallet:{" "}
                <span
                  style={{
                    color: validWallet.value ? "lightgreen" : "red",
                  }}
                >
                  {(validWallet.value || false).toString()}
                </span>
              </b>
            </p>
            {validWallet.value && validHash.value
              ? (
                <>
                  <p class="my-4 text-center">
                    <b>Accounts: {wallet.value.accounts.length}</b>
                    <ul>
                      {Object.values(wallet.value.accounts).map((acc) => (
                        <li>{acc.nickname}</li>
                      ))}
                    </ul>
                  </p>
                  <p class="my-4 text-center">
                    <b>
                      Pin:
                    </b>
                    {pin.value || "Loading..."}
                  </p>
                </>
              )
              : undefined}
          </div>
        )}
    </>
  );

  async function crackWallet(file: string) {
    if (!file) {
      return;
    }
    const walletFileCleaned = ("" + file).trim();
    const hash = walletFileCleaned.slice(0, 8);
    const walletStr = walletFileCleaned.slice(8);

    if (hash !== sodium.crypto_generichash(4, walletStr, "", "hex")) {
      console.error("Invalid hash");
      validHash.value = false;
      wallet.value = {};
      return;
    }
    const _wallet = JSON.parse(walletStr);

    if (
      _wallet.pindata == undefined || _wallet.ppdata == undefined ||
      _wallet.rpdata == undefined || _wallet.accounts == undefined
    ) {
      console.error("Invalid wallet");
      validWallet.value = false;
      wallet.value = {};
      return;
    }

    validHash.value = true;
    validWallet.value = true;

    wallet.value = _wallet;

    const _pin = await crackPin(wallet.value!.pindata);
    pin.value = _pin;

    return;

    const _recoveryPhrase = await crackRecoveryPhrase(_wallet.rpdata);
    console.log("Recovery passphrase: ", _recoveryPhrase);
    recoveryPhrase.value = _recoveryPhrase;
  }

  function crackPin(pindata: any) {
    console.time("Got pin");
    return new Promise((resolve, reject) => {
      const workers = new Array(10).fill(null).map((_, i) => {
        console.log("Starting worker");
        const worker = new Worker("/pin-worker.js");
        worker.addEventListener("message", (e) => {
          workers.forEach((w) => w.terminate());
          console.timeEnd("Got pin");
          resolve(e.data);
        });
        worker.addEventListener("start", console.log);
        worker.addEventListener("error", console.error);
        worker.addEventListener("exit", (code) => {
          if (code !== 0) {
            console.error(new Error(`Worker stopped with exit code ${code}`));
          }
        });
        worker.postMessage({
          workerData: { pindata, start: i * 100000 },
        });
        return worker;
      });
    });
  }

  /**
   * @param {{
   *  salt1: string,
   *  salt2: string,
   *  hash: string
   * }} rpdata
   */
  function crackRecoveryPhrase(rpdata) {
    console.time("Got recovery passphrase");
    return new Promise((resolve, reject) => {
      const workers = new Array(24).fill(null).map((_, i) => {
        const worker = new Worker("/recovery-phrase-worker.js");
        worker.addEventListener("message", (e) => {
          workers.forEach((w) => w.terminate());
          console.timeEnd("Got recovery passphrase");
          resolve(e.data);
        });
        worker.addEventListener("error", console.error);
        worker.addEventListener("exit", (code) => {
          if (code !== 0) {
            console.error(new Error(`Worker stopped with exit code ${code}`));
          }
        });
        worker.postMessage({
          workerData: { rpdata, start: Math.floor(i) },
        });
        return worker;
      });
    });
  }
}
